// Feedback on Skaffen's replies (thumbs up/down under each reply). Client-safe.
// Sent to POST /api/feedback and kept for 90 days with the reply and the visitor's
// message before it (convex/feedback.ts). Clearing a rating (null) deletes it.

import { postQuietly } from "@/lib/visit";

export type FeedbackRating = "up" | "down";

export const DOWN_REASONS = [
  "The information wasn't correct",
  "It didn't answer my question",
  "It was hard to understand",
  "It asked too many questions",
] as const;

export const MAX_FEEDBACK_DETAILS_CHARS = 1000;

export type FeedbackPayload = {
  messageId: string;
  conversationId?: string;
  rating: FeedbackRating | null;
  reasons: string[];
  details: string;
  replyText: string;
  userText: string;
};

export function buildFeedbackPayload(input: {
  messageId: string;
  conversationId?: string;
  rating: FeedbackRating | null;
  reasons?: readonly string[];
  details?: string;
  replyText: string;
  userText?: string;
}): FeedbackPayload {
  return {
    messageId: input.messageId,
    conversationId: input.conversationId,
    rating: input.rating,
    reasons: (input.reasons ?? []).filter((reason) =>
      (DOWN_REASONS as readonly string[]).includes(reason),
    ),
    details: (input.details ?? "").trim().slice(0, MAX_FEEDBACK_DETAILS_CHARS),
    replyText: input.replyText,
    userText: input.userText ?? "",
  };
}

/** Fire-and-forget: a failed send never interrupts the visitor. */
export function submitFeedback(payload: FeedbackPayload): void {
  postQuietly("/api/feedback", payload);
}
