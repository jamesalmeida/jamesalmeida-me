import {
  internalMutationGeneric,
  mutationGeneric,
  queryGeneric,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
  type GenericMutationCtx,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { ConvexError } from "convex/values";
import type schema from "./schema";

// Typed function builders, the same as convex/_generated/server would export. This
// repo doesn't depend on generated code, so it typechecks and builds without a
// Convex deployment (CI, local dev, a preview that has no deploy key).
type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export const query = queryGeneric as QueryBuilder<DataModel, "public">;
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
export const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, "internal">;

export const DAY_MS = 24 * 60 * 60 * 1000;
export const RETENTION_MS = 90 * DAY_MS;

// Every public function is called only by the site's server (lib/store.server.ts),
// which passes CONVEX_SERVER_SECRET. Set the same value on that Convex deployment.
// ConvexError data is visible on production; a plain Error is redacted to "Server Error".
export function assertServer(secret: string) {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || secret !== expected) throw new ConvexError({ code: "unauthorized" });
}

type Conversation = DocumentByName<DataModel, "conversations">;

/**
 * Records what the visitor did with the latest offer. Taking it wins over an earlier
 * "Not yet". Only the first answer of each kind adds an event, so counts stay honest.
 */
export async function answerLatestOffer(
  ctx: GenericMutationCtx<DataModel>,
  conversation: Conversation,
  outcome: "accepted" | "declined",
) {
  const offers = conversation.offers ?? [];
  const latest = offers.at(-1);
  if (!latest || latest.outcome === outcome || latest.outcome === "accepted") return;
  await ctx.db.patch(conversation._id, { offers: [...offers.slice(0, -1), { ...latest, outcome }] });
  if (!conversation.visitId) return;
  const now = Date.now();
  await ctx.db.insert("events", {
    type: `offer_${outcome}`,
    visitId: conversation.visitId,
    conversationId: conversation.conversationId,
    offer: {
      kind: latest.kind,
      turn: latest.turn,
      ...(latest.lead ? { lead: latest.lead } : {}),
      ...(latest.reason ? { reason: latest.reason } : {}),
    },
    at: now,
    expiresAt: now + RETENTION_MS,
  });
}
