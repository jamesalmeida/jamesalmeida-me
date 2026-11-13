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
import { nextOfferOutcome, offerAnswerChanges, type OfferAnswer } from "../lib/offer-outcome";
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
 * Records what the visitor did with the offer they answered. The card sends its
 * tool call id, so "Not yet" on an older card can't decline the newest offer.
 * Taking it wins over an earlier "Not yet", and only a change adds an event.
 */
export async function answerOffer(
  ctx: GenericMutationCtx<DataModel>,
  conversation: Conversation,
  offerId: string | undefined,
  outcome: OfferAnswer,
) {
  const offers = conversation.offers ?? [];
  // Without an id (an older client, a header booking link) answer the newest offer.
  const index = offerId ? offers.findIndex((offer) => offer.id === offerId) : offers.length - 1;
  const offer = index >= 0 ? offers[index] : undefined;
  if (!offer || !offerAnswerChanges(offer.outcome, outcome)) return;
  const next = nextOfferOutcome(offer.outcome, outcome);
  if (!next) return;
  await ctx.db.patch(conversation._id, {
    offers: offers.map((item, at) => (at === index ? { ...item, outcome: next } : item)),
  });
  if (!conversation.visitId) return;
  const now = Date.now();
  await ctx.db.insert("events", {
    type: `offer_${outcome}`,
    visitId: conversation.visitId,
    conversationId: conversation.conversationId,
    offer: {
      kind: offer.kind,
      turn: offer.turn,
      ...(offer.id ? { id: offer.id } : {}),
      ...(offer.lead ? { lead: offer.lead } : {}),
      ...(offer.reason ? { reason: offer.reason } : {}),
    },
    at: now,
    expiresAt: now + RETENTION_MS,
  });
}
