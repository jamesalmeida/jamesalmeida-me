import type { FeedbackRating } from "@/lib/feedback";

// One reply's feedback controls. Rating, the popover and the form used to be three
// booleans; they are one panel now. The rating and the details are kept per reply,
// and each write carries a sequence number so a quick click can't land after a
// newer one. The number never goes below the clock, so a counter that restarts
// (storage cleared, or this reply dropped out of the cap) still beats the stored one.

export type FeedbackPanel = "none" | "thanks" | "form";

export type FeedbackState = {
  rating: FeedbackRating | null;
  panel: FeedbackPanel;
  hasSentDetails: boolean;
  sequence: number;
  reasons: string[];
  details: string;
};

export type FeedbackEvent =
  | { type: "restored"; rating: FeedbackRating | null; reasons: string[]; details: string; sequence: number }
  | { type: "rated"; rating: FeedbackRating | null }
  | { type: "open_form" }
  | { type: "close_panel" }
  | { type: "details_sent"; reasons: string[]; details: string };

export function initialFeedback(): FeedbackState {
  return {
    rating: null,
    panel: "none",
    hasSentDetails: false,
    sequence: 0,
    reasons: [],
    details: "",
  };
}

/** The next write's sequence: one more than the last, and never behind the clock. */
export function nextSequence(previous: number, now: number = Date.now()): number {
  return Math.max(previous + 1, now);
}

export function reduceFeedback(state: FeedbackState, event: FeedbackEvent): FeedbackState {
  switch (event.type) {
    case "restored":
      return {
        rating: event.rating,
        panel: "none",
        hasSentDetails: event.reasons.length > 0 || event.details.length > 0,
        sequence: event.sequence,
        reasons: event.reasons,
        details: event.details,
      };
    case "rated":
      return {
        ...state,
        rating: event.rating,
        panel: event.rating ? "thanks" : "none",
        hasSentDetails: event.rating ? state.hasSentDetails : false,
        sequence: nextSequence(state.sequence),
      };
    case "open_form":
      return state.rating ? { ...state, panel: "form" } : state;
    case "close_panel":
      return { ...state, panel: "none" };
    case "details_sent":
      return {
        ...state,
        reasons: event.reasons,
        details: event.details,
        hasSentDetails: true,
        panel: "thanks",
        sequence: nextSequence(state.sequence),
      };
  }
}

export type PersistedFeedback = {
  rating: FeedbackRating | null;
  reasons: string[];
  details: string;
  sequence: number;
};

const FEEDBACK_KEY = "jamesalmeida-feedback";
const MAX_REPLIES = 100;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function readAll(): Record<string, PersistedFeedback> {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const parsed: unknown = JSON.parse(storage.getItem(FEEDBACK_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed as Record<string, unknown>).flatMap(([id, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const candidate = value as Record<string, unknown>;
      const rating = candidate.rating === "up" || candidate.rating === "down" ? candidate.rating : null;
      return [
        [
          id,
          {
            rating,
            reasons: Array.isArray(candidate.reasons)
              ? candidate.reasons.filter((reason): reason is string => typeof reason === "string")
              : [],
            details: typeof candidate.details === "string" ? candidate.details : "",
            sequence: typeof candidate.sequence === "number" ? candidate.sequence : 0,
          },
        ] as const,
      ];
    });
    return Object.fromEntries(entries.slice(-MAX_REPLIES));
  } catch {
    return {};
  }
}

export function readFeedback(messageId: string): PersistedFeedback | null {
  return readAll()[messageId] ?? null;
}

export function writeFeedback(messageId: string, feedback: PersistedFeedback): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const entries = [
      ...Object.entries(readAll()).filter(([id]) => id !== messageId),
      [messageId, feedback] as const,
    ];
    storage.setItem(FEEDBACK_KEY, JSON.stringify(Object.fromEntries(entries.slice(-MAX_REPLIES))));
  } catch {
    // Feedback that isn't kept is fine; the server already has it.
  }
}

export function clearFeedback(): void {
  try {
    getStorage()?.removeItem(FEEDBACK_KEY);
  } catch {
    // Storage may be disabled.
  }
}
