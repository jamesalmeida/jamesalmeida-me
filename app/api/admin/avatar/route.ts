import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readAdminJson, requireAdminSession } from "@/lib/admin-auth";
import { parseAvatarSetting } from "@/lib/avatar-settings";
import { SITE_AVATAR_TAG, getSiteAvatar, saveSiteAvatar } from "@/lib/avatar-settings.server";
import { isStoreConfigured } from "@/lib/store.server";

export const dynamic = "force-dynamic";

// The avatar every visitor sees, and whether this deployment can save a new one.
export async function GET() {
  const { avatar, source } = await getSiteAvatar();
  return NextResponse.json({ avatar, source, canSave: isStoreConfigured() });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const result = await readAdminJson(request);
  if ("response" in result) return result.response;

  const avatar = parseAvatarSetting(result.body.avatar);
  if (!avatar) {
    return NextResponse.json({ error: "Invalid avatar settings." }, { status: 400 });
  }

  const error = await saveSiteAvatar(avatar);
  if (error) return NextResponse.json({ error }, { status: 503 });

  // The home page is static; rebuild it so visitors get the new avatar.
  revalidateTag(SITE_AVATAR_TAG);
  revalidatePath("/");
  return NextResponse.json({ ok: true, avatar });
}
