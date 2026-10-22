import { v } from "convex/values";
import { RETENTION_MS, assertServer, mutation } from "./lib";
import { visitContext } from "./schema";

// Called by /api/chat when a visitor sends a message. The first message of a
// conversation creates it and records a chat_started event.
export const recordUserMessage = mutation({
  args: {
    secret: v.string(),
    conversationId: v.string(),
    visitId: v.optional(v.string()),
    context: v.object(visitContext),
    model: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { secret, conversationId, visitId, context, model, text }) => {
    assertServer(secret);
    const now = Date.now();
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastMessageAt: now,
        userMessages: existing.userMessages + 1,
        model,
        expiresAt: now + RETENTION_MS,
      });
    } else {
      await ctx.db.insert("conversations", {
        conversationId,
        visitId,
        ...context,
        model,
        startedAt: now,
        lastMessageAt: now,
        userMessages: 1,
        briefShown: false,
        bookingClicked: false,
        emailClicked: false,
        leadCaptured: false,
        expiresAt: now + RETENTION_MS,
      });
      if (visitId) {
        await ctx.db.insert("events", {
          type: "chat_started",
          visitId,
          conversationId,
          ...context,
          at: now,
          expiresAt: now + RETENTION_MS,
        });
      }
    }
    await ctx.db.insert("messages", {
      conversationId,
      role: "user",
      text,
      createdAt: now,
      expiresAt: now + RETENTION_MS,
    });
  },
});

// Called by /api/chat once Skaffen's reply has finished streaming.
export const recordReply = mutation({
  args: {
    secret: v.string(),
    conversationId: v.string(),
    text: v.string(),
    tools: v.array(v.string()),
  },
  handler: async (ctx, { secret, conversationId, text, tools }) => {
    assertServer(secret);
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId,
      role: "assistant",
      text,
      tools: tools.length > 0 ? tools : undefined,
      createdAt: now,
      expiresAt: now + RETENTION_MS,
    });
    if (!tools.includes("showBrief")) return;
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!conversation || conversation.briefShown) return;
    await ctx.db.patch(conversation._id, { briefShown: true });
    if (conversation.visitId) {
      await ctx.db.insert("events", {
        type: "brief_shown",
        visitId: conversation.visitId,
        conversationId,
        at: now,
        expiresAt: now + RETENTION_MS,
      });
    }
  },
});
