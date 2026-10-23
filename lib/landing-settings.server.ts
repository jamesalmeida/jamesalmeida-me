import "server-only";

import { unstable_cache } from "next/cache";
import {
  DEFAULT_LANDING,
  LANDING_SETTING_KEY,
  storedLandingOrDefault,
  type LandingSettings,
} from "@/lib/landing-settings";
import { describeStoreError, isStoreConfigured, storeApi, storeMutation, storeQuery } from "@/lib/store.server";

/** Next's data cache tag for the landing setting. Saving revalidates it. */
export const SITE_LANDING_TAG = "site-landing";

// Throws on a failed read, so unstable_cache doesn't keep the fallback.
const readStoredLanding = unstable_cache(
  async () => storeQuery<unknown>(storeApi.settings.get, { key: LANDING_SETTING_KEY }),
  [SITE_LANDING_TAG],
  { tags: [SITE_LANDING_TAG], revalidate: 3600 },
);

/** The landing setting saved in /admin, else DEFAULT_LANDING. Cached like the avatar. Never throws. */
export async function getSiteLanding(): Promise<LandingSettings> {
  if (!isStoreConfigured()) return DEFAULT_LANDING;
  try {
    return storedLandingOrDefault(await readStoredLanding());
  } catch (error) {
    console.error("Reading the landing setting failed; using the default.", error);
    return DEFAULT_LANDING;
  }
}

/** Saves the landing setting for every visitor. Returns an error message, or null. */
export async function saveSiteLanding(landing: LandingSettings): Promise<string | null> {
  try {
    const saved = await storeMutation(storeApi.settings.set, { key: LANDING_SETTING_KEY, value: landing });
    return saved ? null : "Saving needs CONVEX_URL and CONVEX_SERVER_SECRET to be set.";
  } catch (error) {
    console.error("Saving the landing setting failed.", error);
    return `Could not save to the database. ${describeStoreError(error)}`;
  }
}
