import { v } from "convex/values";
import { parseClientIp } from "../lib/client-ip";
import { conversationStage } from "../lib/conversation-stage";
import { MAX_REASON_CHARS } from "../lib/jev-quality";
import { mergeJobCard } from "../lib/job-card";
import { RETENTION_MS, assertServer, mutation, query } from "./lib";
import { blockReason, jevIntent, jobCard, offerKind, offerLead, offerReason, readiness, sentiment, visitContext } from "./schema";

// The card history kept on a conversation. The cooldown only needs the latest few.
const MAX_STORED_OFFERS = 10;

// Fields written onto the conversation from one Jev screen. A later passing turn
// does not clear `blocked`; the first reason that stopped a message stays put
// unless a later turn is blocked for a new reason.
function screenFields(screen: {
  blocked: boolean;
  blockReason?: "spam" | "jailbreak" | "abuse";
  intent?: "continue_chat" | "suggest_book_call" | "suggest_email";
  fitScore?: number;
  clientIp?: string;
  readiness?: { buyingSignal: number; engagementFading: number; goingNowhere: number; cardCompleteness: number };
} | undefined) {
  if (!screen) return {};
  const fitScore =
    typeof screen.fitScore === "number" && Number.isFinite(screen.fitScore)
      ? Math.min(3, Math.max(0, screen.fitScore))
      : undefined;
  // Only a blocked turn may carry an IP, and only when it is one address.
  const clientIp = screen.blocked ? parseClientIp(screen.clientIp) : undefined;
  return {
    ...(screen.intent ? { intent: screen.intent } : {}),
    ...(fitScore !== undefined ? { fitScore } : {}),
    ...(screen.readiness ? { readiness: screen.readiness } : {}),
    ...(screen.blocked
      ? {
          blocked: true as const,
          ...(screen.blockReason ? { blockReason: screen.blockReason } : {}),
          ...(clientIp ? { clientIp } : {}),
        }
      : {}),
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
        clientIp: v.optional(v.string()),
        readiness: v.optional(readiness),
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

// Called by /api/chat as soon as a step shows a card, not after the whole reply.
// A card is visible before the reply ends, so the offer exists when the visitor
// answers it. A repeat for the same card id is ignored.
export const recordOffer = mutation({
  args: {
    secret: v.string(),
    conversationId: v.string(),
    offer: v.object({
      // The card's tool call id, so answers are tied to the card that was shown.
      id: v.optional(v.string()),
      kind: offerKind,
      lead: v.optional(offerLead),
      reason: v.optional(offerReason),
      readiness: v.optional(readiness),
    }),
  },
  handler: async (ctx, { secret, conversationId, offer }) => {
    assertServer(secret);
    const now = Date.now();
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!conversation) return;
    const offers = conversation.offers ?? [];
    if (offer.id && offers.some((item) => item.id === offer.id)) return;
    const { readiness: _scores, ...shown } = offer;
    const turn = conversation.userMessages;
    await ctx.db.patch(conversation._id, {
      offers: [
        ...offers,
        { ...shown, ...(offer.id ? { id: offer.id } : {}), at: now, turn },
      ].slice(-MAX_STORED_OFFERS),
    });
    if (conversation.visitId) {
      await ctx.db.insert("events", {
        type: "offer_shown",
        visitId: conversation.visitId,
        conversationId,
        offer: { ...offer, turn },
        at: now,
        expiresAt: now + RETENTION_MS,
      });
    }
    if (offer.kind !== "brief" || conversation.briefShown) return;
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

// Called by /api/chat once Skaffen's reply has finished streaming. Offers are
// recorded at the step that showed them (recordOffer); this stores the message and
// keeps the brief flag for old clients.
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
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!conversation) return;
    if (!tools.includes("showBrief") || conversation.briefShown) return;
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

// Latest sentiment and went-badly score for a conversation. A blocked chat is
// left unchanged, so a late score cannot add a went-badly flag.
export const recordQuality = mutation({
  args: {
    secret: v.string(),
    conversationId: v.string(),
    sentiment,
    wentBadly: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { secret, conversationId, sentiment: tone, wentBadly, reason }) => {
    assertServer(secret);
    if (!Number.isFinite(wentBadly)) return;
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!existing || existing.blocked) return;
    await ctx.db.patch(existing._id, {
      sentiment: tone,
      wentBadly: Math.min(1, Math.max(0, wentBadly)),
      reason: reason.trim().slice(0, MAX_REASON_CHARS),
      scoredAt: Date.now(),
    });
  },
});

// Merges what changed into the job card here, against the stored card, so overlapping
// turns can't undo each other. A blocked chat is left unchanged.
export const recordJobCard = mutation({
  args: { secret: v.string(), conversationId: v.string(), changes: jobCard },
  handler: async (ctx, { secret, conversationId, changes }) => {
    assertServer(secret);
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!existing || existing.blocked) return;
    await ctx.db.patch(existing._id, { jobCard: mergeJobCard(existing.jobCard, changes), jobCardAt: Date.now() });
  },
});

// What /api/chat needs before a reply, in one read: whether this conversation was
// already stopped (later turns are refused), the job card, and the offer history.
export const blockState = query({
  args: { secret: v.string(), conversationId: v.string() },
  handler: async (ctx, { secret, conversationId }) => {
    assertServer(secret);
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    const offers = conversation?.offers ?? [];
    return {
      blocked: conversation?.blocked === true,
      jobCard: conversation?.jobCard ?? null,
      offers: {
        shown: offers.length,
        lastTurn: offers.at(-1)?.turn ?? null,
        // One definition of taken, shared with /admin (lib/conversation-stage.ts).
        taken: conversation ? conversationStage(conversation).stage === "taken" : false,
        turn: (conversation?.userMessages ?? 0) + 1,
      },
    };
  },
});
