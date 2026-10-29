import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Jev's screen of a conversation. Optional: absent when TYPESAFE_API_KEY is unset
// or the call failed. `blocked` stays true once any turn was stopped.
export const blockReason = v.union(v.literal("spam"), v.literal("jailbreak"), v.literal("abuse"));
export const jevIntent = v.union(
  v.literal("continue_chat"),
  v.literal("suggest_book_call"),
  v.literal("suggest_email"),
);
export const sentiment = v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"));

// Where a visit came from. Captured in the browser (lib/visit.ts) and checked on the
// server (lib/analytics.ts). No IP addresses or user agents on the visit itself.
export const visitContext = {
  headline: v.optional(v.string()),
  referrer: v.optional(v.string()),
  utmSource: v.optional(v.string()),
  utmMedium: v.optional(v.string()),
  utmCampaign: v.optional(v.string()),
  device: v.optional(v.string()),
};

// Everything except leads and settings has an expiresAt, and crons.ts deletes it
// after 90 days. Leads stay until James deletes them in /admin.
export default defineSchema({
  conversations: defineTable({
    conversationId: v.string(),
    visitId: v.optional(v.string()),
    ...visitContext,
    model: v.optional(v.string()),
    startedAt: v.number(),
    lastMessageAt: v.number(),
    userMessages: v.number(),
    briefShown: v.boolean(),
    bookingClicked: v.boolean(),
    emailClicked: v.boolean(),
    leadCaptured: v.boolean(),
    blocked: v.optional(v.boolean()),
    blockReason: v.optional(blockReason),
    // Visitor IP. Set only when a turn is blocked for spam, jailbreak, or abuse.
    // Ordinary chats leave this unset. Deleted with the conversation after 90 days.
    clientIp: v.optional(v.string()),
    intent: v.optional(jevIntent),
    // 0–3. Jev's fit score for this conversation, updated on each screened turn.
    fitScore: v.optional(v.number()),
    // Latest after-reply quality score. Absent when Jev is off or the call failed.
    // A blocked conversation is not given these, and /admin hides a went-badly flag
    // if one was stored before the block.
    sentiment: v.optional(sentiment),
    // 0–1. Probability the conversation went badly.
    wentBadly: v.optional(v.number()),
    reason: v.optional(v.string()),
    scoredAt: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_startedAt", ["startedAt"])
    .index("by_expiresAt", ["expiresAt"]),

  messages: defineTable({
    conversationId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    tools: v.optional(v.array(v.string())),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_expiresAt", ["expiresAt"]),

  events: defineTable({
    type: v.string(),
    visitId: v.string(),
    conversationId: v.optional(v.string()),
    // example_sent: the landing example the visitor sent.
    example: v.optional(v.string()),
    ...visitContext,
    at: v.number(),
    expiresAt: v.number(),
  })
    .index("by_at", ["at"])
    .index("by_expiresAt", ["expiresAt"]),

  feedback: defineTable({
    messageId: v.string(),
    conversationId: v.optional(v.string()),
    rating: v.union(v.literal("up"), v.literal("down")),
    reasons: v.array(v.string()),
    details: v.string(),
    replyText: v.string(),
    userText: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_expiresAt", ["expiresAt"]),

  leads: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    brief: v.record(v.string(), v.string()),
    conversationId: v.optional(v.string()),
    // Copied from the conversation when the lead is saved, so it outlives the 90-day transcript.
    fitScore: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
