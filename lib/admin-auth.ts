import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  signAdminSession,
  timingSafeEqualString,
  verifyAdminSession,
} from "@/lib/admin-cookie";
import { adminIpLimiter, getClientIp, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * POST /api/admin/verify: the shared admin limiter (every attempt counts, to
 * throttle password guesses), JSON, then a timing-safe password compare. On success
 * it sets the signed session cookie. Returns the response to send.
 */
export async function startAdminSession(request: Request): Promise<Response> {
  const limit = adminIpLimiter.check(getClientIp(request.headers));
  if (!limit.ok) return rateLimitedResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const password = body && typeof body === "object" ? (body as { password?: unknown }).password : undefined;

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured." }, { status: 500 });
  }
  if (typeof password !== "string" || !timingSafeEqualString(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, signAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ ok: true });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function hasAdminSession(): Promise<boolean> {
  return verifyAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value);
}

/** For every other admin route: null when signed in, else a 401 to send. */
export async function requireAdminSession(): Promise<Response | null> {
  if (await hasAdminSession()) return null;
  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}

/** JSON body for an admin POST, or a 400 response. */
export async function readAdminJson(request: Request): Promise<{ body: Record<string, unknown> } | { response: Response }> {
  try {
    const parsed: unknown = await request.json();
    return { body: parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {} };
  } catch {
    return { response: NextResponse.json({ error: "Invalid JSON." }, { status: 400 }) };
  }
}
