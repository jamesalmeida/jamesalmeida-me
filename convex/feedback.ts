import { v } from "convex/values";
import { RETENTION_MS, assertServer, mutation } from "./lib";

// One row per rated reply: rating again (or adding details) updates it, and
// clearing the rating (rating: null) deletes it.
export const submit = mutation({
  args: {
    secret: v.string(),
    messageId: v.string(),
    conversationId: v.optional(v.string()),
    rating: v.union(v.literal("up"), v.literal("down"), v.null()),
    reasons: v.array(v.string()),
    details: v.string(),
    replyText: v.string(),
    userText: v.string(),
    // "rating" leaves the details as they are; "details" adds them.
    update: v.union(v.literal("rating"), v.literal("details")),
    sequence: v.number(),
  },
  handler: async (ctx, { secret, rating, update, sequence, ...feedback }) => {
    assertServer(secret);
    const existing = await ctx.db
      .query("feedback")
      .withIndex("by_messageId", (q) => q.eq("messageId", feedback.messageId))
      .unique();
    // A quick click can arrive after a newer one; the newer write wins.
    if (existing && sequence < (existing.sequence ?? 0)) return;
    if (rating === null) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }
    const now = Date.now();
    if (existing) {
      // A rating alone keeps the visitor's reasons and details.
      const patch =
        update === "rating"
          ? { rating, sequence, createdAt: now, expiresAt: now + RETENTION_MS }
          : { ...feedback, rating, sequence, createdAt: now, expiresAt: now + RETENTION_MS };
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("feedback", { ...feedback, rating, sequence, createdAt: now, expiresAt: now + RETENTION_MS });
    }
  },
});
