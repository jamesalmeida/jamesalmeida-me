"use client";

import { play } from "cuelume";
import { Laptop, Moon, Sun, Trash2, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { SITE } from "@/data/site";
import type { HistoryThread } from "@/lib/threads";
import { BookingButton } from "./booking-button";
import { Modal } from "./modal";
import { useTheme, type ThemePreference } from "./theme-provider";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: "system", label: "System theme", icon: <Laptop size={20} aria-hidden /> },
  { value: "light", label: "Light theme", icon: <Sun size={20} aria-hidden /> },
  { value: "dark", label: "Dark theme", icon: <Moon size={20} aria-hidden /> },
];

const roundButtonClass =
  "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--foreground)] transition hover:opacity-80";

const menuLinkClass =
  "text-[32px] leading-[1.3] text-[var(--foreground)] transition hover:opacity-70 sm:text-[38px] sm:leading-[1.25]";

type SiteMenuProps = {
  activeThreadId: string;
  hasChats: boolean;
  historyThreads: HistoryThread[];
  onClearAllChats: () => void;
  onClose: () => void;
  onDeleteThread: (threadId: string) => void;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function SiteMenu({
  activeThreadId,
  hasChats,
  historyThreads,
  onClearAllChats,
  onClose,
  onDeleteThread,
  onNewChat,
  onSelectThread,
  returnFocusRef,
}: SiteMenuProps) {
  const { preference, setPreference, soundsEnabled, toggleSounds } = useTheme();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      layout="sheet"
      initialFocusRef={closeRef}
      returnFocusRef={returnFocusRef}
    >
      <nav
        aria-labelledby={titleId}
        className="flex min-h-full w-full flex-col gap-10 overflow-y-auto bg-[var(--surface)] px-4 pb-6 pt-4 sm:min-h-0 sm:w-[480px] sm:rounded-[2rem] sm:px-10 sm:pb-8 sm:pt-8 sm:shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      >
        <h2 id={titleId} className="sr-only">
          Menu
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              role="group"
              aria-label="Theme"
              className="flex gap-0.5 rounded-full bg-[var(--surface-muted)] p-1"
            >
              {THEME_OPTIONS.map((option) => {
                const isSelected = preference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreference(option.value)}
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    title={option.label}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                      isSelected
                        ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    data-cuelume-press="tick"
                  >
                    {option.icon}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={toggleSounds}
              aria-label="Sounds"
              aria-pressed={soundsEnabled}
              title={soundsEnabled ? "Sounds on" : "Sounds off"}
              className={roundButtonClass}
            >
              {soundsEnabled ? <Volume2 size={20} aria-hidden /> : <VolumeX size={20} aria-hidden />}
            </button>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={roundButtonClass}
            data-cuelume-press="droplet"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button type="button" onClick={onNewChat} className={menuLinkClass} data-cuelume-press="tick">
            New chat
          </button>
          <Link href="/consulting" className={menuLinkClass} data-cuelume-press="tick">
            How I can help
          </Link>
          <Link href="/about" className={menuLinkClass} data-cuelume-press="tick">
            Why I do this
          </Link>
          <a href={`mailto:${SITE.email}`} className={menuLinkClass} data-cuelume-press="tick">
            Email me
          </a>
          <Link href="/privacy" className={menuLinkClass} data-cuelume-press="tick">
            Privacy
          </Link>
        </div>

        <BookingButton className="self-center" />

        {hasChats ? (
          <div className="mt-auto flex flex-col items-center gap-1 rounded-[22px] bg-[var(--background)] px-4 py-5 sm:px-6">
            {historyThreads.length > 0 ? (
              <>
                <h3 className="eyebrow text-xs text-[var(--muted)]">Recent chats</h3>
                <ul className="flex w-full flex-col items-stretch">
                  {historyThreads.map((thread) => (
                    <li key={thread.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectThread(thread.id)}
                        aria-current={thread.id === activeThreadId ? "true" : undefined}
                        className={`min-w-0 flex-1 truncate py-2.5 pl-11 text-center text-base transition hover:opacity-70 ${
                          thread.id === activeThreadId ? "font-semibold" : ""
                        }`}
                        data-cuelume-press="tick"
                      >
                        {thread.title === "New chat" ? thread.description : thread.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          play("whisper");
                          onDeleteThread(thread.id);
                        }}
                        aria-label={`Delete chat: ${thread.title === "New chat" ? thread.description : thread.title}`}
                        title="Delete chat"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:text-[var(--danger)]"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {isConfirmingClear ? (
              <div className="mt-1 flex flex-col items-center gap-3 text-center text-sm">
                <p>Delete every chat saved in this browser? This can&apos;t be undone.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="rounded-full border border-[var(--border-strong)] px-4 py-2 transition hover:border-[var(--foreground)]"
                    data-cuelume-press="tick"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmingClear(false);
                      onClearAllChats();
                    }}
                    className="rounded-full bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                    data-cuelume-press="whisper"
                  >
                    Delete all
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="py-2.5 text-sm text-[var(--danger)] underline underline-offset-4"
                data-cuelume-press="tick"
              >
                Clear all chats
              </button>
            )}
          </div>
        ) : null}
      </nav>
    </Modal>
  );
}
