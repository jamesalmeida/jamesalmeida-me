"use client";

import { CalendarCheck, Menu } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";
import { SITE } from "@/data/site";
import { serif } from "./booking-button";

// The top bar on the chat: name, "Book a discovery call" (from `sm`; on phones it
// lives in the menu) and Menu. Server-renderable: StaticIntro passes no handlers.
export function SiteHeader({
  menuButtonRef,
  onNewChat,
  onOpenMenu,
}: {
  menuButtonRef?: Ref<HTMLButtonElement>;
  /** The name starts a new chat; the current one stays in Recent chats. */
  onNewChat?: () => void;
  onOpenMenu?: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
      <Link
        href="/"
        onClick={(event) => {
          if (!onNewChat) return;
          event.preventDefault();
          onNewChat();
        }}
        title={onNewChat ? "Start a new chat" : undefined}
        className={`text-[22px] tracking-[-0.01em] text-[var(--foreground)] sm:text-[26px] ${serif}`}
        data-cuelume-press="tick"
      >
        {SITE.name}
      </Link>
      <div className="flex items-center gap-3">
        <a
          href={SITE.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-12 items-center gap-2.5 rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--accent-foreground)] transition hover:opacity-90 sm:inline-flex"
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          <CalendarCheck size={18} aria-hidden />
          {SITE.bookingLabel}
        </a>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          aria-haspopup="dialog"
          className="inline-flex h-11 items-center gap-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-[18px] text-[15px] font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] sm:h-12 sm:px-5"
          data-cuelume-press="tick"
        >
          <Menu size={18} aria-hidden className="hidden sm:block" />
          Menu
        </button>
      </div>
    </header>
  );
}
