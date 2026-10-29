import { describe, expect, it } from "vitest";
import {
  FALLBACK_REASON,
  QUALITY_SIGNAL_THRESHOLD,
  SENTIMENT_CONFIDENCE_MIN,
  WENT_BADLY_THRESHOLD,
  decideQuality,
  qualityView,
  wentBadlyFlag,
  type QualityReadings,
} from "./jev-quality";

const calm: QualityReadings = {
  sentiment: "neutral",
  sentimentConfidence: 0.9,
  wentBadly: 0.05,
  invented: 0,
  misunderstood: 0,
  dodged: 0,
  frustrated: 0,
  confused: 0,
  repeated: 0,
  brokenCard: 0,
  cantDo: 0,
  leftMidQuestion: 0,
};

function decide(readings: Partial<QualityReadings>, blocked = false) {
  return decideQuality({ ...calm, ...readings }, { blocked });
}

describe("decideQuality", () => {
  it("keeps a calm chat unflagged and stores the sentiment", () => {
    const decision = decide({ sentiment: "positive", sentimentConfidence: 0.8, wentBadly: 0.12 });
    expect(decision).toMatchObject({
      sentiment: "positive",
      wentBadly: 0.12,
      flagged: false,
      reason: "",
    });
    expect(wentBadlyFlag(0.12)).toBe(false);
  });

  it("flags at the threshold and not just under it", () => {
    expect(decide({ wentBadly: WENT_BADLY_THRESHOLD }).flagged).toBe(true);
    expect(decide({ wentBadly: WENT_BADLY_THRESHOLD - 0.01 }).flagged).toBe(false);
    expect(wentBadlyFlag(1.4)).toBe(true);
    expect(decide({ wentBadly: Number.NaN }).wentBadly).toBe(0);
  });

  it("does not flag a blocked chat, however high the score", () => {
    const decision = decide({ wentBadly: 0.99, frustrated: 0.99, sentiment: "negative" }, true);
    expect(decision.flagged).toBe(false);
    expect(decision.wentBadly).toBe(0.99);
    expect(wentBadlyFlag(0.99, { blocked: true })).toBe(false);
  });

  it("does not treat a negative sentiment alone as a failure", () => {
    expect(decide({ sentiment: "negative", sentimentConfidence: 1, wentBadly: 0.4 }).flagged).toBe(false);
  });

  it("falls back to neutral when the sentiment is unknown or unsure", () => {
    expect(decide({ sentiment: "angry", sentimentConfidence: 0.99 }).sentiment).toBe("neutral");
    expect(decide({ sentiment: "negative", sentimentConfidence: SENTIMENT_CONFIDENCE_MIN - 0.01 }).sentiment).toBe(
      "neutral",
    );
    expect(decide({ sentiment: "negative", sentimentConfidence: SENTIMENT_CONFIDENCE_MIN }).sentiment).toBe("negative");
    expect(decide({ sentiment: "positive", sentimentConfidence: Number.NaN }).sentiment).toBe("neutral");
  });

  it("names the strongest signals in plain English, and drops the rest", () => {
    const decision = decide({
      wentBadly: 0.84,
      invented: 0.91,
      frustrated: 0.9,
      confused: 0.8,
      repeated: 0.7,
      dodged: QUALITY_SIGNAL_THRESHOLD - 0.01,
    });
    expect(decision.flagged).toBe(true);
    expect(decision.reason).toBe(
      "Skaffen gave wrong or made-up information. The visitor seemed frustrated or annoyed. The visitor seemed confused.",
    );
    expect(decision.reason).not.toMatch(/repeat|dodged/i);
  });

  it("breaks a probability tie toward wrong information", () => {
    const decision = decide({
      wentBadly: 0.7,
      invented: 0.8,
      frustrated: 0.8,
    });
    expect(decision.reason.startsWith("Skaffen gave wrong or made-up information.")).toBe(true);
  });

  it("uses a fallback sentence when the score is high and no signal crossed the line", () => {
    expect(decide({ wentBadly: 0.66 }).reason).toBe(FALLBACK_REASON);
  });

  it("keeps a signal reason even when the chat is just under the flag line", () => {
    const decision = decide({ wentBadly: 0.5, confused: 0.7 });
    expect(decision.flagged).toBe(false);
    expect(decision.reason).toBe("The visitor seemed confused.");
  });
});

describe("qualityView", () => {
  it("shows the reason only on a flagged, unblocked chat", () => {
    expect(
      qualityView({
        sentiment: "negative",
        wentBadly: 0.82,
        reason: "Skaffen dodged the question.",
        scoredAt: 10,
      }),
    ).toEqual({
      sentiment: "negative",
      wentBadly: true,
      wentBadlyScore: 0.82,
      reason: "Skaffen dodged the question.",
      scoredAt: 10,
    });
    expect(
      qualityView({
        blocked: true,
        sentiment: "negative",
        wentBadly: 0.99,
        reason: "Skaffen dodged the question.",
        scoredAt: 10,
      }),
    ).toMatchObject({ sentiment: "negative", wentBadly: false, reason: null, wentBadlyScore: 0.99 });
    expect(qualityView({ wentBadly: 0.2, reason: "The visitor seemed confused.", sentiment: "fine" })).toEqual({
      sentiment: null,
      wentBadly: false,
      wentBadlyScore: 0.2,
      reason: null,
      scoredAt: null,
    });
  });
});
