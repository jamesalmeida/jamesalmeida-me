import { CalendarCheck } from "lucide-react";
import { SITE } from "@/data/site";

export function BookingButton({
  label = SITE.bookingLabel,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={SITE.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 ${className}`}
      data-cuelume-hover="whisper"
      data-cuelume-press="tick"
    >
      <CalendarCheck size={16} />
      {label}
    </a>
  );
}

export function EmailLink({
  prefix = "or email",
  className = "",
}: {
  prefix?: string;
  className?: string;
}) {
  return (
    <a
      href={`mailto:${SITE.email}`}
      className={`text-sm text-[var(--muted)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline ${className}`}
      data-cuelume-hover="whisper"
      data-cuelume-press="tick"
    >
      {prefix} {SITE.email}
    </a>
  );
}

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

// Used by the showBookingCta tool card and the "Work with me" empty state.
export function BookingCard() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <p className="eyebrow text-xs text-[var(--muted)]">Work with me</p>
      <h3 className={`mt-2 text-2xl tracking-[-0.03em] text-[var(--foreground)] ${serif}`}>
        {SITE.bookingLabel}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Tell me how the work happens today and we&apos;ll see if there&apos;s a fit.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BookingButton />
        <EmailLink />
      </div>
    </div>
  );
}
