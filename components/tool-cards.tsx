"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { play } from "cuelume";
import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useReducer, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/data/site";
import {
  BRIEF_FIELDS,
  MAX_BRIEF_FIELD_CHARS,
  MAX_NOTE_CHARS,
  briefBookingHref,
  briefEntries,
  briefMailtoHref,
  toBrief,
  type Brief,
  type BriefLead,
} from "@/lib/brief";
import {
  canDismiss,
  canEdit,
  initialBriefCard,
  isSent,
  reduceBriefCard,
  toPersisted,
  type BriefCardState,
  type SendState,
} from "@/lib/brief-card";
import { readBriefCard, writeBriefCard } from "@/lib/brief-store";
import { useConversationId } from "./conversation-id";
import { trackEvent } from "@/lib/visit";
import { BookingButton, BookingCard, EmailButton, outlineButtonClass, primaryButtonClass, serif } from "./booking-button";

function BriefCard({
  initial,
  lead = "book",
  toolCallId,
}: {
  initial: Brief;
  lead?: BriefLead;
  toolCallId: string;
}) {
  const conversationId = useConversationId();
  // The card's own state, restored from this browser so a reload can't send the
  // same brief twice or bring back Edit on a sent card.
  const [state, dispatch] = useReducer(
    (current: BriefCardState, event: Parameters<typeof reduceBriefCard>[1]) =>
      reduceBriefCard(current, event),
    { initial, toolCallId },
    ({ initial: brief, toolCallId: id }) => {
      let base = initialBriefCard(brief);
      const stored = readBriefCard(id);
      if (stored) {
        base = reduceBriefCard(base, {
          type: "restored",
          brief: stored.brief,
          view: stored.view,
          sentBrief: stored.sentBrief,
        });
      }
      return base;
    },
  );
  const titleId = useId();
  const fieldId = useId();
  const entries = briefEntries(state.brief);
  // Only fields with something in them, plus the ones new briefs use, so old ones stay editable.
  const editableFields = BRIEF_FIELDS.filter(({ key }) => key !== "tried" || state.brief.tried);

  const bookingHref = briefBookingHref(SITE.bookingUrl, state.brief);
  const sendLeads = lead === "note";
  const sent = isSent(state);

  useEffect(() => {
    writeBriefCard(toolCallId, toPersisted(state));
  }, [state, toolCallId]);

  // Hidden rather than unmounted, so "Not yet" keeps what the visitor typed in the form.
  return (
    <>
    {state.view === "collapsed" ? (
      <div
        data-conversation-id={conversationId}
        data-offer-id={toolCallId}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-3"
      >
        <p className="text-[15px] leading-6 text-[var(--muted)]">No problem. Your brief is here when you want it.</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "restore" })}
          className="py-1.5 text-[15px] text-[var(--accent)] underline underline-offset-4"
          data-cuelume-press="tick"
        >
          Show it
        </button>
      </div>
    ) : null}
    <section
      hidden={state.view === "collapsed"}
      aria-labelledby={titleId}
      data-conversation-id={conversationId}
      data-offer-id={toolCallId}
      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={titleId} className={`text-2xl tracking-[-0.02em] ${serif} sm:text-[28px]`}>
          Does this look right?
        </h3>
        {canEdit(state) ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "toggle_edit" })}
            className="py-2.5 text-[15px] text-[var(--accent)] underline underline-offset-4"
            aria-expanded={state.editing}
            data-cuelume-press="tick"
          >
            {state.editing ? "Done" : "Edit"}
          </button>
        ) : null}
      </div>

      {state.editing ? (
        <div className="mt-4 flex flex-col gap-4">
          {editableFields.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`${fieldId}-${key}`} className="text-sm text-[var(--muted)]">
                {label}
              </label>
              <textarea
                id={`${fieldId}-${key}`}
                rows={2}
                maxLength={MAX_BRIEF_FIELD_CHARS}
                value={state.brief[key] ?? ""}
                onChange={(event) => dispatch({ type: "edit_field", key, value: event.target.value })}
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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {sendLeads && !sent ? null : <BookingButton href={bookingHref} variant={sent ? "outline" : "primary"} />}
        {sent ? null : (
          <button
            type="button"
            onClick={() => dispatch({ type: "toggle_form" })}
            aria-expanded={state.form === "open"}
            className={sendLeads ? primaryButtonClass : outlineButtonClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            <Send size={18} aria-hidden />
            Send to James
          </button>
        )}
        {sendLeads && !sent ? <BookingButton href={bookingHref} variant="outline" /> : null}
        {sent ? null : (
          <button
            type="button"
            onClick={() => {
              if (!canDismiss(state)) return;
              trackEvent("offer_declined", conversationId, undefined, toolCallId);
              dispatch({ type: "dismiss" });
            }}
            disabled={!canDismiss(state)}
            className="h-12 px-2 text-[15px] text-[var(--muted)] underline underline-offset-4 transition hover:text-[var(--foreground)] disabled:opacity-50"
            data-cuelume-press="tick"
          >
            Not yet
          </button>
        )}
      </div>
      {sent ? (
        <p role="status" className="mt-5 rounded-[1rem] bg-[var(--surface-muted)] px-4 py-3 text-[15px] leading-6">
          Thanks. James has your email and this brief.
        </p>
      ) : state.form !== "unopened" ? (
        <SendForm
          brief={state.brief}
          conversationId={conversationId}
          toolCallId={toolCallId}
          open={state.form === "open"}
          send={state.send}
          onStart={() => dispatch({ type: "submit_started" })}
          onInvalid={(message) => dispatch({ type: "submit_invalid", message })}
          onUnavailable={() => dispatch({ type: "submit_unavailable" })}
          onSent={(brief) => dispatch({ type: "submit_sent", brief })}
        />
      ) : null}
      <p className="mt-4 text-[13px] leading-5 text-[var(--muted)]">
        James only gets this as a message if you send it or book.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--foreground)]">
          Your privacy
        </Link>
      </p>
    </section>
    </>
  );
}

// "Send to James": saved as a lead (POST /api/leads) with the brief as it reads now and
// the visitor's note. James gets exactly that. When saving isn't available, the email
// button sends the same thing from the visitor's own mail app.
function SendForm({
  brief,
  conversationId,
  toolCallId,
  open,
  send,
  onStart,
  onInvalid,
  onUnavailable,
  onSent,
}: {
  brief: Brief;
  conversationId?: string;
  toolCallId: string;
  open: boolean;
  send: SendState;
  onStart: () => void;
  onInvalid: (message: string) => void;
  onUnavailable: () => void;
  onSent: (brief: Brief) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const isSubmitting = send.status === "submitting";

  // Opening the form moves focus into it and brings Send out from behind the composer.
  useEffect(() => {
    if (!open) return;
    emailRef.current?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    onStart();
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, note, brief, conversationId, toolCallId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        play("error");
        if (response.status === 400 && payload.error) onInvalid(payload.error);
        else onUnavailable();
        return;
      }
      play("success");
      onSent(brief);
    } catch {
      play("error");
      onUnavailable();
    }
  };

  const inputClass =
    "h-12 min-w-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-[15px] outline-none transition focus:border-[var(--border-strong)]";
  const error =
    send.status === "invalid"
      ? send.message
      : send.status === "unavailable"
        ? "That didn't go through. You can email it to James instead."
        : null;

  return (
    <form ref={formRef} hidden={!open} onSubmit={handleSubmit} className="mt-5 scroll-mb-40 border-t border-[var(--border)] pt-5">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="sr-only" htmlFor={`${fieldId}-email`}>
          Email
        </label>
        <input
          ref={emailRef}
          id={`${fieldId}-email`}
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={send.status === "invalid"}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`${inputClass} sm:flex-1`}
        />
        <label className="sr-only" htmlFor={`${fieldId}-name`}>
          Name (optional)
        </label>
        <input
          id={`${fieldId}-name`}
          type="text"
          autoComplete="name"
          maxLength={100}
          placeholder="Name (optional)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={`${inputClass} sm:w-44`}
        />
      </div>
      <label className="mt-3 block text-sm text-[var(--muted)]" htmlFor={`${fieldId}-note`}>
        Anything to add? (optional)
      </label>
      <textarea
        id={`${fieldId}-note`}
        rows={2}
        maxLength={MAX_NOTE_CHARS}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-1.5 w-full resize-none rounded-[0.9rem] border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] leading-6 outline-none transition focus:border-[var(--border-strong)]"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${outlineButtonClass} disabled:opacity-60`}
          data-cuelume-press="tick"
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>
        <p className="text-[13px] leading-5 text-[var(--muted)]">Your message to James is what&apos;s above, plus your note.</p>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
          {error}
        </p>
      ) : null}
      {send.status === "unavailable" ? (
        <div className="mt-3">
          <EmailButton href={briefMailtoHref(SITE.email, brief, note)} />
        </div>
      ) : null}
    </form>
  );
}

function BookingToolCard({ toolCallId }: { toolCallId: string }) {
  const conversationId = useConversationId();
  return (
    <div data-conversation-id={conversationId} data-offer-id={toolCallId}>
      <BookingCard />
    </div>
  );
}

export const ShowBookingCtaToolUI = makeAssistantToolUI<
  Record<string, never>,
  { bookingUrl: string; bookingLabel: string; email: string }
>({
  toolName: "showBookingCta",
  render: ({ toolCallId }) => <BookingToolCard toolCallId={toolCallId} />,
});

export const ShowBriefToolUI = makeAssistantToolUI<Brief, { brief: Brief; lead?: BriefLead }>({
  toolName: "showBrief",
  // Waits for the result, so the card's editable copy starts from the full brief
  // rather than half-streamed args.
  render: ({ result, toolCallId }) => {
    if (!result) return null;
    const brief = toBrief(result.brief);
    if (briefEntries(brief).length === 0) return null;
    return (
      <BriefCard
        initial={brief}
        lead={result.lead === "note" ? "note" : "book"}
        toolCallId={toolCallId}
      />
    );
  },
});
