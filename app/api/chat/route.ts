import { convertToModelMessages, stepCountIs, streamText, type SystemModelMessage, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { after } from "next/server";
import { resolveAdminModel } from "@/lib/admin-cookie";
import { rejectBots } from "@/lib/bot-protection";
import { parseId, parseVisitContext } from "@/lib/analytics";
import { blockedChatResponse } from "@/lib/blocked-chat";
import { chatTools } from "@/lib/chat-tools";
import { parseClientIp } from "@/lib/client-ip";
import { BLOCKED_REPLY, intentNudge, screenForStore, threadIsClosed } from "@/lib/jev-decision";
import { screenVisitorTurn } from "@/lib/jev.server";
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
import { storeApi, storeMutationQuietly, storeQuery } from "@/lib/store.server";
import { getSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200 * 1024;

export async function POST(req: Request) {
  const clientIp = getClientIp(req.headers);
  const limit = checkRateLimits([
    [chatIpLimiter, clientIp],
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

  // Jev screens the turn before the reply model. No key skips it. A chat that was
  // already blocked stays closed, and does not call Jev or the reply model again.
  const conversationId = parseId(fields.conversationId);
  const transcriptClosed = threadIsClosed(messages);
  const chatClosed = transcriptClosed || (await storedChatIsBlocked(transcriptClosed ? undefined : conversationId));
  const decision = chatClosed ? null : await screenVisitorTurn(messages);
  const refusing = chatClosed || decision?.action === "block";
  const screen = screenForStore(decision, {
    chatClosed,
    clientIp: refusing ? parseClientIp(clientIp) : undefined,
  });
  const userText = messageText(messages[messages.length - 1]);
  const recordUser = () => {
    if (!conversationId) return Promise.resolve();
    return storeMutationQuietly(storeApi.chats.recordUserMessage, {
      conversationId,
      visitId: parseId(fields.visitId),
      context: parseVisitContext(fields.context),
      model: modelId,
      text: userText,
      ...(screen ? { screen } : {}),
    });
  };

  if (refusing) {
    // Write the block before the response, so a follow-up turn already sees it.
    if (conversationId) {
      await recordUser();
      await storeMutationQuietly(storeApi.chats.recordReply, {
        conversationId,
        text: BLOCKED_REPLY,
        tools: [],
      });
    }
    return blockedChatResponse(BLOCKED_REPLY);
  }

  const model = createModel(modelId);
  const modelOption = getModelOption(modelId);

  // The system prompt is static, so let Anthropic cache it. OpenAI caches
  // long prefixes automatically and ignores this. A Jev nudge, when there is
  // one, is a second system message so the cached prefix stays stable.
  const system: SystemModelMessage = {
    role: "system",
    content: getSystemPrompt(),
    ...(modelOption.provider === "Anthropic"
      ? { providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }
      : {}),
  };
  const nudgeKind = decision?.nudge;
  const nudge = nudgeKind === "book" || nudgeKind === "email" ? intentNudge(nudgeKind) : null;

  const result = streamText({
    model,
    messages: [system, ...(nudge ? [{ role: "system" as const, content: nudge }] : []), ...convertToModelMessages(messages)],
    tools: chatTools,
    stopWhen: stepCountIs(3),
    maxOutputTokens: 800,
    // Only the first step is forced, so the model can still write the reply after the card.
    ...(decision?.forceTool
      ? {
          prepareStep: ({ stepNumber }: { stepNumber: number }) =>
            stepNumber === 0 ? { toolChoice: "required" as const } : { toolChoice: "auto" as const },
        }
      : {}),
  });

  // The transcript (kept 90 days, see convex/), stored after the response so the
  // reply never waits on it. conversationId is the id of the chat's first message.
  if (conversationId) {
    after(async () => {
      await recordUser();
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

async function storedChatIsBlocked(conversationId: string | undefined): Promise<boolean> {
  if (!conversationId) return false;
  try {
    const state = await storeQuery<{ blocked?: boolean } | null>(storeApi.chats.blockState, { conversationId });
    return state?.blocked === true;
  } catch {
    // The transcript check still closes an honest client. Don't echo the visitor's text.
    console.error("Could not read whether this chat was already blocked.");
    return false;
  }
}

function messageText(message: UIMessage | undefined): string {
  return (message?.parts ?? [])
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n");
}
