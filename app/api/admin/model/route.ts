import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  signModel,
  timingSafeEqualString,
  verifyModelCookie,
} from "@/lib/admin-cookie";
import { getDefaultModelId, isModelId, MODEL_COOKIE_NAME } from "@/lib/models";

export const dynamic = "force-dynamic";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function GET() {
  const cookieStore = await cookies();
  const verified = verifyModelCookie(cookieStore.get(MODEL_COOKIE_NAME)?.value);
  return NextResponse.json({
    model: verified ?? getDefaultModelId(),
    isOverride: verified !== null,
  });
}

export async function POST(request: Request) {
  const { model, password } = (await request.json()) as {
    model?: string;
    password?: string;
  };

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (typeof password !== "string" || !timingSafeEqualString(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  if (!model || !isModelId(model)) {
    return NextResponse.json({ error: "Invalid model selection." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(MODEL_COOKIE_NAME, signModel(model), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return NextResponse.json({ ok: true });
}
