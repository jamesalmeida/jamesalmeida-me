import type { AvatarMood } from "@jamesalmeida/agent-avatars";

// What the latest reply is doing, from the visitor's point of view. Skaffen's mood,
// its status line, the Stop button and the thumbs all read this, so the composer
// can't stop offering Stop while the paced text is still appearing.

export type ReplyPhase = "thinking" | "writing" | "settled";

export function replyPhase(input: {
  held: boolean;
  running: boolean;
  revealing: boolean;
  /** False while the run has produced nothing visible yet. */
  hasContent?: boolean;
}): ReplyPhase {
  if (input.held) return "thinking";
  if (input.running && input.hasContent === false) return "thinking";
  if (input.running || input.revealing) return "writing";
  return "settled";
}

export function replyStatus(phase: ReplyPhase, settledLabel: string): string {
  if (phase === "thinking") return "Thinking";
  if (phase === "writing") return "Writing";
  return settledLabel;
}

/** Stop stays visible until the reply's text has all appeared. */
export function showStop(input: { running: boolean; revealing: boolean }): boolean {
  return input.running || input.revealing;
}

/** Thumbs and copy wait until the reply has settled. */
export function showActions(phase: ReplyPhase, hasText: boolean): boolean {
  return phase === "settled" && hasText;
}

export function replyMood(
  phase: ReplyPhase,
  input: {
    thanks: boolean;
    bringsBrief: boolean;
    visitorTyping: boolean;
    failed: boolean;
  },
): AvatarMood {
  if (phase === "thinking") return "thinking";
  if (phase === "writing") return "writing";
  if (input.thanks) return "love";
  if (input.bringsBrief) return "happy";
  if (input.visitorTyping) return "listening";
  if (input.failed) return "sorry";
  return "idle";
}
