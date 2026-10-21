import { describe, expect, it } from "vitest";
import { DOWN_REASONS, MAX_FEEDBACK_DETAILS_CHARS, buildFeedbackPayload, submitFeedback } from "./feedback";

describe("feedback", () => {
  it("keeps only known reasons and trims and caps details", () => {
    const payload = buildFeedbackPayload({
      messageId: "m1",
      rating: "down",
      reasons: [DOWN_REASONS[0], "made up"],
      details: `  ${"x".repeat(MAX_FEEDBACK_DETAILS_CHARS + 10)}  `,
      replyText: "Hi",
    });
    expect(payload.reasons).toEqual([DOWN_REASONS[0]]);
    expect(payload.details).toHaveLength(MAX_FEEDBACK_DETAILS_CHARS);
    expect(payload).toMatchObject({ messageId: "m1", rating: "down", replyText: "Hi" });
  });

  it("defaults to no reasons or details, and submitting resolves without sending", async () => {
    const payload = buildFeedbackPayload({ messageId: "m2", rating: "up", replyText: "Hi" });
    expect(payload).toMatchObject({ reasons: [], details: "" });
    await expect(submitFeedback(payload)).resolves.toBeUndefined();
  });
});
