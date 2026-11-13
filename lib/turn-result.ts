import { offerFromReply, type JevDecision, type OfferWrite } from "@/lib/jev-decision";

// One visitor turn, explicitly: refused, completed, stopped or failed. The route
// decides what to store from this, so a stopped run can't be recorded as if the
// visitor saw the whole reply.

export type TurnResult =
  | { kind: "refused"; reason: "closed" | "blocked" }
  | { kind: "completed"; text: string; tools: string[]; offer?: OfferWrite }
  | { kind: "stopped"; text: string; tools: string[]; offer?: OfferWrite }
  | { kind: "failed" };

type StepLike = {
  text: string;
  toolCalls: readonly { toolName: string; toolCallId?: string; input?: unknown; invalid?: boolean }[];
};

/** The reply text, the tool names that rendered, and the offer the card made. */
export function replyFromSteps(
  steps: readonly StepLike[],
  decision: JevDecision | null,
): { text: string; tools: string[]; offer?: OfferWrite } {
  const text = steps.map((step) => step.text).filter(Boolean).join("\n\n");
  // A call that failed validation never rendered a card, so it isn't an offer.
  const calls = steps.flatMap((step) => step.toolCalls).filter((call) => !call.invalid);
  const tools = calls.map((call) => call.toolName);
  const offer = offerFromReply(calls, decision);
  return { text, tools, ...(offer ? { offer } : {}) };
}

export function completedTurn(
  steps: readonly StepLike[],
  decision: JevDecision | null,
): TurnResult {
  return { kind: "completed", ...replyFromSteps(steps, decision) };
}

export function stoppedTurn(
  steps: readonly StepLike[],
  decision: JevDecision | null,
): TurnResult {
  return { kind: "stopped", ...replyFromSteps(steps, decision) };
}

/** Whether this turn has anything to store as Skaffen's reply. */
export function hasReply(result: TurnResult): boolean {
  return (
    (result.kind === "completed" || result.kind === "stopped") &&
    (result.text.trim().length > 0 || result.tools.length > 0)
  );
}
