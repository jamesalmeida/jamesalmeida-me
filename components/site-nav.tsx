import Link from "next/link";
import { SITE } from "@/data/site";

export type SitePage = "consulting" | "about" | "privacy";

const linkClass =
  "text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]";
const currentClass = "text-sm text-[var(--foreground)]";

const LINKS: { href: string; label: string; page?: SitePage }[] = [
  { href: "/", label: "Chat" },
  { href: "/consulting", label: "How I can help", page: "consulting" },
  { href: "/about", label: "Why I do this", page: "about" },
  { href: "/privacy", label: "Privacy", page: "privacy" },
];

export function SiteNav({ current }: { current?: SitePage }) {
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/"
        className={linkClass}
        data-cuelume-hover="whisper"
        data-cuelume-press="tick"
      >
        {SITE.name}
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={link.page && link.page === current ? currentClass : linkClass}
            aria-current={link.page && link.page === current ? "page" : undefined}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            {link.label}
          </Link>
        ))}
        <a
          href={SITE.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          {SITE.bookingLabel}
        </a>
      </div>
    </nav>
  );
}
