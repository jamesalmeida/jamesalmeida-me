import { generateText } from "ai";
import { cookies } from "next/headers";
import { resolveAdminModel } from "@/lib/admin-cookie";
import { rejectBots } from "@/lib/bot-protection";
import { MODEL_COOKIE_NAME } from "@/lib/models";
import { createModel } from "@/lib/models.server";
import { getClientIp, rateLimitedResponse, titleIpLimiter } from "@/lib/rate-limit";
import { payloadTooLargeResponse, readBodyWithLimit } from "@/lib/request-body";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10 * 1024;

export async function POST(req: Request) {
  const limit = titleIpLimiter.check(getClientIp(req.headers));
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

  const message =
    body && typeof body === "object" && "message" in body
      ? (body as { message?: unknown }).message
      : undefined;

  if (typeof message !== "string") {
    return Response.json({ error: "Message must be a string." }, { status: 400 });
  }

  const promptMessage = message.slice(0, 500);
  if (!promptMessage.trim()) {
    return Response.json({ title: null });
  }

  const cookieStore = await cookies();
  const modelId = resolveAdminModel(cookieStore.get(MODEL_COOKIE_NAME)?.value);
  const model = createModel(modelId);

  let text: string;
  try {
    ({ text } = await generateText({
      model,
      maxOutputTokens: 20,
      system:
        "You are a title generator. Given a user message, output 1–3 words that label the topic. No markdown, no hashtags, no quotes, no punctuation, no explanation. Never include \"James\" or \"James Almeida\". Examples: Tech Stack, Career Timeline, Product Work, Sheldn.ai, Consulting, Contact Info, AI Training, Frontend Rebuilds.",
      prompt: `Label this message in 1–3 words: "${promptMessage}"`,
    }));
  } catch (error) {
    // Titles are optional; a provider error should not surface as a 500.
    console.error("generate-title failed", error);
    return Response.json({ title: null });
  }

  let title = text
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/[.!?:,]$/g, "");
  const firstLine = title.split("\n")[0].trim();
  title = firstLine;
  if (title.length > 30) {
    const truncated = title.slice(0, 30);
    const lastSpace = truncated.lastIndexOf(" ");
    title = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  }

  return Response.json({ title: title || null });
}
