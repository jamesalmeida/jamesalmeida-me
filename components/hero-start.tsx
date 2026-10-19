"use client";

import { useComposerRuntime } from "@assistant-ui/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const menuItemClass =
  "flex w-full items-center rounded-[0.9rem] px-3 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--panel)]";

// Empty slot for a future background image. No stock photo.
function HeroBackground() {
  return <div data-slot="hero-background" aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}

function HeroMenu() {
  const composer = useComposerRuntime();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const askHowIWork = () => {
    if (detailsRef.current) detailsRef.current.open = false;
    composer.setText("How does working with you start?");
    composer.send();
  };

  return (
    <details
      ref={detailsRef}
      className="relative mt-6 open:mb-48"
      onKeyDown={(event) => {
        if (event.key === "Escape" && detailsRef.current?.open) {
          detailsRef.current.open = false;
          const summary = event.currentTarget.querySelector("summary");
          if (summary instanceof HTMLElement) summary.focus();
        }
      }}
    >
      <summary className="cursor-pointer list-none text-center text-sm text-[var(--muted)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <nav
        aria-label="Site"
        className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-2 text-left shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
      >
        <button type="button" className={menuItemClass} onClick={askHowIWork}>
          How I work
        </button>
        <Link href="/work" className={menuItemClass} data-cuelume-hover="whisper" data-cuelume-press="tick">
          Work
        </Link>
        <Link
          href="/consulting#faq"
          className={menuItemClass}
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          FAQ
        </Link>
        <Link href="/privacy" className={menuItemClass} data-cuelume-hover="whisper" data-cuelume-press="tick">
          Privacy
        </Link>
      </nav>
    </details>
  );
}

export function HeroStart({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto">
      <HeroBackground />
      <div className="relative flex min-h-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center">
          <h1
            className={`text-center text-[1.7rem] leading-tight tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl ${serif}`}
          >
            {SITE.heroHeadline}
          </h1>
          <p className="mt-3 max-w-lg text-center text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
            {SITE.heroLine}
          </p>
          <div className="mt-8 w-full">{children}</div>
          <HeroMenu />
        </div>
      </div>
    </div>
  );
}
