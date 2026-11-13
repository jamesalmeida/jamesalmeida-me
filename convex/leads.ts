import { v } from "convex/values";
import { answerOffer, assertServer, mutation } from "./lib";

// "Send to James" on the brief card. Kept until James deletes it. Only what the
// visitor saw and approved is stored here: the job card stays with the chat.
// A repeat send for the same card updates that lead, so James gets one lead and
// one email (the route only emails when this returns `created: true`).
export const submit = mutation({
  args: {
    secret: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    brief: v.record(v.string(), v.string()),
    note: v.optional(v.string()),
    conversationId: v.optional(v.string()),
    // The card's tool call id: the offer this lead answers, and the idempotency key.
    offerId: v.optional(v.string()),
  },
  handler: async (ctx, { secret, conversationId, offerId, ...lead }) => {
    assertServer(secret);
    let fitScore: number | undefined;
    let blocked: boolean | undefined;
    if (conversationId) {
      const conversation = await ctx.db
        .query("conversations")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
        .unique();
      if (conversation) {
        if (!conversation.leadCaptured) await ctx.db.patch(conversation._id, { leadCaptured: true });
        if (typeof conversation.fitScore === "number") fitScore = conversation.fitScore;
        blocked = conversation.blocked === true;
        await answerOffer(ctx, conversation, offerId, "accepted");
      }
    }

    const fields = {
      ...lead,
      conversationId,
      offerId,
      ...(fitScore !== undefined ? { fitScore } : {}),
      ...(blocked ? { blocked } : {}),
    };
    if (offerId) {
      const existing = await ctx.db
        .query("leads")
        .withIndex("by_offerId", (q) => q.eq("offerId", offerId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        return { created: false };
      }
    }
    await ctx.db.insert("leads", { ...fields, createdAt: Date.now() });
    return { created: true };
  },
});

export const remove = mutation({
  args: { secret: v.string(), id: v.id("leads") },
  handler: async (ctx, { secret, id }) => {
    assertServer(secret);
    await ctx.db.delete(id);
  },
});
