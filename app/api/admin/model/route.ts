import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  MODEL_COOKIE_MAX_AGE_SECONDS,
  signModel,
  timingSafeEqualString,
  verifyModelCookie,
} from "@/lib/admin-cookie";
import { getDefaultModelId, isModelId, MODEL_COOKIE_NAME } from "@/lib/models";
import { adminIpLimiter, getClientIp, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const verified = verifyModelCookie(cookieStore.get(MODEL_COOKIE_NAME)?.value);
  return NextResponse.json({
    model: verified ?? getDefaultModelId(),
    isOverride: verified !== null,
  });
}

export async function POST(request: Request) {
  // Counts every attempt, including successful ones, to throttle password guesses.
  const limit = adminIpLimiter.check(getClientIp(request.headers));
  if (!limit.ok) return rateLimitedResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const { model, password } =
    body && typeof body === "object"
      ? (body as { model?: unknown; password?: unknown })
      : { model: undefined, password: undefined };

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (typeof password !== "string" || !timingSafeEqualString(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  if (typeof model !== "string" || !isModelId(model)) {
    return NextResponse.json({ error: "Invalid model selection." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(MODEL_COOKIE_NAME, signModel(model), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MODEL_COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
