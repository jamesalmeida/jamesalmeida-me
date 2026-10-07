"use client";

import { play } from "cuelume";
import { useEffect, useState } from "react";
import {
  MODEL_OPTIONS,
  getDefaultModelId,
  type ModelId,
} from "@/lib/models";

export default function AdminPage() {
  const [model, setModel] = useState<ModelId>(getDefaultModelId());
  const [isOverride, setIsOverride] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/model")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as {
          model?: string;
          isOverride?: boolean;
        };
        if (cancelled) return;
        const known = MODEL_OPTIONS.find((option) => option.id === payload.model);
        if (known) setModel(known.id);
        setIsOverride(payload.isOverride === true);
      })
      .catch(() => {
        // Cookie is httpOnly; without the API the page can only show the default.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          password,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        play("error");
        setStatus(payload.error ?? "Unable to update model.");
        return;
      }

      play("success");
      setIsOverride(true);
      setStatus(`Model saved for this browser: ${model}`);
      setPassword("");
    } catch {
      play("error");
      setStatus("Request failed before the model could be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="grain-panel rounded-[2rem] border border-[var(--border)] p-6 sm:p-8">
          <div className="space-y-3 border-b border-[var(--border)] pb-6">
            <p className="eyebrow text-xs text-[var(--muted)]">Admin</p>
            <h1 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-4xl tracking-[-0.04em]">
              Model Switcher
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Choose which model the assistant uses in this browser only. Saving
              stores a signed httpOnly cookie for 30 days. Every other visitor
              keeps the default model (set with DEFAULT_MODEL). This page cannot
              read the cookie, so the current model comes from GET /api/admin/model.
            </p>
            <p className="text-sm text-[var(--muted)]">
              {isOverride
                ? "Signed cookie: active override for this browser."
                : "Signed cookie: none. Using the default model."}
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Model</span>
              <select
                className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--border-strong)]"
                onChange={(event) => setModel(event.target.value as ModelId)}
                value={model}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.provider})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3">
              {MODEL_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`rounded-[1.25rem] border p-4 text-sm ${
                    option.id === model
                      ? "border-black/20 bg-black text-white"
                      : "border-[var(--border)] bg-white/70 text-[var(--muted)]"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="mt-1 leading-6">{option.description}</div>
                </div>
              ))}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Admin password</span>
              <input
                className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-strong)]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter ADMIN_PASSWORD"
                type="password"
                value={password}
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-85 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                {isSaving ? "Saving..." : "Save Model"}
              </button>
              {status ? (
                <p className="text-sm text-[var(--muted)]">{status}</p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
