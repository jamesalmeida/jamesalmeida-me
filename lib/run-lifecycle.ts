// How a chat run ended, decided in one place. The client used to keep several
// previous-isRunning refs and play the success chime before checking the outcome.

export type RunOutcome = "completed" | "stopped" | "failed";

export type RunStatusLike =
  | { type: "running" }
  | { type: "requires-action"; reason?: string }
  | { type: "complete" }
  | { type: "incomplete"; reason?: string }
  | undefined;

export function runOutcome(input: {
  cancelled: boolean;
  errored: boolean;
  lastStatus: RunStatusLike;
}): RunOutcome {
  const status = input.lastStatus;
  if (input.cancelled || (status?.type === "incomplete" && status.reason === "cancelled")) {
    return "stopped";
  }
  if (input.errored || (status?.type === "incomplete" && status.reason === "error")) {
    return "failed";
  }
  if (status?.type === "complete") return "completed";
  return "failed";
}

/** The sound for an outcome: a finished reply gets the ready chime, a failure an error. */
export function runChime(outcome: RunOutcome): "ready" | "error" | null {
  if (outcome === "completed") return "ready";
  if (outcome === "failed") return "error";
  return null;
}

/** Only a completed reply is announced, saved as a history title or scored. */
export function runCompletes(outcome: RunOutcome): boolean {
  return outcome === "completed";
}
