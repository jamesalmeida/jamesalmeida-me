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

// The job card (lib/job-card.ts), a running summary of what the visitor needs.
export const jobCard = v.object({
  who: v.optional(v.string()),
  visitorType: v.optional(v.union(v.literal("team"), v.literal("individual"))),
  jobStatement: v.optional(v.string()),
  situation: v.optional(v.string()),
  currentApproach: v.optional(v.string()),
  outcomes: v.optional(v.array(v.string())),
  worstStep: v.optional(
    v.object({
      text: v.string(),
      jobMapStep: v.optional(
        v.union(
          v.literal("define"),
          v.literal("locate"),
          v.literal("prepare"),
          v.literal("confirm"),
          v.literal("execute"),
          v.literal("monitor"),
          v.literal("modify"),
          v.literal("conclude"),
        ),
      ),
    }),
  ),
  roles: v.optional(
    v.object({
      executor: v.optional(v.string()),
      maintainer: v.optional(v.string()),
      buyer: v.optional(v.string()),
    }),
  ),
  financialOutcomes: v.optional(v.string()),
  relatedJobs: v.optional(v.array(v.string())),
  emotionalSocial: v.optional(v.string()),
  timing: v.optional(v.string()),
  budgetSignal: v.optional(v.string()),
  quotes: v.optional(v.array(v.string())),
});

// Jev's latest readiness scores, each 0–1 (lib/jev-decision.ts).
export const readiness = v.object({
  buyingSignal: v.number(),
  engagementFading: v.number(),
  goingNowhere: v.number(),
  cardCompleteness: v.number(),
});

export const offerReason = v.union(
  v.literal("intent"),
  v.literal("buying_signal"),
  v.literal("fading"),
  v.literal("card_ready"),
);
export const offerKind = v.union(v.literal("brief"), v.literal("booking"));
export const offerLead = v.union(v.literal("book"), v.literal("note"));

// One card shown to the visitor. `reason` is unset when the reply model offered on its own.
export const offer = v.object({
  at: v.number(),
  turn: v.number(),
  // The card's tool call id. Answers are tied to it, so an older card can't answer
  // the newest offer. Optional on offers stored before ids existed.
  id: v.optional(v.string()),
  kind: offerKind,
  lead: v.optional(offerLead),
  reason: v.optional(offerReason),
  outcome: v.optional(v.union(v.literal("accepted"), v.literal("declined"))),
});

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
    // Updated after each reply. Deleted with the conversation; never copied onto a lead.
    jobCard: v.optional(jobCard),
    jobCardAt: v.optional(v.number()),
    // Latest screen's scores, and every card shown so far (the cooldown reads these).
    readiness: v.optional(readiness),
    offers: v.optional(v.array(offer)),
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
    // offer_shown, offer_accepted, offer_declined. Thresholds are tuned from these.
    offer: v.optional(
      v.object({
        kind: offerKind,
        turn: v.number(),
        id: v.optional(v.string()),
        lead: v.optional(offerLead),
        reason: v.optional(offerReason),
        readiness: v.optional(readiness),
      }),
    ),
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
    // Client sequence for this reply's writes, so a quick click can't land after a
    // newer one. Optional on rows stored before it existed.
    sequence: v.optional(v.number()),
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
    // The visitor's own note. Written by them and not screened, so it's untrusted text.
    note: v.optional(v.string()),
    conversationId: v.optional(v.string()),
    // The card's tool call id. A repeat send updates the same lead, so James gets
    // one lead and one email.
    offerId: v.optional(v.string()),
    // Copied from the conversation when the lead is saved, so it outlives the 90-day transcript.
    fitScore: v.optional(v.number()),
    // The chat was already closed when this lead was sent. /admin shows a Blocked badge.
    blocked: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_offerId", ["offerId"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
