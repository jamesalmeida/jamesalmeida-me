import { v } from "convex/values";
import { assertServer, mutation } from "./lib";

// From the optional email field on the brief card. Kept until James deletes it.
export const submit = mutation({
  args: {
    secret: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    brief: v.record(v.string(), v.string()),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, { secret, conversationId, ...lead }) => {
    assertServer(secret);
    await ctx.db.insert("leads", { ...lead, conversationId, createdAt: Date.now() });
    if (!conversationId) return;
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (conversation && !conversation.leadCaptured) {
      await ctx.db.patch(conversation._id, { leadCaptured: true });
    }
  },
});

export const remove = mutation({
  args: { secret: v.string(), id: v.id("leads") },
  handler: async (ctx, { secret, id }) => {
    assertServer(secret);
    await ctx.db.delete(id);
  },
});
