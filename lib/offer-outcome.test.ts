import { describe, expect, it } from "vitest";
import { nextOfferOutcome, offerAnswerChanges } from "./offer-outcome";

describe("offer outcome", () => {
  it("accepts, declines and keeps accepted terminal", () => {
    expect(nextOfferOutcome(undefined, "accepted")).toBe("accepted");
    expect(nextOfferOutcome(undefined, "declined")).toBe("declined");
    expect(nextOfferOutcome("declined", "accepted")).toBe("accepted");
    expect(nextOfferOutcome("accepted", "declined")).toBe("accepted");
    expect(nextOfferOutcome("declined", "declined")).toBe("declined");
  });

  it("records an event only when the outcome changes", () => {
    expect(offerAnswerChanges(undefined, "declined")).toBe(true);
    expect(offerAnswerChanges("declined", "declined")).toBe(false);
    expect(offerAnswerChanges("declined", "accepted")).toBe(true);
    expect(offerAnswerChanges("accepted", "declined")).toBe(false);
  });
});
