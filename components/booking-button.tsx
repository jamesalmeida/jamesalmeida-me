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
