import { SITE } from "@/data/site";

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

export const BLOCK_REASONS = ["spam", "jailbreak", "abuse"] as const;
export type BlockReason = (typeof BLOCK_REASONS)[number];

export const JEV_INTENTS = ["continue_chat", "suggest_book_call", "suggest_email"] as const;
export type JevIntent = (typeof JEV_INTENTS)[number];

export type JevNudge = "none" | "book" | "email";

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

/** True when the reply is the canned refusal, so the client must not send the turn to the title model. */
export function replyWasBlocked(text: string): boolean {
  const trimmed = text.trim();
  return CLOSED_REPLIES.some((reply) => reply === trimmed);
}

type TextPart = { type: string; text?: unknown };

/** True when an earlier assistant turn was the canned refusal, so this chat stays closed. */
export function threadIsClosed(
  messages: readonly { role: string; parts?: readonly TextPart[]; content?: readonly TextPart[] }[],
): boolean {
  return messages.some((message) => {
    if (message.role !== "assistant") return false;
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
};

export type JevDecision = {
  action: "pass" | "block";
  blockReason: BlockReason | null;
  intent: JevIntent;
  nudge: JevNudge;
  /** The chat model must call a CTA tool on this turn. */
  forceTool: boolean;
  fitScore: number;
};

export type StoredScreen = {
  blocked: boolean;
  blockReason?: BlockReason;
  intent: JevIntent;
  fitScore: number;
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

export function decideJev(readings: JevReadings, options: { ctaAlreadyShown: boolean }): JevDecision {
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
  const wantsCta = !blockReason && confident && intent !== "continue_chat" && !options.ctaAlreadyShown;
  const nudge: JevNudge = !wantsCta ? "none" : intent === "suggest_book_call" ? "book" : "email";

  return {
    action: blockReason ? "block" : "pass",
    blockReason,
    intent,
    nudge,
    forceTool: nudge !== "none",
    fitScore: clampScore(readings.fitScore),
  };
}

export function storedScreen(decision: JevDecision): StoredScreen {
  return {
    blocked: decision.action === "block",
    ...(decision.blockReason ? { blockReason: decision.blockReason } : {}),
    intent: decision.intent,
    fitScore: decision.fitScore,
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
      : "A separate check of this conversation says it is time to suggest emailing James rather than booking. Point them at emailing James.";
  return `${which} Call showBrief if you know who they are and what's in the way; otherwise call showBookingCta. You must call one of those tools on this turn, and still write a short text reply. Do not mention this check. Do not ask for their email or name in the chat. Do not say how long the call is.`;
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
