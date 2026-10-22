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
  },
  handler: async (ctx, { secret, rating, ...feedback }) => {
    assertServer(secret);
    const existing = await ctx.db
      .query("feedback")
      .withIndex("by_messageId", (q) => q.eq("messageId", feedback.messageId))
      .unique();
    if (rating === null) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...feedback, rating, createdAt: now, expiresAt: now + RETENTION_MS });
    } else {
      await ctx.db.insert("feedback", { ...feedback, rating, createdAt: now, expiresAt: now + RETENTION_MS });
    }
  },
});
