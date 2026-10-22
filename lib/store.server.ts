import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi, type FunctionReference } from "convex/server";

// The site's server is the only caller of the Convex functions in convex/. Every
// call passes CONVEX_SERVER_SECRET, which the functions check. Without CONVEX_URL
// and CONVEX_SERVER_SECRET (local dev, CI, previews) nothing is stored or read.

export const storeApi = anyApi;

function storeConfig(): { url: string; secret: string } | null {
  const url = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
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

/** For admin screens only: what likely went wrong with a Convex call, in plain words. */
export function describeStoreError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/Could not find (public )?function/i.test(message)) {
    return "The Convex functions aren't deployed. The Vercel build must run `npm run vercel-build` with CONVEX_DEPLOY_KEY set.";
  }
  if (/Unauthorized/.test(message)) {
    return "CONVEX_SERVER_SECRET doesn't match between Vercel and the Convex production deployment.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return "Couldn't reach Convex. Check CONVEX_URL.";
  }
  return message.slice(0, 300);
}
