import { describe, expect, it } from "vitest";
import {
  canDismiss,
  canEdit,
  canSubmit,
  initialBriefCard,
  isSent,
  reduceBriefCard,
} from "./brief-card";

describe("brief card", () => {
  it("sends once and makes the sent card terminal", () => {
    let state = initialBriefCard({ job: "Find where AI fits" });
    state = reduceBriefCard(state, { type: "open_form" });
    state = reduceBriefCard(state, { type: "submit_started" });
    expect(canDismiss(state)).toBe(false);
    expect(canSubmit(state)).toBe(false);
    state = reduceBriefCard(state, { type: "submit_sent", brief: state.brief });

    expect(isSent(state)).toBe(true);
    expect(canEdit(state)).toBe(false);
    expect(canDismiss(state)).toBe(false);
    expect(canSubmit(state)).toBe(false);
    expect(state.view).toBe("card");

    // A repeat send and an edit are ignored.
    expect(reduceBriefCard(state, { type: "submit_started" })).toBe(state);
    expect(reduceBriefCard(state, { type: "toggle_edit" })).toBe(state);
  });

  it("ignores Not yet while submitting", () => {
    let state = initialBriefCard({ job: "x" });
    state = reduceBriefCard(state, { type: "submit_started" });
    expect(reduceBriefCard(state, { type: "dismiss" })).toBe(state);
  });

  it("keeps edits and the form state when collapsed", () => {
    let state = initialBriefCard({ job: "x" });
    state = reduceBriefCard(state, { type: "open_form" });
    state = reduceBriefCard(state, { type: "dismiss" });
    expect(state.view).toBe("collapsed");
    expect(state.form).toBe("open");
    expect(state.brief).toEqual({ job: "x" });
    expect(reduceBriefCard(state, { type: "restore" }).view).toBe("card");
  });

  it("turns a 400 into an editable invalid state and a network error into the mailto offer", () => {
    let state = initialBriefCard({ job: "x" });
    state = reduceBriefCard(state, { type: "submit_started" });
    const invalid = reduceBriefCard(state, { type: "submit_invalid", message: "Enter a valid email." });
    expect(invalid.send).toEqual({ status: "invalid", message: "Enter a valid email." });
    expect(canSubmit(invalid)).toBe(true);

    state = reduceBriefCard(invalid, { type: "submit_started" });
    expect(reduceBriefCard(state, { type: "submit_unavailable" }).send).toEqual({ status: "unavailable" });
  });

  it("restores a sent card so a reload can't send it again", () => {
    const restored = reduceBriefCard(initialBriefCard({ job: "x" }), {
      type: "restored",
      brief: { job: "y" },
      view: "collapsed",
      sentBrief: { job: "y" },
    });
    expect(isSent(restored)).toBe(true);
    expect(restored.send).toEqual({ status: "sent", sentBrief: { job: "y" } });
    expect(restored.view).toBe("collapsed");
  });
  it("Send to James toggles the form and keeps it mounted when closed", () => {
    let state = initialBriefCard({ who: "Dental office" });
    state = reduceBriefCard(state, { type: "toggle_form" });
    expect(state.form).toBe("open");
    state = reduceBriefCard(state, { type: "toggle_form" });
    expect(state.form).toBe("closed");
    state = reduceBriefCard(state, { type: "toggle_form" });
    expect(state.form).toBe("open");
    state = reduceBriefCard(state, { type: "submit_started" });
    expect(reduceBriefCard(state, { type: "toggle_form" })).toBe(state);
  });
});
