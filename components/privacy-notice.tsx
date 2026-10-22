import { Lock } from "lucide-react";
import Link from "next/link";

// The one-line notice under the composer (and in StaticIntro). The details, including
// which AI providers process chats, live on /privacy.
export function PrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center text-[11px] leading-4 text-[var(--muted)] sm:text-xs ${className}`}
    >
      <Lock size={13} aria-hidden className="shrink-0" />
      <Link
        href="/privacy"
        className="underline decoration-dotted underline-offset-[3px] transition hover:text-[var(--foreground)]"
        data-cuelume-hover="whisper"
        data-cuelume-press="tick"
      >
        Your privacy
      </Link>
      <span aria-hidden>·</span>
      <span>Please don&apos;t share sensitive information.</span>
    </p>
  );
}
