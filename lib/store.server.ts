import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi, type FunctionReference } from "convex/server";

// The site's server is the only caller of the Convex functions in convex/. Every
// call passes CONVEX_SERVER_SECRET, which the functions check. Without a deployment
// URL and CONVEX_SERVER_SECRET nothing is stored or read.
//
// Production sets CONVEX_URL in Vercel. `npx convex deploy` (preview builds) injects
// the per-deployment URL as NEXT_PUBLIC_CONVEX_URL for the Next build, and Next
// inlines that into the server bundle. Leave CONVEX_URL unset on Preview so this
// fallback is the preview deployment, not production.

export const storeApi = anyApi;

/**
 * ConvexHttpClient appends `/api/query` itself. A trailing slash makes that
 * `//api/query`, which the deployment answers with an empty 404.
 */
export function normalizeConvexDeploymentUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "") || null;
  }
}

function storeConfig(): { url: string; secret: string } | null {
  const url = normalizeConvexDeploymentUrl(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL);
  const secret = process.env.CONVEX_SERVER_SECRET;
  return url && secret ? { url, secret } : null;
}

export function isStoreConfigured(): boolean {
  return storeConfig() !== null;
}

/** Runs a Convex mutation. Returns false when storage isn't configured; throws on errors. */
export async function storeMutation(
  ref: FunctionReference<"mutation">,
  args: Record<string, unknown>,
): Promise<boolean> {
  const config = storeConfig();
  if (!config) return false;
  await new ConvexHttpClient(config.url).mutation(ref, { ...args, secret: config.secret });
  return true;
}

/** Runs a Convex query. Returns null when storage isn't configured; throws on errors. */
export async function storeQuery<T>(
  ref: FunctionReference<"query">,
  args: Record<string, unknown>,
): Promise<T | null> {
  const config = storeConfig();
  if (!config) return null;
  return (await new ConvexHttpClient(config.url).query(ref, { ...args, secret: config.secret })) as T;
}

/** For background writes (after()): logs instead of throwing, so analytics never breaks the chat. */
export async function storeMutationQuietly(
  ref: FunctionReference<"mutation">,
  args: Record<string, unknown>,
): Promise<void> {
  try {
    await storeMutation(ref, args);
  } catch (error) {
    console.error("Storing analytics failed.", error);
  }
}

function storeErrorData(error: unknown): unknown {
  return error && typeof error === "object" && "data" in error ? error.data : undefined;
}

/** For admin screens only: what likely went wrong with a Convex call, in plain words. */
export function describeStoreError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const data = storeErrorData(error);
  const code = data && typeof data === "object" && "code" in data ? data.code : undefined;
  if (code === "unauthorized" || /Unauthorized/.test(message)) {
    return "CONVEX_SERVER_SECRET doesn't match between Vercel and this Convex deployment. Reveal both values and compare them.";
  }
  if (/Could not find (public )?function/i.test(message)) {
    return "The Convex functions aren't deployed. The build log should say '[build] CONVEX_DEPLOY_KEY is set'. Production uses a production deploy key; a preview uses a preview deploy key.";
  }
  if (!message.trim()) {
    return "Convex's query endpoint returned an empty error. CONVEX_URL must be the deployment origin (https://<name>.convex.cloud) with no trailing slash or extra path.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return "Couldn't reach Convex. Check CONVEX_URL.";
  }
  if (/Server Error/.test(message)) {
    return "Convex hid the details (production does that for an ordinary Error). Open this deployment's Logs in the Convex dashboard.";
  }
  return message.slice(0, 300);
}
