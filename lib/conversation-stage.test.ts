import { describe, expect, it } from "vitest";
import { conversationStage } from "./conversation-stage";

describe("conversation stage", () => {
  it("has one definition of taken, from flags or an accepted offer", () => {
    expect(conversationStage({ leadCaptured: true }).stage).toBe("taken");
    expect(conversationStage({ bookingClicked: true }).stage).toBe("taken");
    expect(conversationStage({ emailClicked: true }).stage).toBe("taken");
    expect(conversationStage({ offers: [{ outcome: "accepted" }] }).stage).toBe("taken");
  });

  it("reports an offer that hasn't been taken", () => {
    expect(conversationStage({ briefShown: true }).stage).toBe("offered");
    expect(conversationStage({ offers: [{ outcome: "declined" }] }).stage).toBe("offered");
  });

  it("reports a chat with no offer yet", () => {
    expect(conversationStage({}).stage).toBe("chatting");
  });

  it("keeps blocked separate, so a lead from a closed chat is still taken", () => {
    const progress = conversationStage({ blocked: true, leadCaptured: true });
    expect(progress).toEqual({ stage: "taken", blocked: true });
  });
});
