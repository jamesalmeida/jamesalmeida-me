import { CalendarCheck, Mail } from "lucide-react";
import { SITE } from "@/data/site";

export const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

export const primaryButtonClass =
  "inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--accent-foreground)] transition hover:opacity-90";

export const outlineButtonClass =
  "inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-[15px] font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)]";

export function BookingButton({
  href = SITE.bookingUrl,
  label = SITE.bookingLabel,
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${primaryButtonClass} ${className}`}
      data-cuelume-hover="whisper"
      data-cuelume-press="tick"
    >
      <CalendarCheck size={18} aria-hidden />
      {label}
    </a>
  );
}

export function EmailButton({
  href = `mailto:${SITE.email}`,
  label = "Email James",
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`${outlineButtonClass} ${className}`}
      data-cuelume-hover="whisper"
      data-cuelume-press="tick"
    >
      <Mail size={18} aria-hidden />
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

// The showBookingCta tool card.
export function BookingCard() {
  return (
    <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-7">
      <h3 className={`text-2xl tracking-[-0.02em] text-[var(--foreground)] ${serif}`}>
        {SITE.bookingLabel}
      </h3>
      <p className="mt-2 text-[15px] leading-6 text-[var(--muted)]">
        Tell James what&apos;s on your plate, and he&apos;ll help you find where AI fits.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <BookingButton />
        <EmailButton />
      </div>
    </section>
  );
}
