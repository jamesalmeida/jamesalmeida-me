"use client";

import { useEffect, useState } from "react";
import {
  MODEL_COOKIE_NAME,
  MODEL_OPTIONS,
  getDefaultModelId,
  isModelId,
  type ModelId,
} from "@/lib/models";

export default function AdminPage() {
  const [model, setModel] = useState<ModelId>(getDefaultModelId());
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${MODEL_COOKIE_NAME}=`))
      ?.split("=")[1];

    const decodedValue = cookieValue ? decodeURIComponent(cookieValue) : null;

    if (decodedValue && isModelId(decodedValue)) {
      setModel(decodedValue);
    }
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
        setStatus(payload.error ?? "Unable to update model.");
        return;
      }

      setStatus(`Model saved: ${model}`);
      setPassword("");
    } catch {
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
              Select which model the portfolio assistant should use. The chosen
              model is stored in a cookie that the chat API reads on each request.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Model</span>
              <select
                className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-black/20"
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
                className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 outline-none transition placeholder:text-[var(--muted)] focus:border-black/20"
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
