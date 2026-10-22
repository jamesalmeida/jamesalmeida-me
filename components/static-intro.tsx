import type { AvatarConfig } from "@jamesalmeida/agent-avatars";
import Link from "next/link";
import { HEADLINES, PROMPT_EXAMPLES, SITE } from "@/data/site";
import { serif } from "./booking-button";
import { PrivacyNotice } from "./privacy-notice";
import { SiteHeader } from "./site-header";

// Server-rendered before the chat hydrates. Same layout as the chat's landing, so
// there is no layout shift, and crawlers get the real h1, copy and links.
export function StaticIntro({ avatar }: { avatar?: AvatarConfig }) {
  return (
    <div className="app-shell flex flex-col overflow-hidden">
      <SiteHeader avatar={avatar} />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 pb-16 pt-4 sm:gap-7 sm:px-12 sm:pb-20">
          <h1
            className={`max-w-[1000px] text-center text-[44px] font-normal leading-[1.05] tracking-[-0.02em] sm:text-[72px] lg:text-[88px] lg:leading-[1.02] ${serif}`}
          >
            {HEADLINES[0]}
          </h1>
          <p className="max-w-[720px] text-center text-[17px] leading-[1.5] text-[var(--muted)] sm:text-[22px]">
            {SITE.subhead}
          </p>
          <div
            aria-hidden
            className="mt-3 flex min-h-[61px] w-full max-w-[780px] items-center rounded-[1.75rem] border border-[var(--border-strong)] bg-[var(--surface)] pl-5 text-base text-[var(--muted)] shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:mt-5 sm:min-h-[77px] sm:rounded-[2.25rem] sm:pl-8 sm:text-xl sm:shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
          >
            Try &ldquo;{PROMPT_EXAMPLES[0]}&rdquo;
          </div>
          <nav aria-label="Site" className="sr-only">
            <Link href="/consulting">How I can help</Link>
            <Link href="/about">Why I do this</Link>
            <Link href="/privacy">Privacy</Link>
            <a href={SITE.bookingUrl}>{SITE.bookingLabel}</a>
            <a href={`mailto:${SITE.email}`}>Email me</a>
          </nav>
        </div>
        <PrivacyNotice className="px-4 pb-5 sm:px-12 sm:pb-6" />
      </main>
    </div>
  );
}
