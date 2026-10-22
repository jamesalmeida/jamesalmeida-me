import "server-only";

import { rejectBots } from "@/lib/bot-protection";
import { getClientIp, rateLimitedResponse, type RateLimiter } from "@/lib/rate-limit";
import { payloadTooLargeResponse, readBodyWithLimit } from "@/lib/request-body";

/**
 * The checks every public POST runs, in order: rate limit → BotID → body cap → JSON.
 * Returns the parsed body, or the error response to send.
 */
export async function readPublicJson(
  request: Request,
  limiter: RateLimiter,
  maxBytes: number,
): Promise<{ body: unknown } | { response: Response }> {
  const limit = limiter.check(getClientIp(request.headers));
  if (!limit.ok) return { response: rateLimitedResponse(limit.retryAfterSeconds) };

  const botResponse = await rejectBots();
  if (botResponse) return { response: botResponse };

  const bodyResult = await readBodyWithLimit(request, maxBytes);
  if (!bodyResult.ok) return { response: payloadTooLargeResponse() };
  try {
    return { body: JSON.parse(bodyResult.text) };
  } catch {
    return { response: Response.json({ error: "Invalid JSON." }, { status: 400 }) };
  }
}
