import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAdminRequest } from "@/lib/admin-auth";
import { MODEL_COOKIE_MAX_AGE_SECONDS, signModel, verifyModelCookie } from "@/lib/admin-cookie";
import { getDefaultModelId, isModelId, MODEL_COOKIE_NAME } from "@/lib/models";

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
  const result = await readAdminRequest(request);
  if ("response" in result) return result.response;
  const { model } = result.body;

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
