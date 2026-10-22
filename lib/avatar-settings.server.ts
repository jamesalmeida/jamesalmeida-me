import "server-only";

import type { AvatarConfig } from "@jamesalmeida/agent-avatars";
import { unstable_cache } from "next/cache";
import { AVATAR_SETTING_KEY, DEFAULT_SITE_AVATAR, storedAvatarOrDefault } from "@/lib/avatar-settings";
import { describeStoreError, isStoreConfigured, storeApi, storeMutation, storeQuery } from "@/lib/store.server";

/** Next's data cache tag for the saved avatar. Saving revalidates it. */
export const SITE_AVATAR_TAG = "site-avatar";

// Throws on a failed read, so unstable_cache doesn't keep the fallback.
const readStoredAvatar = unstable_cache(
  async () => storeQuery<unknown>(storeApi.settings.get, { key: AVATAR_SETTING_KEY }),
  [SITE_AVATAR_TAG],
  { tags: [SITE_AVATAR_TAG], revalidate: 3600 },
);

/**
 * Skaffen's avatar for every visitor: the setting saved in /admin (Convex), else the
 * site default. Cached, so the home page stays static; a save revalidates the tag.
 * Never throws.
 */
export async function getSiteAvatar(): Promise<{ avatar: AvatarConfig; source: "saved" | "default" }> {
  if (!isStoreConfigured()) return { avatar: DEFAULT_SITE_AVATAR, source: "default" };
  try {
    const value = await readStoredAvatar();
    if (value === null || value === undefined) return { avatar: DEFAULT_SITE_AVATAR, source: "default" };
    return { avatar: storedAvatarOrDefault(value), source: "saved" };
  } catch (error) {
    console.error("Reading the avatar setting failed; using the default.", error);
    return { avatar: DEFAULT_SITE_AVATAR, source: "default" };
  }
}

/** Saves the avatar for every visitor. Returns an error message, or null. */
export async function saveSiteAvatar(avatar: AvatarConfig): Promise<string | null> {
  try {
    const saved = await storeMutation(storeApi.settings.set, { key: AVATAR_SETTING_KEY, value: avatar });
    return saved ? null : "Saving needs CONVEX_URL and CONVEX_SERVER_SECRET to be set.";
  } catch (error) {
    console.error("Saving the avatar setting failed.", error);
    return `Could not save to the database. ${describeStoreError(error)}`;
  }
}
