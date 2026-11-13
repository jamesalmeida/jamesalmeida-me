import { describe, expect, it } from "vitest";
import { replyMood, replyPhase, replyStatus, showActions, showStop } from "./reply-phase";

describe("reply phase", () => {
  it("is thinking while held, writing while running or appearing, then settled", () => {
    expect(replyPhase({ held: true, running: true, revealing: false })).toBe("thinking");
    expect(replyPhase({ held: false, running: true, revealing: false })).toBe("writing");
    expect(replyPhase({ held: false, running: false, revealing: true })).toBe("writing");
    expect(replyPhase({ held: false, running: false, revealing: false })).toBe("settled");
  });

  it("keeps Stop visible until the text has all appeared", () => {
    expect(showStop({ running: true, revealing: false })).toBe(true);
    expect(showStop({ running: false, revealing: true })).toBe(true);
    expect(showStop({ running: false, revealing: false })).toBe(false);
  });

  it("shows the status line and the actions from the same phase", () => {
    expect(replyStatus("thinking", "James' AI assistant")).toBe("Thinking");
    expect(replyStatus("writing", "James' AI assistant")).toBe("Writing");
    expect(replyStatus("settled", "James' AI assistant")).toBe("James' AI assistant");
    expect(showActions("writing", true)).toBe(false);
    expect(showActions("settled", true)).toBe(true);
    expect(showActions("settled", false)).toBe(false);
  });

  it("derives Skaffen's mood from the phase", () => {
    expect(replyMood("thinking", { thanks: true, bringsBrief: true, visitorTyping: true, failed: true })).toBe("thinking");
    expect(replyMood("writing", { thanks: false, bringsBrief: false, visitorTyping: false, failed: false })).toBe("writing");
    expect(replyMood("settled", { thanks: true, bringsBrief: false, visitorTyping: false, failed: false })).toBe("love");
    expect(replyMood("settled", { thanks: false, bringsBrief: true, visitorTyping: false, failed: false })).toBe("happy");
    expect(replyMood("settled", { thanks: false, bringsBrief: false, visitorTyping: true, failed: false })).toBe("listening");
    expect(replyMood("settled", { thanks: false, bringsBrief: false, visitorTyping: false, failed: true })).toBe("sorry");
    expect(replyMood("settled", { thanks: false, bringsBrief: false, visitorTyping: false, failed: false })).toBe("idle");
  });
});
