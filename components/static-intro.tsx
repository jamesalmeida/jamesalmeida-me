import { ArrowUp, CalendarCheck, Mail } from "lucide-react";
import Link from "next/link";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const linkClass =
  "block rounded-[0.9rem] px-3 py-2.5 text-sm text-[var(--foreground)] underline-offset-4 hover:underline";

// Server-rendered before the chat hydrates. Same app-shell/app-panel frame and
// the same hero (headline, one line, input) so the first paint does not jump.
export function StaticIntro() {
  return (
    <div className="app-shell flex items-stretch justify-center px-3 sm:px-4 min-[431px]:py-4">
      <div className="app-panel grain-panel flex w-full flex-col overflow-hidden rounded-[2rem] border border-[var(--border)]">
        <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="h-10 w-10 flex-shrink-0 lg:hidden" aria-hidden />
          <div className="min-w-0 flex-1 text-center lg:flex-initial lg:text-left">
            <p className="eyebrow text-[10px] text-[var(--muted)] sm:text-xs">James Almeida</p>
            <p className={`truncate text-lg tracking-[-0.03em] sm:text-2xl ${serif}`}>General Chat</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] text-sm font-medium text-[var(--accent-foreground)] sm:w-auto sm:px-4"
              aria-label="Hire me"
            >
              <Mail size={15} aria-hidden />
              <span className="hidden sm:inline">Hire me</span>
            </a>
            <a
              href={SITE.bookingUrl}
              className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-sm font-medium sm:w-auto sm:px-4"
              aria-label={SITE.bookingShortLabel}
            >
              <CalendarCheck size={15} aria-hidden />
              <span className="hidden sm:inline">{SITE.bookingShortLabel}</span>
            </a>
          </div>
        </header>
        <div className="hero-stage relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div data-slot="hero-background" aria-hidden="true" className="pointer-events-none absolute inset-0" />
          <div className="hero-stage-inner relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-4 py-6 sm:px-6">
            <div className="mx-auto flex w-full max-w-xl flex-col items-center">
              <h1 className={`hero-headline text-center text-[1.7rem] leading-tight tracking-[-0.04em] sm:text-5xl ${serif}`}>
                {SITE.heroHeadline}
              </h1>
              <p className="mt-3 max-w-lg text-center text-sm leading-6 text-[var(--muted)] sm:text-base">
                {SITE.heroLine}
              </p>
              <div className="hero-input-block relative mt-8 w-full" aria-hidden="true">
                <div className="flex min-h-[3rem] items-center rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] py-3 pl-4 pr-14 text-base text-[var(--muted)]">
                  Try &apos;We bought ChatGPT and nothing changed&apos;
                </div>
                <div className="absolute bottom-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <ArrowUp size={16} />
                </div>
              </div>
              <details className="relative mt-4">
                <summary className="cursor-pointer text-sm text-[var(--muted)]">Menu</summary>
                <nav
                  aria-label="Site"
                  className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                >
                  <Link href="/consulting" className={linkClass}>
                    How I work
                  </Link>
                  <Link href="/work" className={linkClass}>
                    Work
                  </Link>
                  <Link href="/consulting#faq" className={linkClass}>
                    FAQ
                  </Link>
                  <Link href="/privacy" className={linkClass}>
                    Privacy
                  </Link>
                </nav>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
