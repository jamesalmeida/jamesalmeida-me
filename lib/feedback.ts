// Feedback on Skaffen's replies (thumbs up/down under each reply). Client-safe.
// Nothing is sent yet: see https://github.com/jamesalmeida/jamesalmeida-me/issues/47

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
  rating: FeedbackRating;
  reasons: string[];
  details: string;
  replyText: string;
};

export function buildFeedbackPayload(input: {
  messageId: string;
  rating: FeedbackRating;
  reasons?: readonly string[];
  details?: string;
  replyText: string;
}): FeedbackPayload {
  return {
    messageId: input.messageId,
    rating: input.rating,
    reasons: (input.reasons ?? []).filter((reason) =>
      (DOWN_REASONS as readonly string[]).includes(reason),
    ),
    details: (input.details ?? "").trim().slice(0, MAX_FEEDBACK_DETAILS_CHARS),
    replyText: input.replyText,
  };
}

// Placeholder: resolves without sending anything until issue #47 picks a destination.
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  void payload;
}
