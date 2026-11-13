import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readAdminJson, requireAdminSession } from "@/lib/admin-auth";
import { parseMotionSetting } from "@/lib/motion-settings";
import { SITE_MOTION_TAG, getSiteMotionForAdmin, saveSiteMotion } from "@/lib/motion-settings.server";
import { isStoreConfigured } from "@/lib/store.server";

export const dynamic = "force-dynamic";

// The chat's animation pace and minimum thinking time, and whether this deployment can save them.
export async function GET() {
  const motion = await getSiteMotionForAdmin();
  if (!motion) {
    return NextResponse.json(
      { error: "Could not read the saved motion settings. Try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ motion, canSave: isStoreConfigured() });
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
