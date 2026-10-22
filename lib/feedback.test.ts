import { afterEach, describe, expect, it, vi } from "vitest";
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to no reasons, details or user text, and posts to /api/feedback", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
    const payload = buildFeedbackPayload({ messageId: "m2", rating: "up", replyText: "Hi" });
    expect(payload).toMatchObject({ reasons: [], details: "", userText: "" });
    submitFeedback(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/feedback", expect.objectContaining({ method: "POST", keepalive: true }));
  });

  it("never throws when sending fails", () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    expect(() => submitFeedback(buildFeedbackPayload({ messageId: "m3", rating: null, replyText: "" }))).not.toThrow();
  });
});
