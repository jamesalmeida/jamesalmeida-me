import { describe, expect, it } from "vitest";
import {
  initialRecorder,
  recorderBusy,
  recorderFailed,
  recorderIdle,
  recorderProgress,
  recorderProgressPercent,
  recorderStarted,
  startRecorder,
} from "./share-recorder";

describe("share card recorder", () => {
  it("sets preparing before the first await, so a double click can't start two", () => {
    const preparing = startRecorder(initialRecorder());
    expect(preparing).toEqual({ status: "preparing" });
    expect(startRecorder(preparing)).toBe(preparing);
    expect(recorderBusy(preparing)).toBe(true);
  });

  it("records progress and finishes idle", () => {
    let state = recorderStarted(startRecorder(initialRecorder()));
    state = recorderProgress(state, 0.4);
    expect(recorderProgressPercent(state)).toBe(40);
    expect(recorderBusy(state)).toBe(true);
    expect(recorderIdle(state)).toEqual({ status: "idle" });
    expect(recorderBusy(recorderIdle(state))).toBe(false);
  });

  it("can retry after a failure", () => {
    const failed = recorderFailed(initialRecorder(), "Could not record.");
    expect(failed).toEqual({ status: "failed", message: "Could not record." });
    expect(startRecorder(failed)).toEqual({ status: "preparing" });
  });
});
