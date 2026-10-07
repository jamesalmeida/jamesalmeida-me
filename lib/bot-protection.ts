import "server-only";

import { checkBotId } from "botid/server";

// Must match the `checkLevel` in instrumentation-client.ts.
export const BOTID_CHECK_LEVEL = "basic" as const;

/**
 * Returns a 403 response for bots, or null. BotID reports isBot: false in local dev.
 * Fails open if the check itself throws (e.g. no Vercel OIDC token under a local
 * `next start`), so a BotID outage can't take the chat down; the rate limiter still applies.
 */
export async function rejectBots(): Promise<Response | null> {
  let isBot: boolean;
  try {
    ({ isBot } = await checkBotId({ advancedOptions: { checkLevel: BOTID_CHECK_LEVEL } }));
  } catch (error) {
    console.error("BotID check failed; allowing request.", error);
    return null;
  }
  if (isBot) {
    return Response.json({ error: "Access denied." }, { status: 403 });
  }
  return null;
}
