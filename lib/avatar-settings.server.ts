import "server-only";

import type { AvatarConfig } from "@jamesalmeida/agent-avatars";
import { AVATAR_SETTING_KEY, DEFAULT_SITE_AVATAR, storedAvatarOrDefault } from "@/lib/avatar-settings";

// Reading needs EDGE_CONFIG (the connection string Vercel adds when an Edge Config
// store is connected to the project). Saving also needs VERCEL_API_TOKEN, and
// VERCEL_TEAM_ID when the store belongs to a team.

/** Next's data cache tag for the saved avatar. Saving revalidates it. */
export const SITE_AVATAR_TAG = "site-avatar";

type EdgeConfigConnection = { id: string; itemUrl: (key: string) => string };

/** Parses https://edge-config.vercel.com/ecfg_…?token=…, or returns null. */
export function parseEdgeConfig(connectionString?: string | null): EdgeConfigConnection | null {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    const id = url.pathname.split("/").filter(Boolean).pop();
    const token = url.searchParams.get("token");
    if (!id || !/^ecfg_[a-z0-9]+$/i.test(id) || !token) return null;
    return {
      id,
      itemUrl: (key) => `${url.origin}/${id}/item/${encodeURIComponent(key)}?token=${encodeURIComponent(token)}`,
    };
  } catch {
    return null;
  }
}

export function canSaveAvatar(env: Partial<Record<string, string>> = process.env): boolean {
  return Boolean(parseEdgeConfig(env.EDGE_CONFIG) && env.VERCEL_API_TOKEN);
}

/**
 * Skaffen's avatar for every visitor: the saved setting, else the site default.
 * Cached in Next's data cache, so the home page stays static: a save revalidates
 * SITE_AVATAR_TAG, and the minute-long revalidate catches a read that raced the
 * write (Edge Config takes a few seconds to propagate). Never throws.
 */
export async function getSiteAvatar(): Promise<{ avatar: AvatarConfig; source: "edge-config" | "default" }> {
  const edgeConfig = parseEdgeConfig(process.env.EDGE_CONFIG);
  if (!edgeConfig) return { avatar: DEFAULT_SITE_AVATAR, source: "default" };
  try {
    const response = await fetch(edgeConfig.itemUrl(AVATAR_SETTING_KEY), {
      next: { revalidate: 60, tags: [SITE_AVATAR_TAG] },
    });
    if (response.status === 404) return { avatar: DEFAULT_SITE_AVATAR, source: "default" };
    if (!response.ok) throw new Error(`Edge Config responded ${response.status}`);
    return { avatar: storedAvatarOrDefault(await response.json()), source: "edge-config" };
  } catch (error) {
    console.error("Reading the avatar from Edge Config failed; using the default.", error);
    return { avatar: DEFAULT_SITE_AVATAR, source: "default" };
  }
}

/** Upserts the avatar in Edge Config through the Vercel API. Returns an error message, or null. */
export async function saveSiteAvatar(avatar: AvatarConfig): Promise<string | null> {
  const id = parseEdgeConfig(process.env.EDGE_CONFIG)?.id;
  const token = process.env.VERCEL_API_TOKEN;
  if (!id || !token) return "Saving needs EDGE_CONFIG and VERCEL_API_TOKEN to be set.";

  const url = new URL(`https://api.vercel.com/v1/edge-config/${id}/items`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key: AVATAR_SETTING_KEY, value: avatar }] }),
      cache: "no-store",
    });
    if (response.ok) return null;
    console.error("Saving the avatar to Edge Config failed.", response.status, await response.text());
    return `Edge Config rejected the update (${response.status}).`;
  } catch (error) {
    console.error("Saving the avatar to Edge Config failed.", error);
    return "Could not reach the Vercel API.";
  }
}
