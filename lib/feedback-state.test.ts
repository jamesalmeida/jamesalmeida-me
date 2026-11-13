import { describe, expect, it } from "vitest";
import { initialFeedback, nextSequence, reduceFeedback } from "./feedback-state";

describe("feedback state", () => {
  it("never lets a restarted counter fall behind a stored sequence", () => {
    // The server keeps the highest sequence it has seen. A counter that restarted at
    // 0 would be ignored; the clock floor keeps new writes ahead of old ones.
    expect(nextSequence(0, 1_800_000_000_000)).toBe(1_800_000_000_000);
    expect(nextSequence(1_800_000_000_000, 1_800_000_000_000)).toBe(1_800_000_000_001);
    expect(nextSequence(0)).toBeGreaterThan(1_700_000_000_000);
  });

  it("restores a rating and its details after a reload", () => {
    const state = reduceFeedback(initialFeedback(), {
      type: "restored",
      rating: "down",
      reasons: ["It didn't answer my question"],
      details: "I wanted pricing",
      sequence: 4,
    });
    expect(state.rating).toBe("down");
    expect(state.hasSentDetails).toBe(true);
    expect(state.reasons).toEqual(["It didn't answer my question"]);
    expect(state.details).toBe("I wanted pricing");
    expect(state.sequence).toBe(4);
  });

  it("rating again keeps the details and increments the sequence", () => {
    let state = reduceFeedback(initialFeedback(), {
      type: "restored",
      rating: "down",
      reasons: ["It didn't answer my question"],
      details: "I wanted pricing",
      sequence: 4,
    });
    state = reduceFeedback(state, { type: "rated", rating: "up" });
    expect(state.rating).toBe("up");
    expect(state.reasons).toEqual(["It didn't answer my question"]);
    expect(state.details).toBe("I wanted pricing");
    expect(state.sequence).toBeGreaterThan(4);
    expect(state.panel).toBe("thanks");
  });

  it("uses one panel: thanks, form or none", () => {
    let state = reduceFeedback(initialFeedback(), { type: "rated", rating: "down" });
    expect(state.panel).toBe("thanks");
    state = reduceFeedback(state, { type: "open_form" });
    expect(state.panel).toBe("form");
    state = reduceFeedback(state, { type: "details_sent", reasons: ["Too long"], details: "" });
    expect(state.panel).toBe("thanks");
    expect(state.hasSentDetails).toBe(true);
    expect(state.sequence).toBeGreaterThan(1);
    state = reduceFeedback(state, { type: "close_panel" });
    expect(state.panel).toBe("none");
  });

  it("clearing a rating closes the panel", () => {
    let state = reduceFeedback(initialFeedback(), { type: "rated", rating: "up" });
    state = reduceFeedback(state, { type: "rated", rating: null });
    expect(state.rating).toBeNull();
    expect(state.panel).toBe("none");
  });
});
