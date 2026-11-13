import { describe, expect, it } from "vitest";
import {
  formDraft,
  formSaved,
  initialSettingsForm,
  isSaving,
  reduceSettingsForm,
} from "./settings-form";

describe("settings form", () => {
  it("has no editor after a failed load, so Save can't send the defaults", () => {
    const state = reduceSettingsForm<string>(initialSettingsForm<string>(), {
      type: "load_failed",
      message: "Could not load.",
    });
    expect(state).toEqual({ status: "load_failed", message: "Could not load." });
    expect(formDraft(state)).toBeNull();
    expect(reduceSettingsForm(state, { type: "edited", draft: "typed" })).toBe(state);
  });

  it("keeps edits made during a save, and a finished save only updates saved", () => {
    let state = reduceSettingsForm<string>(initialSettingsForm<string>(), {
      type: "loaded",
      draft: "first",
    });
    state = reduceSettingsForm(state, { type: "save_started", sending: "first" });
    state = reduceSettingsForm(state, { type: "edited", draft: "second edit during save" });
    expect(isSaving(state)).toBe(true);
    state = reduceSettingsForm(state, { type: "saved", message: "Saved." });
    expect(formSaved(state)).toBe("first");
    expect(formDraft(state)).toBe("second edit during save");
    expect(state.status === "ready" && state.notice).toEqual({ kind: "saved", message: "Saved." });
  });

  it("keeps the saved value and the draft after a failed save", () => {
    let state = reduceSettingsForm<string>(initialSettingsForm<string>(), {
      type: "loaded",
      draft: "saved",
    });
    state = reduceSettingsForm(state, { type: "edited", draft: "draft" });
    state = reduceSettingsForm(state, { type: "save_started", sending: "draft" });
    state = reduceSettingsForm(state, { type: "save_failed", message: "Request failed." });
    expect(formSaved(state)).toBe("saved");
    expect(formDraft(state)).toBe("draft");
    expect(state.status === "ready" && state.notice).toEqual({ kind: "error", message: "Request failed." });
  });

  it("retries a failed load", () => {
    let state = reduceSettingsForm<string>(initialSettingsForm<string>(), {
      type: "load_failed",
      message: "No.",
    });
    state = reduceSettingsForm(state, { type: "retry" });
    expect(state).toEqual({ status: "loading" });
  });
});
