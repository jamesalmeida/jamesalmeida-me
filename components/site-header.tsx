"use client";

import type { AvatarConfig } from "@jamesalmeida/agent-avatars";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";
import { SITE } from "@/data/site";
import { serif } from "./booking-button";
import { useMotion } from "./motion-settings";
import { SkaffenAvatar } from "./playful-avatar";

const [FIRST_NAME, ...REST] = SITE.name.split(" ");
const LAST_NAME = REST.join(" ");

// Two lines, not three: the menu icon.
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9h16M4 15h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The top bar on the chat: Skaffen's avatar and the name (stacked on phones), then
// "Book a discovery call" (from `sm`; on phones it lives in the menu) and the menu
// button. When a conversation starts, the avatar shrinks away (Skaffen moves into the
// conversation, above the latest reply) and the name slides left into its place. New
// chat brings it back. Tapping the avatar is an easter egg (PlayfulAvatar); the name starts a
// new chat. Server-renderable: StaticIntro passes no handlers.
export function SiteHeader({
  avatar = SITE.assistant.avatar,
  isConversation = false,
  menuButtonRef,
  onNewChat,
  onOpenMenu,
}: {
  /** Skaffen's look: the saved site setting, else SITE.assistant.avatar. */
  avatar?: AvatarConfig;
  /** True once the visitor has sent a message; the avatar then lives in the thread. */
  isConversation?: boolean;
  menuButtonRef?: Ref<HTMLButtonElement>;
  /** The name starts a new chat; the current one stays in Recent chats. */
  onNewChat?: () => void;
  onOpenMenu?: () => void;
}) {
  const motionSettings = useMotion();

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
      <div className="flex items-center">
        {/* 56 px, 52 px on phones (SkaffenAvatar). The wrapper's width and margin
            collapse as it leaves, so the name slides left with it. */}
        <AnimatePresence initial={false}>
          {isConversation ? null : (
            <motion.span
              key="header-avatar"
              className="block h-13 shrink-0 [--header-avatar:3.25rem] sm:h-14 sm:[--header-avatar:3.5rem]"
              initial={{ scale: 0, opacity: 0, width: 0, marginRight: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                width: "var(--header-avatar)",
                marginRight: 8,
              }}
              exit={{ scale: 0, opacity: 0, width: 0, marginRight: 0 }}
              transition={motionSettings.spring(0.7, 0.2)}
            >
              <SkaffenAvatar avatar={avatar} mood="idle" />
            </motion.span>
          )}
        </AnimatePresence>
        <Link
          href="/"
          onClick={(event) => {
            if (!onNewChat) return;
            event.preventDefault();
            onNewChat();
          }}
          title={onNewChat ? "Start a new chat" : undefined}
          className="flex items-center text-[var(--foreground)]"
          data-cuelume-press="tick"
        >
          <span
            className={`flex flex-col text-[18px] leading-[1.05] tracking-[-0.01em] sm:flex-row sm:gap-x-[0.28em] sm:text-[26px] ${serif}`}
          >
            <span>{FIRST_NAME}</span>
            <span>{LAST_NAME}</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={SITE.bookingUrl}
          data-track="booking_clicked"
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
          aria-label="Menu"
          title="Menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] transition hover:border-[var(--foreground)] sm:h-12 sm:w-12"
          data-cuelume-press="tick"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}
