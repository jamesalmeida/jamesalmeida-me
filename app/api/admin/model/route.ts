import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isModelId, MODEL_COOKIE_NAME } from "@/lib/models";

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

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  if (!model || !isModelId(model)) {
    return NextResponse.json({ error: "Invalid model selection." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(MODEL_COOKIE_NAME, model, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}
