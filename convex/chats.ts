import { v } from "convex/values";
import { RETENTION_MS, assertServer, mutation } from "./lib";
import { blockReason, jevIntent, visitContext } from "./schema";

// Fields written onto the conversation from one Jev screen. A later passing turn
// does not clear `blocked`; the first reason that stopped a message stays put
// unless a later turn is blocked for a new reason.
function screenFields(screen: {
  blocked: boolean;
  blockReason?: "spam" | "jailbreak" | "abuse";
  intent?: "continue_chat" | "suggest_book_call" | "suggest_email";
  fitScore?: number;
} | undefined) {
  if (!screen) return {};
  const fitScore =
    typeof screen.fitScore === "number" && Number.isFinite(screen.fitScore)
      ? Math.min(3, Math.max(0, screen.fitScore))
      : undefined;
  return {
    ...(screen.intent ? { intent: screen.intent } : {}),
    ...(fitScore !== undefined ? { fitScore } : {}),
    ...(screen.blocked ? { blocked: true as const, ...(screen.blockReason ? { blockReason: screen.blockReason } : {}) } : {}),
  };
}

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
    screen: v.optional(
      v.object({
        blocked: v.boolean(),
        blockReason: v.optional(blockReason),
        intent: v.optional(jevIntent),
        fitScore: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { secret, conversationId, visitId, context, model, text, screen }) => {
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
        ...screenFields(screen),
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
        ...screenFields(screen),
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
