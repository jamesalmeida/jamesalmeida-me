import Link from "next/link";

export function SitePageShell({
  secondaryHref,
  secondaryLabel,
  children,
}: {
  secondaryHref: string;
  secondaryLabel: string;
  children: React.ReactNode;
}) {
  const linkClass =
    "text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]";

  return (
    <div className="site-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <nav className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className={linkClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            ← Chat
          </Link>
          <Link
            href={secondaryHref}
            className={linkClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            {secondaryLabel}
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
