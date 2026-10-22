"use client";

import { AgentAvatar, type AvatarMood } from "@jamesalmeida/agent-avatars";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type Ref } from "react";
import { SITE } from "@/data/site";
import { serif } from "./booking-button";

// True from the `sm` breakpoint (640 px). False on the server and phones.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

const nameTransition = { type: "spring", stiffness: 360, damping: 34 } as const;

// The top bar on the chat: name, then (in a conversation) Skaffen in the centre,
// then "Book a discovery call" (from `sm`; on phones it lives in the menu) and Menu.
// When a conversation starts, Skaffen pops in; on phones the name also shrinks and
// stacks to the left to make room. Skaffen matches the Menu button (44 px on phones,
// 48 px from `sm`). Server-renderable: StaticIntro passes no handlers and no mood.
export function SiteHeader({
  menuButtonRef,
  onNewChat,
  onOpenMenu,
  skaffenMood = null,
}: {
  menuButtonRef?: Ref<HTMLButtonElement>;
  /** The name starts a new chat; the current one stays in Recent chats. */
  onNewChat?: () => void;
  onOpenMenu?: () => void;
  /** Skaffen's mood in a conversation; null on the landing. */
  skaffenMood?: AvatarMood | null;
}) {
  const isConversation = skaffenMood !== null;
  const isDesktop = useIsDesktop();
  const isCompactName = isConversation && !isDesktop;
  const [first, ...rest] = SITE.name.split(" ");

  return (
    <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
      <div className="flex h-11 items-center justify-self-start sm:h-12">
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
          {/* Scaled, not resized, so the shrink animates smoothly; the words move with layout animations. */}
          <motion.span
            className="block origin-left"
            initial={false}
            animate={{ scale: isCompactName ? 0.68 : 1 }}
            transition={nameTransition}
          >
            <span
              className={`flex leading-[1.05] ${isCompactName ? "flex-col" : "flex-row gap-x-[0.28em]"}`}
            >
              <motion.span layout="position" transition={nameTransition}>
                {first}
              </motion.span>
              <motion.span layout="position" transition={nameTransition}>
                {rest.join(" ")}
              </motion.span>
            </span>
          </motion.span>
        </Link>
      </div>
      <div className="flex h-11 w-11 items-center justify-center sm:h-12 sm:w-12">
        <AnimatePresence>
          {isConversation ? (
            <motion.div
              key="skaffen"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.1 }}
            >
              <AgentAvatar
                {...SITE.assistant.avatar}
                mood={skaffenMood}
                size={isDesktop ? 48 : 44}
                label={`${SITE.assistant.name}, ${SITE.assistant.role}`}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-3 justify-self-end">
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
