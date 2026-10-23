import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readAdminJson, requireAdminSession } from "@/lib/admin-auth";
import { parseMotionSetting } from "@/lib/motion-settings";
import { SITE_MOTION_TAG, getSiteMotion, saveSiteMotion } from "@/lib/motion-settings.server";
import { isStoreConfigured } from "@/lib/store.server";

export const dynamic = "force-dynamic";

// The chat's animation pace and minimum thinking time, and whether this deployment can save them.
export async function GET() {
  return NextResponse.json({ motion: await getSiteMotion(), canSave: isStoreConfigured() });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const result = await readAdminJson(request);
  if ("response" in result) return result.response;

  const motion = parseMotionSetting(result.body.motion);
  if (!motion) return NextResponse.json({ error: "Invalid motion settings." }, { status: 400 });

  const error = await saveSiteMotion(motion);
  if (error) return NextResponse.json({ error }, { status: 503 });

  revalidateTag(SITE_MOTION_TAG);
  revalidatePath("/");
  return NextResponse.json({ ok: true, motion });
}
