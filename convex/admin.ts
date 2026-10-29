import { v } from "convex/values";
import { qualityView, wentBadlyFlag } from "../lib/jev-quality";
import { assertServer, query } from "./lib";

// Read-only queries for the /admin dashboard. The site's server only calls them
// for a signed-in admin (app/api/admin/dashboard).

const FUNNEL_STEPS = ["landing_view", "chat_started", "brief_shown", "booking_clicked", "email_clicked"] as const;
const MAX_EVENTS = 10_000;
const MAX_CONVERSATIONS = 2_000;
const RECENT_LIMIT = 50;
// Went-badly chats stay on the list even when they are older than the latest 50,
// so the admin filter can show them. Capped so the first-message reads stay bounded.
const FLAGGED_LIMIT = 80;

export const dashboard = query({
  args: { secret: v.string(), since: v.number() },
  handler: async (ctx, { secret, since }) => {
    assertServer(secret);

    // Funnel: distinct visits that reached each step.
    const events = await ctx.db
      .query("events")
      .withIndex("by_at", (q) => q.gte("at", since))
      .take(MAX_EVENTS);
    const visitsByStep = new Map<string, Set<string>>(FUNNEL_STEPS.map((step) => [step, new Set()]));
    const headlines = new Map<string, { views: Set<string>; chats: Set<string> }>();
    const referrers = new Map<string, Set<string>>();
    const headlineByVisit = new Map<string, string>();
    // Landing examples sent with an empty composer, by visit.
    const examples = new Map<string, Set<string>>();
    for (const event of events) {
      visitsByStep.get(event.type)?.add(event.visitId);
      if (event.type === "example_sent" && event.example) {
        if (!examples.has(event.example)) examples.set(event.example, new Set());
        examples.get(event.example)!.add(event.visitId);
      }
      if (event.type === "landing_view") {
        const headline = event.headline ?? "(unknown)";
        headlineByVisit.set(event.visitId, headline);
        if (!headlines.has(headline)) headlines.set(headline, { views: new Set(), chats: new Set() });
        headlines.get(headline)!.views.add(event.visitId);
        const referrer = event.utmSource ?? event.referrer ?? "Direct";
        if (!referrers.has(referrer)) referrers.set(referrer, new Set());
        referrers.get(referrer)!.add(event.visitId);
      }
    }
    for (const visitId of visitsByStep.get("chat_started") ?? []) {
      const headline = headlineByVisit.get(visitId);
      if (headline) headlines.get(headline)?.chats.add(visitId);
    }

    const leads = await ctx.db
      .query("leads")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
      .collect();

    // Where conversations stopped.
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_startedAt", (q) => q.gte("startedAt", since))
      .order("desc")
      .take(MAX_CONVERSATIONS);
    const depth = { one: 0, two: 0, three: 0, fourPlus: 0 };
    const outcomes = { noBrief: 0, briefOnly: 0, clicked: 0, lead: 0 };
    const jev = {
      scored: 0,
      fitTotal: 0,
      blocked: 0,
      wentBadly: 0,
      intents: { continue_chat: 0, suggest_book_call: 0, suggest_email: 0 },
    };
    for (const conversation of conversations) {
      if (conversation.userMessages <= 1) depth.one += 1;
      else if (conversation.userMessages === 2) depth.two += 1;
      else if (conversation.userMessages === 3) depth.three += 1;
      else depth.fourPlus += 1;
      if (conversation.leadCaptured) outcomes.lead += 1;
      else if (conversation.bookingClicked || conversation.emailClicked) outcomes.clicked += 1;
      else if (conversation.briefShown) outcomes.briefOnly += 1;
      else outcomes.noBrief += 1;
      if (typeof conversation.fitScore === "number") {
        jev.scored += 1;
        jev.fitTotal += conversation.fitScore;
      }
      if (conversation.blocked) jev.blocked += 1;
      if (
        typeof conversation.wentBadly === "number" &&
        wentBadlyFlag(conversation.wentBadly, { blocked: conversation.blocked === true })
      ) {
        jev.wentBadly += 1;
      }
      if (conversation.intent) jev.intents[conversation.intent] += 1;
    }

    const flagged = conversations.filter(
      (conversation) =>
        typeof conversation.wentBadly === "number" &&
        wentBadlyFlag(conversation.wentBadly, { blocked: conversation.blocked === true }),
    );
    const pickedIds = new Set<string>();
    const picked: typeof conversations = [];
    for (const conversation of [...flagged.slice(0, FLAGGED_LIMIT), ...conversations.slice(0, RECENT_LIMIT)]) {
      if (pickedIds.has(conversation.conversationId)) continue;
      pickedIds.add(conversation.conversationId);
      picked.push(conversation);
    }
    picked.sort((a, b) => b.startedAt - a.startedAt);

    const recent = await Promise.all(
      picked.map(async (conversation) => {
        const first = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation.conversationId))
          .first();
        const quality = qualityView(conversation);
        return {
          conversationId: conversation.conversationId,
          startedAt: conversation.startedAt,
          lastMessageAt: conversation.lastMessageAt,
          userMessages: conversation.userMessages,
          referrer: conversation.utmSource ?? conversation.referrer ?? null,
          device: conversation.device ?? null,
          briefShown: conversation.briefShown,
          clicked: conversation.bookingClicked || conversation.emailClicked,
          leadCaptured: conversation.leadCaptured,
          blocked: conversation.blocked ?? false,
          blockReason: conversation.blockReason ?? null,
          clientIp: conversation.blocked && conversation.clientIp ? conversation.clientIp : null,
          intent: conversation.intent ?? null,
          fitScore: conversation.fitScore ?? null,
          sentiment: quality.sentiment,
          wentBadly: quality.wentBadly,
          wentBadlyScore: quality.wentBadlyScore,
          reason: quality.reason,
          scoredAt: quality.scoredAt,
          firstMessage: first?.text.slice(0, 160) ?? "",
        };
      }),
    );

    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
      .order("desc")
      .take(100);

    return {
      funnel: {
        ...Object.fromEntries(FUNNEL_STEPS.map((step) => [step, visitsByStep.get(step)!.size])),
        leads: leads.length,
      },
      headlines: [...headlines].map(([headline, { views, chats }]) => ({
        headline,
        views: views.size,
        chats: chats.size,
      })),
      // Which examples get people started, and whether those chats reached a brief.
      examples: [...examples]
        .map(([example, visits]) => ({
          example,
          sent: visits.size,
          briefs: [...visits].filter((visitId) => visitsByStep.get("brief_shown")!.has(visitId)).length,
        }))
        .sort((a, b) => b.sent - a.sent),
      ownWords: [...visitsByStep.get("chat_started")!].filter(
        (visitId) => ![...examples.values()].some((visits) => visits.has(visitId)),
      ).length,
      referrers: [...referrers]
        .map(([referrer, visits]) => ({ referrer, visits: visits.size }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10),
      depth,
      outcomes,
      jev: {
        scored: jev.scored,
        averageFit: jev.scored > 0 ? jev.fitTotal / jev.scored : null,
        blocked: jev.blocked,
        wentBadly: jev.wentBadly,
        intents: jev.intents,
      },
      conversationCount: conversations.length,
      truncated: events.length === MAX_EVENTS || conversations.length === MAX_CONVERSATIONS,
      recent,
      feedback: feedback.map(({ _id, _creationTime, expiresAt: _expiresAt, ...item }) => ({
        id: _id,
        ...item,
      })),
    };
  },
});

export const leads = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    assertServer(secret);
    const rows = await ctx.db.query("leads").withIndex("by_createdAt").order("desc").take(200);
    return rows.map(({ _id, _creationTime, ...lead }) => ({ id: _id, ...lead }));
  },
});

export const conversation = query({
  args: { secret: v.string(), conversationId: v.string() },
  handler: async (ctx, { secret, conversationId }) => {
    assertServer(secret);
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .unique();
    if (!conversation) return null;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .take(500);
    const { _id, _creationTime, clientIp, ...details } = conversation;
    const quality = qualityView(conversation);
    return {
      ...details,
      clientIp: conversation.blocked && clientIp ? clientIp : null,
      // `details.wentBadly` is the stored 0–1 score. Replace it with the flag,
      // and keep the number on wentBadlyScore. The reason is only sent when flagged.
      sentiment: quality.sentiment,
      wentBadly: quality.wentBadly,
      wentBadlyScore: quality.wentBadlyScore,
      reason: quality.reason,
      scoredAt: quality.scoredAt,
      messages: messages.map(({ role, text, tools, createdAt }) => ({ role, text, tools, createdAt })),
    };
  },
});
