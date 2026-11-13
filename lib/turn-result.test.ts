import { describe, expect, it } from "vitest";
import { completedTurn, hasReply, stoppedTurn } from "./turn-result";

const call = (toolName: string, input: unknown = {}, invalid = false) => ({
  toolName,
  input,
  ...(invalid ? { invalid } : {}),
});

describe("turn result", () => {
  it("records the text, tools and offer of a completed run", () => {
    const result = completedTurn(
      [{ text: "Here is a brief.", toolCalls: [call("showBrief", { lead: "note" })] }],
      null,
    );
    expect(result).toEqual({
      kind: "completed",
      text: "Here is a brief.",
      tools: ["showBrief"],
      offer: { kind: "brief", lead: "note" },
    });
  });

  it("drops a call that failed validation", () => {
    const result = completedTurn(
      [{ text: "No card.", toolCalls: [call("showBrief", {}, true)] }],
      null,
    );
    expect(result).toEqual({ kind: "completed", text: "No card.", tools: [] });
  });

  it("keeps a card shown before a stop, so a real offer is still recorded", () => {
    const result = stoppedTurn(
      [{ text: "Book when you like.", toolCalls: [call("showBookingCta")] }],
      null,
    );
    expect(result.kind).toBe("stopped");
    expect(result).toMatchObject({ tools: ["showBookingCta"], offer: { kind: "booking" } });
  });

  it("has no reply to store when a stop produced nothing", () => {
    expect(hasReply(stoppedTurn([], null))).toBe(false);
    expect(hasReply({ kind: "failed" })).toBe(false);
    expect(hasReply(completedTurn([{ text: "Hi", toolCalls: [] }], null))).toBe(true);
  });
});
