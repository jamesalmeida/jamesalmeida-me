// After a reply, Jev scores how the conversation went. This file is the app's
// policy: thresholds, the plain-English reason, and what /admin is allowed to
// show. It has no imports so Convex can use it. A block is never also a
// "went badly" flag.

export const SENTIMENTS = ["positive", "neutral", "negative"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

// A noul near 0.5 is a toss-up. 0.6 is a clear yes, and looser than the 0.7
// line that blocks a turn, because this is a review queue rather than a refusal.
export const WENT_BADLY_THRESHOLD = 0.6;

// A signal is named in the reason only when it is clearly present.
export const QUALITY_SIGNAL_THRESHOLD = 0.55;

// Same bar as the CTA intent. A low-confidence label is stored as neutral.
export const SENTIMENT_CONFIDENCE_MIN = 0.5;

export const MAX_REASON_SIGNALS = 3;
export const MAX_REASON_CHARS = 400;

export const FALLBACK_REASON = "This conversation went badly.";

// Tie-break order when two signals have the same probability. Wrong or made-up
// information leads, because that is the failure James most needs to see.
export const QUALITY_SIGNALS = [
  "invented",
  "misunderstood",
  "dodged",
  "frustrated",
  "confused",
  "repeated",
  "brokenCard",
  "cantDo",
  "leftMidQuestion",
] as const;

export type QualitySignal = (typeof QUALITY_SIGNALS)[number];

export const SIGNAL_PHRASE: Record<QualitySignal, string> = {
  invented: "Skaffen gave wrong or made-up information.",
  misunderstood: "Skaffen misunderstood what they asked.",
  dodged: "Skaffen dodged the question.",
  frustrated: "The visitor seemed frustrated or annoyed.",
  confused: "The visitor seemed confused.",
  repeated: "The visitor had to repeat themselves.",
  brokenCard: "A card or call to action looked broken.",
  cantDo: "They asked for something this site can't do.",
  leftMidQuestion: "The visitor left in the middle of a question.",
};

export type QualityReadings = {
  sentiment: string;
  sentimentConfidence: number;
  /** 0–1 probability that the conversation went badly. */
  wentBadly: number;
} & Record<QualitySignal, number>;

export type QualityDecision = {
  sentiment: Sentiment;
  wentBadly: number;
  /** Score is at least the threshold, and the chat is not blocked. */
  flagged: boolean;
  /** Short plain-English reason. Empty when nothing notable was found. */
  reason: string;
};

export type QualityView = {
  sentiment: Sentiment | null;
  wentBadly: boolean;
  wentBadlyScore: number | null;
  reason: string | null;
  scoredAt: number | null;
};

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function asSentiment(value: string, confidence: number): Sentiment {
  if (clampUnit(confidence) < SENTIMENT_CONFIDENCE_MIN) return "neutral";
  return (SENTIMENTS as readonly string[]).includes(value) ? (value as Sentiment) : "neutral";
}

export function wentBadlyFlag(score: number, options: { blocked?: boolean } = {}): boolean {
  if (options.blocked) return false;
  return clampUnit(score) >= WENT_BADLY_THRESHOLD;
}

function reasonFrom(readings: QualityReadings): string {
  const phrases = QUALITY_SIGNALS.map((id) => ({ id, probability: clampUnit(readings[id]) }))
    .filter((signal) => signal.probability >= QUALITY_SIGNAL_THRESHOLD)
    .sort(
      (a, b) =>
        b.probability - a.probability || QUALITY_SIGNALS.indexOf(a.id) - QUALITY_SIGNALS.indexOf(b.id),
    )
    .slice(0, MAX_REASON_SIGNALS)
    .map((signal) => SIGNAL_PHRASE[signal.id]);
  return phrases.join(" ").slice(0, MAX_REASON_CHARS);
}

export function decideQuality(readings: QualityReadings, options: { blocked?: boolean } = {}): QualityDecision {
  const wentBadly = clampUnit(readings.wentBadly);
  const flagged = wentBadlyFlag(wentBadly, options);
  const signals = reasonFrom(readings);
  const reason = flagged && !signals ? FALLBACK_REASON : signals;
  return {
    sentiment: asSentiment(readings.sentiment, readings.sentimentConfidence),
    wentBadly,
    flagged,
    reason,
  };
}

function isSentiment(value: unknown): value is Sentiment {
  return typeof value === "string" && (SENTIMENTS as readonly string[]).includes(value);
}

/** What Recent chats and the transcript are allowed to show. */
export function qualityView(conversation: {
  blocked?: boolean;
  sentiment?: string;
  wentBadly?: number;
  reason?: string;
  scoredAt?: number;
}): QualityView {
  const score =
    typeof conversation.wentBadly === "number" && Number.isFinite(conversation.wentBadly)
      ? clampUnit(conversation.wentBadly)
      : null;
  const flagged = score !== null && wentBadlyFlag(score, { blocked: conversation.blocked === true });
  const reason = flagged ? conversation.reason?.trim() || null : null;
  return {
    sentiment: isSentiment(conversation.sentiment) ? conversation.sentiment : null,
    wentBadly: flagged,
    wentBadlyScore: score,
    reason,
    scoredAt: typeof conversation.scoredAt === "number" && Number.isFinite(conversation.scoredAt) ? conversation.scoredAt : null,
  };
}
