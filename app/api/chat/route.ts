import { convertToModelMessages, stepCountIs, streamText, type SystemModelMessage, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { after } from "next/server";
import { resolveAdminModel } from "@/lib/admin-cookie";
import { rejectBots } from "@/lib/bot-protection";
import { parseId, parseVisitContext } from "@/lib/analytics";
import { chatTools } from "@/lib/chat-tools";
import { getModelOption, MODEL_COOKIE_NAME } from "@/lib/models";
import { createModel } from "@/lib/models.server";
import {
  chatGlobalLimiter,
  chatIpLimiter,
  checkRateLimits,
  getClientIp,
  rateLimitedResponse,
} from "@/lib/rate-limit";
import { payloadTooLargeResponse, readBodyWithLimit } from "@/lib/request-body";
import { sanitizeMessages } from "@/lib/sanitize-messages";
import { storeApi, storeMutationQuietly } from "@/lib/store.server";
import { getSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200 * 1024;

export async function POST(req: Request) {
  const limit = checkRateLimits([
    [chatIpLimiter, getClientIp(req.headers)],
    [chatGlobalLimiter, "global"],
  ]);
  if (!limit.ok) return rateLimitedResponse(limit.retryAfterSeconds);

  const botResponse = await rejectBots();
  if (botResponse) return botResponse;

  const bodyResult = await readBodyWithLimit(req, MAX_BODY_BYTES);
  if (!bodyResult.ok) return payloadTooLargeResponse();

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const fields = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const messages = sanitizeMessages(fields.messages);
  if (messages.length === 0 || !messages.some((message) => message.role === "user")) {
    return Response.json({ error: "A user message is required." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const modelId = resolveAdminModel(cookieStore.get(MODEL_COOKIE_NAME)?.value);
  const model = createModel(modelId);
  const modelOption = getModelOption(modelId);

  // The system prompt is static, so let Anthropic cache it. OpenAI caches
  // long prefixes automatically and ignores this.
  const system: SystemModelMessage = {
    role: "system",
    content: getSystemPrompt(),
    ...(modelOption.provider === "Anthropic"
      ? { providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }
      : {}),
  };

  const result = streamText({
    model,
    messages: [system, ...convertToModelMessages(messages)],
    tools: chatTools,
    stopWhen: stepCountIs(3),
    maxOutputTokens: 800,
  });

  // The transcript (kept 90 days, see convex/), stored after the response so the
  // reply never waits on it. conversationId is the id of the chat's first message.
  const conversationId = parseId(fields.conversationId);
  if (conversationId) {
    const userText = messageText(messages[messages.length - 1]);
    after(async () => {
      await storeMutationQuietly(storeApi.chats.recordUserMessage, {
        conversationId,
        visitId: parseId(fields.visitId),
        context: parseVisitContext(fields.context),
        model: modelId,
        text: userText,
      });
      try {
        const steps = await result.steps;
        await storeMutationQuietly(storeApi.chats.recordReply, {
          conversationId,
          text: steps.map((step) => step.text).filter(Boolean).join("\n\n"),
          tools: steps.flatMap((step) => step.toolCalls.map((call) => call.toolName)),
        });
      } catch {
        // The run failed or was stopped; the user's message is still recorded.
      }
    });
  }

  return result.toUIMessageStreamResponse();
}

function messageText(message: UIMessage | undefined): string {
  return (message?.parts ?? [])
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n");
}
