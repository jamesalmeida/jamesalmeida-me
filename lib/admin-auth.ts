import "server-only";

import { NextResponse } from "next/server";
import { timingSafeEqualString } from "@/lib/admin-cookie";
import { adminIpLimiter, getClientIp, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * The checks every admin POST runs first, in order: the shared admin limiter (every
 * attempt counts, to throttle password guesses), JSON parsing, then a timing-safe
 * password compare. Returns the parsed body, or the error response to send.
 */
export async function readAdminRequest(
  request: Request,
): Promise<{ body: Record<string, unknown> } | { response: Response }> {
  const limit = adminIpLimiter.check(getClientIp(request.headers));
  if (!limit.ok) return { response: rateLimitedResponse(limit.retryAfterSeconds) };

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { response: NextResponse.json({ error: "Invalid JSON." }, { status: 400 }) };
  }
  const body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};

  if (!process.env.ADMIN_PASSWORD) {
    return { response: NextResponse.json({ error: "ADMIN_PASSWORD is not configured." }, { status: 500 }) };
  }
  if (typeof body.password !== "string" || !timingSafeEqualString(body.password, process.env.ADMIN_PASSWORD)) {
    return { response: NextResponse.json({ error: "Invalid password." }, { status: 401 }) };
  }
  return { body };
}
