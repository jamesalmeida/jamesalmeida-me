"use client";

import { play } from "cuelume";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  formDraft,
  initialSettingsForm,
  reduceSettingsForm,
  type SettingsFormState,
} from "@/lib/settings-form";

// The shared /admin settings flow. A failed load shows no editor, so Save can't send
// the defaults over the real settings. Edits made during a save are kept.

export type SettingsLoad<T> = { draft: T; canSave: boolean } | { error: string };
export type SettingsSave<T> = { ok: true; savedDraft?: T; draft?: T } | { error: string } | { locked: true };

export function useSettingsForm<T>({
  load,
  save,
  onLocked,
  savedNotice,
}: {
  load: () => Promise<SettingsLoad<T>>;
  save: (draft: T) => Promise<SettingsSave<T>>;
  onLocked: () => void;
  savedNotice: string;
}) {
  const [state, dispatch] = useReducer(reduceSettingsForm<T>, initialSettingsForm<T>());
  const [canSave, setCanSave] = useState(true);
  // The latest draft, so two quick edits in one render can't lose the first.
  const draftRef = useRef<T | null>(null);
  draftRef.current = formDraft(state);
  const savingRef = useRef(false);

  const runLoad = useCallback(async () => {
    dispatch({ type: "retry" });
    const result = await load();
    if ("error" in result) {
      dispatch({ type: "load_failed", message: result.error });
      return;
    }
    setCanSave(result.canSave);
    dispatch({ type: "loaded", draft: result.draft });
  }, [load]);

  useEffect(() => {
    void runLoad();
  }, [runLoad]);

  const edit = useCallback((update: (draft: T) => T) => {
    const draft = draftRef.current;
    if (draft === null) return;
    const next = update(draft);
    draftRef.current = next;
    dispatch({ type: "edited", draft: next });
  }, []);

  const submit = useCallback(async () => {
    if (state.status !== "ready" || savingRef.current) return;
    const draft = draftRef.current;
    if (draft === null) return;
    savingRef.current = true;
    dispatch({ type: "save_started", sending: draft });
    try {
      const result = await save(draft);
      if ("locked" in result) {
        play("error");
        onLocked();
        dispatch({ type: "save_failed", message: "Signed out. Unlock to save." });
        return;
      }
      if ("error" in result) {
        play("error");
        dispatch({ type: "save_failed", message: result.error });
        return;
      }
      play("success");
      dispatch({
        type: "saved",
        message: savedNotice,
        ...(result.savedDraft ? { savedDraft: result.savedDraft } : {}),
        ...(result.draft ? { draft: result.draft } : {}),
      });
    } finally {
      savingRef.current = false;
    }
  }, [state.status, save, onLocked, savedNotice]);

  return {
    state: state as SettingsFormState<T>,
    canSave,
    edit,
    submit,
    retry: runLoad,
  };
}

/** The notice or error to show under a form. */
export function formNotice<T>(state: SettingsFormState<T>): { kind: "saved" | "error"; message: string } | null {
  return state.status === "ready" || state.status === "saving" ? state.notice : null;
}
