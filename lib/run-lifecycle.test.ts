import { describe, expect, it } from "vitest";
import { runChime, runCompletes, runOutcome } from "./run-lifecycle";

describe("run lifecycle", () => {
  it("calls a finished run completed", () => {
    const outcome = runOutcome({ cancelled: false, errored: false, lastStatus: { type: "complete" } });
    expect(outcome).toBe("completed");
    expect(runChime(outcome)).toBe("ready");
    expect(runCompletes(outcome)).toBe(true);
  });

  it("does not play the success chime for a stop", () => {
    const outcome = runOutcome({ cancelled: true, errored: false, lastStatus: { type: "complete" } });
    expect(outcome).toBe("stopped");
    expect(runChime(outcome)).toBeNull();
    expect(runCompletes(outcome)).toBe(false);
  });

  it("does not play the success chime for a failure", () => {
    const outcome = runOutcome({ cancelled: false, errored: true, lastStatus: { type: "complete" } });
    expect(outcome).toBe("failed");
    expect(runChime(outcome)).toBe("error");
    expect(runCompletes(outcome)).toBe(false);
  });

  it("reads an errored reply as failed and an aborted one as stopped", () => {
    expect(
      runOutcome({ cancelled: false, errored: false, lastStatus: { type: "incomplete", reason: "error" } }),
    ).toBe("failed");
    expect(
      runOutcome({ cancelled: false, errored: false, lastStatus: { type: "incomplete", reason: "cancelled" } }),
    ).toBe("stopped");
  });
});
