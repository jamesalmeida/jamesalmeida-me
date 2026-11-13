import { v } from "convex/values";
import { RETENTION_MS, answerOffer, assertServer, mutation } from "./lib";
import { visitContext } from "./schema";

const CONVERSATION_FLAGS = {
  booking_clicked: "bookingClicked",
  email_clicked: "emailClicked",
} as const;

// Events the browser reports through /api/events (landing_view, booking_clicked,
// email_clicked, example_sent, offer_declined). chat_started, brief_shown and
// offer_shown are recorded by chats.ts. A booking or email click answers the offer.
export const record = mutation({
  args: {
    secret: v.string(),
    type: v.string(),
    visitId: v.string(),
    conversationId: v.optional(v.string()),
    example: v.optional(v.string()),
    // The card's tool call id, so a click or "Not yet" answers that offer.
    offerId: v.optional(v.string()),
    context: v.object(visitContext),
  },
  handler: async (ctx, { secret, type, visitId, conversationId, example, offerId, context }) => {
    assertServer(secret);
    const now = Date.now();
    // answerLatestOffer records a decline, once, and only if there was an offer.
    if (type !== "offer_declined") {
      await ctx.db.insert("events", {
        type,
        visitId,
        conversationId,
        example,
        ...context,
        at: now,
        expiresAt: now + RETENTION_MS,
      });
    }
    const flag = CONVERSATION_FLAGS[type as keyof typeof CONVERSATION_FLAGS];
    if ((!flag && type !== "offer_declined") || !conversationId) return;
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!conversation) return;
    if (flag && !conversation[flag]) await ctx.db.patch(conversation._id, { [flag]: true });
    await answerOffer(ctx, conversation, offerId, flag ? "accepted" : "declined");
  },
});
