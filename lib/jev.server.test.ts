import type { UIMessage } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { JevReadings } from "./jev-decision";
import { screenVisitorTurn, type JevAsk } from "./jev.server";

const readings: JevReadings = {
  spam: 0,
  jailbreak: 0,
  abuse: 0,
  severity: 0,
  intent: "continue_chat",
  intentConfidence: 0.8,
  fitScore: 1,
};

const messages: UIMessage[] = [
  { id: "1", role: "user", parts: [{ type: "text", text: "I run a two-person studio." }] },
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("screenVisitorTurn", () => {
  it("skips the call when the key is missing", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "  ");
    const ask = vi.fn<JevAsk>();
    expect(await screenVisitorTurn(messages, ask)).toBeNull();
    expect(ask).not.toHaveBeenCalled();
  });

  it("skips a turn with no visitor text", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    const ask = vi.fn<JevAsk>();
    const blank: UIMessage[] = [{ id: "1", role: "user", parts: [{ type: "text", text: "   " }] }];
    expect(await screenVisitorTurn(blank, ask)).toBeNull();
    expect(ask).not.toHaveBeenCalled();
  });

  it("returns the decision and caps the transcript", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    const ask = vi.fn<JevAsk>(async () => readings);
    const long: UIMessage[] = [
      { id: "old", role: "user", parts: [{ type: "text", text: "x".repeat(9_000) }] },
      { id: "new", role: "user", parts: [{ type: "text", text: "Can I book a call?" }] },
    ];
    const decision = await screenVisitorTurn(long, ask);
    expect(decision?.action).toBe("pass");
    expect(ask).toHaveBeenCalledOnce();
    const state = ask.mock.calls[0][0];
    expect(state.latestVisitorMessage).toBe("Can I book a call?");
    expect(state.transcript.length).toBeLessThanOrEqual(8_000);
    expect(state.transcript.endsWith("Visitor: Can I book a call?")).toBe(true);
  });

  it("continues the chat when Jev fails", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const ask = vi.fn<JevAsk>(async () => {
      throw Object.assign(new Error("visitor text should not be logged"), { status: 503 });
    });
    expect(await screenVisitorTurn(messages, ask)).toBeNull();
    expect(error).toHaveBeenCalledWith("Jev screen failed; the chat will continue without it.", "Error 503");
    expect(String(error.mock.calls)).not.toContain("visitor text");
  });
});
