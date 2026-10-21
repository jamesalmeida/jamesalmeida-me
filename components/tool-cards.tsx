"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useId, useState } from "react";
import { SITE } from "@/data/site";
import {
  BRIEF_FIELDS,
  MAX_BRIEF_FIELD_CHARS,
  briefBookingHref,
  briefEntries,
  briefMailtoHref,
  type Brief,
} from "@/lib/brief";
import { BookingButton, BookingCard, EmailButton, serif } from "./booking-button";

// Only known string fields are kept, each capped like the server does.
function toBrief(value: unknown): Brief {
  if (!value || typeof value !== "object") return {};
  const candidate = value as Record<string, unknown>;
  const brief: Brief = {};
  for (const { key } of BRIEF_FIELDS) {
    const field = candidate[key];
    if (typeof field === "string" && field.trim()) {
      brief[key] = field.trim().slice(0, MAX_BRIEF_FIELD_CHARS);
    }
  }
  return brief;
}

function BriefCard({ initial }: { initial: Brief }) {
  const [brief, setBrief] = useState(initial);
  const [isEditing, setIsEditing] = useState(false);
  const titleId = useId();
  const fieldId = useId();
  const entries = briefEntries(brief);

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={titleId} className={`text-2xl tracking-[-0.02em] ${serif} sm:text-[28px]`}>
          Your brief
        </h3>
        <button
          type="button"
          onClick={() => setIsEditing((value) => !value)}
          className="py-2.5 text-[15px] text-[var(--accent)] underline underline-offset-4"
          aria-expanded={isEditing}
          data-cuelume-press="tick"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-4">
          {BRIEF_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`${fieldId}-${key}`} className="text-sm text-[var(--muted)]">
                {label}
              </label>
              <textarea
                id={`${fieldId}-${key}`}
                rows={2}
                maxLength={MAX_BRIEF_FIELD_CHARS}
                value={brief[key] ?? ""}
                onChange={(event) => setBrief((current) => ({ ...current, [key]: event.target.value }))}
                className="resize-none rounded-[0.9rem] border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] leading-6 outline-none transition focus:border-[var(--border-strong)]"
              />
            </div>
          ))}
        </div>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2.5 text-[15px] leading-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:text-base">
          {entries.map(({ key, label, value }) => (
            <div key={key} className="contents">
              <dt className="text-sm text-[var(--muted)] sm:text-base">{label}</dt>
              <dd className="mb-1.5 sm:mb-0">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <BookingButton href={briefBookingHref(SITE.bookingUrl, brief)} />
        <EmailButton href={briefMailtoHref(SITE.email, brief)} />
      </div>
      <p className="mt-4 text-[13px] leading-5 text-[var(--muted)]">
        Nothing is sent until you choose. The brief goes into your email or booking notes.
      </p>
    </section>
  );
}

export const ShowBookingCtaToolUI = makeAssistantToolUI<
  Record<string, never>,
  { bookingUrl: string; bookingLabel: string; email: string }
>({
  toolName: "showBookingCta",
  render: () => <BookingCard />,
});

export const ShowBriefToolUI = makeAssistantToolUI<Brief, { brief: Brief }>({
  toolName: "showBrief",
  // Waits for the result, so the card's editable copy starts from the full brief
  // rather than half-streamed args.
  render: ({ result }) => {
    if (!result) return null;
    const brief = toBrief(result.brief);
    if (briefEntries(brief).length === 0) return null;
    return <BriefCard initial={brief} />;
  },
});
