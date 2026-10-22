"use client";

import { AgentAvatar, type AvatarConfig, type AvatarMood } from "@jamesalmeida/agent-avatars";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Menu } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";
import { SITE } from "@/data/site";
import { serif } from "./booking-button";

const [FIRST_NAME, ...REST] = SITE.name.split(" ");
const LAST_NAME = REST.join(" ");
// Replaces the last name in a conversation, so the header reads "James' AI Assistant".
const ASSISTANT_TITLE = "AI Assistant";

const swapTransition = { type: "spring", stiffness: 420, damping: 34 } as const;

// The top bar on the chat: Skaffen's avatar and the name (stacked on phones), then
// "Book a discovery call" (from `sm`; on phones it lives in the menu) and Menu. In a
// conversation the last name swaps to "AI Assistant" and "James" gains an apostrophe;
// New chat swaps it back. Server-renderable: StaticIntro passes no handlers and no mood.
export function SiteHeader({
  avatar = SITE.assistant.avatar,
  menuButtonRef,
  onNewChat,
  onOpenMenu,
  skaffenMood = null,
}: {
  /** Skaffen's look: the saved site setting, else SITE.assistant.avatar. */
  avatar?: AvatarConfig;
  menuButtonRef?: Ref<HTMLButtonElement>;
  /** The name starts a new chat; the current one stays in Recent chats. */
  onNewChat?: () => void;
  onOpenMenu?: () => void;
  /** Skaffen's mood in a conversation; null on the landing. */
  skaffenMood?: AvatarMood | null;
}) {
  const isConversation = skaffenMood !== null;
  const secondLine = isConversation ? ASSISTANT_TITLE : LAST_NAME;

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
        className="flex items-center gap-2 text-[var(--foreground)]"
        data-cuelume-press="tick"
      >
        {/* Drawn at 56 px and scaled to 52 px on phones (CSS, so the server render and
            the first client render agree). */}
        <span className="block h-13 w-13 shrink-0 sm:h-14 sm:w-14">
          <span className="block origin-top-left scale-[0.9286] sm:scale-100">
            <AgentAvatar {...avatar} mood={skaffenMood ?? "idle"} size={56} />
          </span>
        </span>
        <span
          className={`flex flex-col text-[18px] leading-[1.05] tracking-[-0.01em] sm:flex-row sm:gap-x-[0.28em] sm:text-[26px] ${serif}`}
        >
          <span className="flex">
            {FIRST_NAME}
            <AnimatePresence initial={false}>
              {isConversation ? (
                <motion.span
                  key="apostrophe"
                  className="inline-block overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={swapTransition}
                >
                  &rsquo;
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
          {/* The last name slides up and out as "AI Assistant" slides up in (and back). */}
          <span className="relative block overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={secondLine}
                className="block whitespace-nowrap"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={swapTransition}
              >
                {secondLine}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
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
