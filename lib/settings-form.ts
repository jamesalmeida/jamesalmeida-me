// One settings form's flow: loading, a failed load, editing, saving, and a saved
// draft. Every /admin settings form uses this, so a failed load can't be mistaken
// for the defaults. A finished save sets `saved = sending` and leaves later edits
// in `draft`.

export type SettingsFormNotice = { kind: "saved" | "error"; message: string };

export type SettingsFormState<T> =
  | { status: "loading" }
  | { status: "load_failed"; message: string }
  | { status: "ready"; saved: T; draft: T; notice: SettingsFormNotice | null }
  | { status: "saving"; saved: T; draft: T; sending: T; notice: SettingsFormNotice | null };

export type SettingsFormEvent<T> =
  | { type: "loaded"; draft: T }
  | { type: "load_failed"; message: string }
  | { type: "retry" }
  | { type: "edited"; draft: T }
  | { type: "save_started"; sending: T }
  | { type: "saved"; message: string; savedDraft?: T; draft?: T }
  | { type: "save_failed"; message: string };

export function initialSettingsForm<T>(): SettingsFormState<T> {
  return { status: "loading" };
}

export function reduceSettingsForm<T>(
  state: SettingsFormState<T>,
  event: SettingsFormEvent<T>,
): SettingsFormState<T> {
  switch (event.type) {
    case "retry":
      return { status: "loading" };
    case "loaded":
      return { status: "ready", saved: event.draft, draft: event.draft, notice: null };
    case "load_failed":
      return { status: "load_failed", message: event.message };
    case "edited":
      if (state.status === "ready") return { ...state, draft: event.draft, notice: null };
      if (state.status === "saving") return { ...state, draft: event.draft, notice: null };
      return state;
    case "save_started":
      if (state.status !== "ready") return state;
      return {
        status: "saving",
        saved: state.saved,
        draft: state.draft,
        sending: state.draft,
        notice: null,
      };
    case "saved":
      if (state.status !== "saving") return state;
      return {
        status: "ready",
        saved: event.savedDraft ?? state.sending,
        draft: event.draft ?? state.draft,
        notice: { kind: "saved", message: event.message },
      };
    case "save_failed":
      if (state.status !== "saving") return state;
      return {
        status: "ready",
        saved: state.saved,
        draft: state.draft,
        notice: { kind: "error", message: event.message },
      };
  }
}

export function formDraft<T>(state: SettingsFormState<T>): T | null {
  return state.status === "ready" || state.status === "saving" ? state.draft : null;
}

export function formSaved<T>(state: SettingsFormState<T>): T | null {
  return state.status === "ready" || state.status === "saving" ? state.saved : null;
}

export function isSaving<T>(state: SettingsFormState<T>): boolean {
  return state.status === "saving";
}
