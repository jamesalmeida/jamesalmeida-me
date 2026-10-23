import "server-only";

import { unstable_cache } from "next/cache";
import { DEFAULT_MOTION, MOTION_SETTING_KEY, storedMotionOrDefault, type MotionSettings } from "@/lib/motion-settings";
import { describeStoreError, isStoreConfigured, storeApi, storeMutation, storeQuery } from "@/lib/store.server";

/** Next's data cache tag for the motion setting. Saving revalidates it. */
export const SITE_MOTION_TAG = "site-motion";

// Throws on a failed read, so unstable_cache doesn't keep the fallback.
const readStoredMotion = unstable_cache(
  async () => storeQuery<unknown>(storeApi.settings.get, { key: MOTION_SETTING_KEY }),
  [SITE_MOTION_TAG],
  { tags: [SITE_MOTION_TAG], revalidate: 3600 },
);

/** The motion setting saved in /admin, else DEFAULT_MOTION. Cached like the avatar. Never throws. */
export async function getSiteMotion(): Promise<MotionSettings> {
  if (!isStoreConfigured()) return DEFAULT_MOTION;
  try {
    return storedMotionOrDefault(await readStoredMotion());
  } catch (error) {
    console.error("Reading the motion setting failed; using the default.", error);
    return DEFAULT_MOTION;
  }
}

/** Saves the motion setting for every visitor. Returns an error message, or null. */
export async function saveSiteMotion(motion: MotionSettings): Promise<string | null> {
  try {
    const saved = await storeMutation(storeApi.settings.set, { key: MOTION_SETTING_KEY, value: motion });
    return saved ? null : "Saving needs CONVEX_URL and CONVEX_SERVER_SECRET to be set.";
  } catch (error) {
    console.error("Saving the motion setting failed.", error);
    return `Could not save to the database. ${describeStoreError(error)}`;
  }
}
