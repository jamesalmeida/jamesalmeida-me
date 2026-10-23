import { v } from "convex/values";
import { RETENTION_MS, assertServer, mutation } from "./lib";
import { visitContext } from "./schema";

const CONVERSATION_FLAGS = {
  booking_clicked: "bookingClicked",
  email_clicked: "emailClicked",
} as const;

// Events the browser reports through /api/events (landing_view, booking_clicked,
// email_clicked, example_sent). chat_started and brief_shown are recorded by chats.ts.
export const record = mutation({
  args: {
    secret: v.string(),
    type: v.string(),
    visitId: v.string(),
    conversationId: v.optional(v.string()),
    example: v.optional(v.string()),
    context: v.object(visitContext),
  },
  handler: async (ctx, { secret, type, visitId, conversationId, example, context }) => {
    assertServer(secret);
    const now = Date.now();
    await ctx.db.insert("events", {
      type,
      visitId,
      conversationId,
      example,
      ...context,
      at: now,
      expiresAt: now + RETENTION_MS,
    });
    const flag = CONVERSATION_FLAGS[type as keyof typeof CONVERSATION_FLAGS];
    if (!flag || !conversationId) return;
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (conversation && !conversation[flag]) await ctx.db.patch(conversation._id, { [flag]: true });
  },
});
