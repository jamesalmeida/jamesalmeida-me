import { SITE } from "@/data/site";
import type { BriefLead } from "@/lib/brief";

export {
  FALLBACK_REASON,
  QUALITY_SIGNAL_THRESHOLD,
  SENTIMENT_CONFIDENCE_MIN,
  SENTIMENT_LABEL,
  WENT_BADLY_THRESHOLD,
  decideQuality,
  qualityView,
  wentBadlyFlag,
  type QualityDecision,
  type QualityReadings,
  type QualityView,
  type Sentiment,
} from "./jev-quality";

// Thresholds are this app's policy, adapted from TypeSafe's guardrails cookbook.
// A hazard at or above the action line blocks the turn. A milder hit blocks only
// when the severity score reaches "serious" (2 on a 0–3 scale). An intent nudges
// a CTA only when Jev's confidence is at least 0.5, and only once per chat.

export const HAZARD_ACTION_THRESHOLD = 0.7;
export const HAZARD_REVIEW_THRESHOLD = 0.35;
export const SEVERITY_BLOCK = 2;
export const INTENT_CONFIDENCE_MIN = 0.5;

// When to offer the brief or the booking card. Tune these from the offer events in
// /admin. A complete card, a buying signal or fading engagement each trigger an offer.
// Unless Jev is confident about the intent, a buying signal leads with booking and
// the rest lead with a note.
export const BUYING_SIGNAL_THRESHOLD = 0.6;
export const ENGAGEMENT_FADING_THRESHOLD = 0.6;
export const CARD_READY_COMPLETENESS = 1;
/** Visitor turns to wait after an offer before offering again. */
export const OFFER_COOLDOWN_TURNS = 3;
export const MAX_OFFERS_PER_CHAT = 3;
/** Scored only for now: shown in /admin, with no effect on the chat. */
export const GOING_NOWHERE_FLAG = 0.6;

export const BLOCK_REASONS = ["spam", "jailbreak", "abuse"] as const;
export type BlockReason = (typeof BLOCK_REASONS)[number];

export const JEV_INTENTS = ["continue_chat", "suggest_book_call", "suggest_email"] as const;
export type JevIntent = (typeof JEV_INTENTS)[number];

export type JevNudge = "none" | "book" | "email";

export const OFFER_REASONS = ["intent", "buying_signal", "fading", "card_ready"] as const;
export type OfferReason = (typeof OFFER_REASONS)[number];

export const OFFER_REASON_LABEL: Record<OfferReason, string> = {
  intent: "Jev suggested it",
  buying_signal: "Buying signal",
  fading: "Engagement fading",
  card_ready: "Card ready",
};

/** The latest readiness scores for a conversation, each 0–1. */
export type Readiness = {
  buyingSignal: number;
  engagementFading: number;
  goingNowhere: number;
  cardCompleteness: number;
};

/** From Convex. Null when storage is off or the read failed. */
export type OfferHistory = {
  shown: number;
  lastTurn: number | null;
  /** They already booked, emailed or sent the brief. */
  taken: boolean;
  /** This visitor turn, counting from 1. */
  turn: number;
};

export const BLOCK_REASON_LABEL: Record<BlockReason, string> = {
  spam: "Spam",
  jailbreak: "Jailbreak",
  abuse: "Abuse",
};

export const INTENT_LABEL: Record<JevIntent, string> = {
  continue_chat: "Kept chatting",
  suggest_book_call: "Suggest a call",
  suggest_email: "Suggest email",
};

/** Shown as Skaffen's reply when a turn is blocked. The chat model is not called. The chat ends. */
export const BLOCKED_REPLY = `I can't take that one further. This chat is closed. If you're here about your own work and how James can help, email him at ${SITE.email}.`;

/** Earlier wording. Still closes a thread that was blocked before the copy changed. */
const EARLIER_BLOCKED_REPLY = `I can't take that one further. If you're here about your own work and how James can help, tell me a little about that, or email him at ${SITE.email}.`;

const CLOSED_REPLIES = [BLOCKED_REPLY, EARLIER_BLOCKED_REPLY];

/** The id prefix of the canned refusal. The wording can change without reopening old chats. */
export const CLOSED_MESSAGE_ID_PREFIX = "closed-";

/** A stable id for the refusal message, so the client marks the message, not the copy. */
export function closedMessageId(): string {
  return `${CLOSED_MESSAGE_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isClosedMessageId(id: string | undefined): boolean {
  return typeof id === "string" && id.startsWith(CLOSED_MESSAGE_ID_PREFIX);
}

/** True when the reply is the canned refusal, so the client must not send the turn to the title model. */
export function replyWasBlocked(text: string): boolean {
  const trimmed = text.trim();
  return CLOSED_REPLIES.some((reply) => reply === trimmed);
}

type TextPart = { type: string; text?: unknown };

/**
 * True when an earlier assistant turn was the canned refusal, so this chat stays closed.
 * New refusals carry a `closed-…` id; the text check stays for threads closed before that.
 */
export function threadIsClosed(
  messages: readonly {
    id?: string;
    role: string;
    parts?: readonly TextPart[];
    content?: readonly TextPart[];
  }[],
): boolean {
  return messages.some((message) => {
    if (message.role !== "assistant") return false;
    if (isClosedMessageId(message.id)) return true;
    const parts = message.parts ?? message.content ?? [];
    const text = parts
      .flatMap((part) => (part.type === "text" && typeof part.text === "string" ? [part.text] : []))
      .join("\n\n");
    return replyWasBlocked(text);
  });
}

export type JevReadings = {
  spam: number;
  jailbreak: number;
  abuse: number;
  /** 0–3, from Jev's severity rubric. */
  severity: number;
  intent: string;
  intentConfidence: number;
  /** 0–3, from Jev's fit rubric. */
  fitScore: number;
  buyingSignal: number;
  engagementFading: number;
  goingNowhere: number;
};

export type JevDecision = {
  action: "pass" | "block";
  blockReason: BlockReason | null;
  intent: JevIntent;
  nudge: JevNudge;
  /**
   * The chat model must call a CTA tool on this turn. Claude Sonnet 5.5 rejects forced
   * tool use, so the provider drops this and only the nudge's wording carries it. An
   * offer only counts once a card is shown, so a missed nudge just fires again next turn.
   */
  forceTool: boolean;
  fitScore: number;
  /** Why this turn offers a card. Null when it doesn't. */
  offerReason: OfferReason | null;
  /** Null when Jev failed and only the local check ran. */
  readiness: Readiness | null;
};

export type StoredScreen = {
  blocked: boolean;
  blockReason?: BlockReason;
  intent: JevIntent;
  fitScore: number;
  readiness?: Readiness;
};

type PartLike = { type: string };

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(3, Math.max(0, value));
}

function asIntent(value: string): JevIntent {
  return (JEV_INTENTS as readonly string[]).includes(value) ? (value as JevIntent) : "continue_chat";
}

export function ctaAlreadyShown(messages: readonly { parts: readonly PartLike[] }[]): boolean {
  return messages.some((message) =>
    message.parts.some((part) => part.type === "tool-showBookingCta" || part.type === "tool-showBrief"),
  );
}

/**
 * Whether this turn may force an offer. A visitor who asks how to reach James still
 * gets a card: the reply model shows it, and nothing here stops that. Without stored
 * history, an offer still in the thread counts as the one offer.
 */
export function offerAllowed(offers: OfferHistory | null | undefined, ctaShown: boolean): boolean {
  if (!offers) return !ctaShown;
  if (offers.taken || offers.shown >= MAX_OFFERS_PER_CHAT) return false;
  return offers.lastTurn === null || offers.turn - offers.lastTurn > OFFER_COOLDOWN_TURNS;
}

function offerReason(
  intentConfident: boolean,
  readiness: Readiness,
): OfferReason | null {
  if (intentConfident) return "intent";
  if (readiness.buyingSignal >= BUYING_SIGNAL_THRESHOLD) return "buying_signal";
  if (readiness.engagementFading >= ENGAGEMENT_FADING_THRESHOLD) return "fading";
  if (readiness.cardCompleteness >= CARD_READY_COMPLETENESS) return "card_ready";
  return null;
}

export function decideJev(
  readings: JevReadings,
  options: { ctaAlreadyShown: boolean; offers?: OfferHistory | null; cardCompleteness?: number },
): JevDecision {
  const hazards: Record<BlockReason, number> = {
    spam: clampUnit(readings.spam),
    jailbreak: clampUnit(readings.jailbreak),
    abuse: clampUnit(readings.abuse),
  };
  const severity = clampScore(readings.severity);

  let blockReason: BlockReason | null = null;
  let best = -1;
  for (const reason of BLOCK_REASONS) {
    const probability = hazards[reason];
    const blocks =
      probability >= HAZARD_ACTION_THRESHOLD ||
      (probability >= HAZARD_REVIEW_THRESHOLD && severity >= SEVERITY_BLOCK);
    if (blocks && probability > best) {
      best = probability;
      blockReason = reason;
    }
  }

  const intent = asIntent(readings.intent);
  const confident = clampUnit(readings.intentConfidence) >= INTENT_CONFIDENCE_MIN;
  const intentWantsCta = confident && intent !== "continue_chat";
  const readiness: Readiness = {
    buyingSignal: clampUnit(readings.buyingSignal),
    engagementFading: clampUnit(readings.engagementFading),
    goingNowhere: clampUnit(readings.goingNowhere),
    cardCompleteness: clampUnit(options.cardCompleteness ?? 0),
  };
  const reason =
    !blockReason && offerAllowed(options.offers, options.ctaAlreadyShown) ? offerReason(intentWantsCta, readiness) : null;
  const leadsWithBooking = intentWantsCta
    ? intent === "suggest_book_call"
    : readiness.buyingSignal >= BUYING_SIGNAL_THRESHOLD;
  const nudge: JevNudge = !reason ? "none" : leadsWithBooking ? "book" : "email";

  return {
    action: blockReason ? "block" : "pass",
    blockReason,
    intent,
    nudge,
    forceTool: nudge !== "none",
    fitScore: clampScore(readings.fitScore),
    offerReason: reason,
    readiness,
  };
}

export function storedScreen(decision: JevDecision): StoredScreen {
  return {
    blocked: decision.action === "block",
    ...(decision.blockReason ? { blockReason: decision.blockReason } : {}),
    intent: decision.intent,
    fitScore: decision.fitScore,
    ...(decision.readiness ? { readiness: decision.readiness } : {}),
  };
}

/** What /api/chat writes for one turn. `clientIp` is set only when that turn is blocked. */
export type ScreenWrite = StoredScreen | { blocked: true; blockReason?: BlockReason; clientIp?: string };

export function screenForStore(
  decision: JevDecision | null,
  options: { chatClosed?: boolean; clientIp?: string } = {},
): ScreenWrite | undefined {
  const chatClosed = options.chatClosed === true;
  if (!decision && !chatClosed) return undefined;
  const clientIp = options.clientIp || undefined;
  if (!decision) return { blocked: true, ...(clientIp ? { clientIp } : {}) };
  const stored = storedScreen(decision);
  const blocked = stored.blocked || chatClosed;
  if (!blocked) return stored;
  return { ...stored, blocked: true, ...(clientIp ? { clientIp } : {}) };
}

/** Turn-specific instruction. The choice itself comes from Jev, not from this text. */
export function intentNudge(nudge: Exclude<JevNudge, "none">): string {
  const which =
    nudge === "book"
      ? "A separate check of this conversation says it is time to suggest booking a discovery call. Point them at the discovery call."
      : "A separate check of this conversation says it is time to suggest sending James a note rather than booking. Point them at sending James their brief.";
  const lead = nudge === "book" ? "book" : "note";
  return `${which} Call showBrief with lead set to "${lead}" if you know who they are or what they're trying to get done; otherwise call showBookingCta. You must call one of those tools on this turn, and still write a short text reply. Do not mention this check. Do not ask for their email or name in the chat. Do not say how long the call is.`;
}

export type OfferWrite = {
  /** The card's tool call id, so an answer is tied to the card that was shown. */
  id?: string;
  kind: "brief" | "booking";
  lead?: BriefLead;
  reason?: OfferReason;
  readiness?: Readiness;
};

/** The card a finished reply showed, if any. Offers the reply model made on its own have no reason. */
export function offerFromReply(
  calls: readonly { toolName: string; toolCallId?: string; input?: unknown }[],
  decision: JevDecision | null,
): OfferWrite | undefined {
  const brief = calls.find((call) => call.toolName === "showBrief");
  const booking = calls.find((call) => call.toolName === "showBookingCta");
  if (!brief && !booking) return undefined;
  const lead = brief && typeof brief.input === "object" && brief.input ? (brief.input as { lead?: unknown }).lead : undefined;
  const id = (brief ?? booking)?.toolCallId;
  return {
    ...(id ? { id } : {}),
    kind: brief ? "brief" : "booking",
    ...(lead === "book" || lead === "note" ? { lead } : {}),
    ...(decision?.offerReason ? { reason: decision.offerReason } : {}),
    ...(decision?.readiness ? { readiness: decision.readiness } : {}),
  };
}

export function formatFit(score: number): string {
  return `Fit ${score.toFixed(1)}`;
}

export function fitLabel(score: number): string {
  if (score < 0.5) return "Not a fit";
  if (score < 1.5) return "Weak fit";
  if (score < 2.5) return "Plausible fit";
  return "Strong fit";
}
