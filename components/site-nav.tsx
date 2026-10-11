import Link from "next/link";
import { SITE } from "@/data/site";

const linkClass =
  "text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]";

export function SiteNav({
  current,
}: {
  current?: "home" | "work" | "consulting" | "privacy";
}) {
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/"
        className={current === "home" ? "text-sm text-[var(--foreground)]" : linkClass}
        data-cuelume-hover="whisper"
        data-cuelume-press="tick"
      >
        {SITE.name}
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/#chat" className={linkClass} data-cuelume-hover="whisper" data-cuelume-press="tick">
          Chat
        </Link>
        <Link
          href="/work"
          className={current === "work" ? "text-sm text-[var(--foreground)]" : linkClass}
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          Work
        </Link>
        <Link
          href="/consulting"
          className={current === "consulting" ? "text-sm text-[var(--foreground)]" : linkClass}
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          Consulting
        </Link>
        <Link
          href="/privacy"
          className={current === "privacy" ? "text-sm text-[var(--foreground)]" : linkClass}
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          Privacy
        </Link>
        <a
          href={`mailto:${SITE.email}`}
          className={linkClass}
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          Hire me
        </a>
      </div>
    </nav>
  );
}
