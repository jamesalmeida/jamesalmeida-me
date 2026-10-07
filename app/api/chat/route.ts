import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { cookies } from "next/headers";
import { resolveAdminModel } from "@/lib/admin-cookie";
import { rejectBots } from "@/lib/bot-protection";
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
import { sanitizeMessages } from "@/lib/sanitize-messages";
import { getSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 200 * 1024;

export async function POST(req: Request) {
  const limit = checkRateLimits([
    [chatIpLimiter, getClientIp(req.headers)],
    [chatGlobalLimiter, "global"],
  ]);
  if (!limit.ok) return rateLimitedResponse(limit.retryAfterSeconds);

  const botResponse = await rejectBots();
  if (botResponse) return botResponse;

  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const messagesField =
    body && typeof body === "object" && "messages" in body
      ? (body as { messages?: unknown }).messages
      : undefined;
  const messages = sanitizeMessages(messagesField);
  if (messages.length === 0 || !messages.some((message) => message.role === "user")) {
    return Response.json({ error: "A user message is required." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const modelId = resolveAdminModel(cookieStore.get(MODEL_COOKIE_NAME)?.value);
  const model = createModel(modelId);
  const modelOption = getModelOption(modelId);

  const result = streamText({
    model,
    system: getSystemPrompt(),
    messages: convertToModelMessages(messages),
    tools: chatTools,
    stopWhen: stepCountIs(3),
    maxOutputTokens: 800,
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return { model: modelOption.id };
      }

      if (part.type === "finish") {
        return {
          model: modelOption.id,
          totalTokens: part.totalUsage?.totalTokens,
        };
      }

      return undefined;
    },
  });
}
