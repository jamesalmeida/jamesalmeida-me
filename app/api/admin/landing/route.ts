import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readAdminJson, requireAdminSession } from "@/lib/admin-auth";
import { parseLandingSetting } from "@/lib/landing-settings";
import { SITE_LANDING_TAG, getSiteLanding, saveSiteLanding } from "@/lib/landing-settings.server";
import { isStoreConfigured } from "@/lib/store.server";

export const dynamic = "force-dynamic";

// The landing's headlines (A/B test), example prompts and their timing, and whether
// this deployment can save them.
export async function GET() {
  return NextResponse.json({ landing: await getSiteLanding(), canSave: isStoreConfigured() });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const result = await readAdminJson(request);
  if ("response" in result) return result.response;

  const landing = parseLandingSetting(result.body.landing);
  if (!landing) return NextResponse.json({ error: "Invalid landing settings." }, { status: 400 });

  const error = await saveSiteLanding(landing);
  if (error) return NextResponse.json({ error }, { status: 503 });

  revalidateTag(SITE_LANDING_TAG);
  revalidatePath("/");
  return NextResponse.json({ ok: true, landing });
}
