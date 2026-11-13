// What is in the composer: nothing, only whitespace, or something typed. The
// landing used to hide the example for "blank" but still send it on Enter, so a
// visitor sent a message they never saw.

export type ComposerInput = "empty" | "blank" | "typed";

export function composerInput(text: string): ComposerInput {
  if (text.length === 0) return "empty";
  if (text.trim().length === 0) return "blank";
  return "typed";
}

/** The rotating example shows while the box is empty or only has whitespace. */
export function showExample(input: ComposerInput): boolean {
  return input !== "typed";
}

/**
 * Sending the example is for an empty or whitespace-only box. The overlay is shown
 * for both, so the visitor never sends a message they couldn't see.
 */
export function sendsExample(input: ComposerInput): boolean {
  return input !== "typed";
}
