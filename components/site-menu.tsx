"use client";

import { play } from "cuelume";
import { motion, useReducedMotion } from "framer-motion";
import { Laptop, Moon, Sun, Trash2, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
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
  "text-[32px] leading-[1.3] tracking-[-0.025em] text-[var(--foreground)] decoration-2 underline-offset-[6px] hover:underline focus-visible:underline sm:text-[38px] sm:leading-[1.25]";

// The Menu button grows and morphs into the panel: a surface layer animates from the
// button's box (a circle with its border) to the panel's box, then the contents fade
// in. Closing reverses it, so the panel folds back into the button.
const PANEL_RADIUS = 32;
const morphOpen = { type: "spring", stiffness: 300, damping: 32, mass: 0.9 } as const;
const morphClose = { duration: 0.34, ease: [0.4, 0, 0.2, 1], delay: 0.06 } as const;
const contentOpen = { duration: 0.22, ease: "easeOut", delay: 0.14 } as const;
const contentClose = { duration: 0.1, ease: "easeIn" } as const;
// Fallback in case the closing animation never reports completion.
const CLOSE_FALLBACK_MS = 700;

type Box = { top: number; left: number; width: number; height: number; borderRadius: number };

/** The Menu button's box relative to the panel, or null if either is missing. */
function measureButton(button: HTMLElement | null, panel: HTMLElement | null): Box | null {
  if (!button || !panel) return null;
  const b = button.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  return { top: b.top - p.top, left: b.left - p.left, width: b.width, height: b.height, borderRadius: b.height / 2 };
}

type SiteMenuProps = {
  activeThreadId: string;
  hasChats: boolean;
  historyThreads: HistoryThread[];
  onClearAllChats: () => void;
  onClose: () => void;
  onDeleteThread: (threadId: string) => void;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  /** The Menu button: focus returns to it, and the panel grows out of and back into it. */
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
  const [isClosing, setIsClosing] = useState(false);
  const [buttonBox, setButtonBox] = useState<Box | null>(null);
  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Measure before the first paint, so the morph starts exactly on the Menu button,
  // then follow the panel's size (Clear all's confirm step, deleted chats, resizes).
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    setButtonBox(measureButton(returnFocusRef.current, panel));
    const update = () => setPanelSize({ width: panel.offsetWidth, height: panel.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [returnFocusRef]);

  const panelBox: Box | null = panelSize
    ? { top: 0, left: 0, ...panelSize, borderRadius: PANEL_RADIUS }
    : null;
  // Without a Menu button to grow from (or with reduced motion) the panel just fades.
  const startBox = !reduceMotion && buttonBox ? buttonBox : panelBox;

  useEffect(() => {
    if (!isClosing) return;
    const timer = window.setTimeout(onClose, CLOSE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [isClosing, onClose]);

  // Folds back into the Menu button (measured again, in case the window changed), then
  // unmounts (onClose).
  const requestClose = () => {
    setButtonBox(measureButton(returnFocusRef.current, panelRef.current));
    setIsClosing(true);
  };
  // Dismissing (close button, Escape, backdrop) gets a soft sound. Menu actions
  // already play their own tick, so closing after them stays quiet.
  const dismiss = () => {
    play("whisper");
    requestClose();
  };
  const closeAfter = (action: () => void) => () => {
    action();
    requestClose();
  };

  return (
    <Modal
      labelledBy={titleId}
      onClose={dismiss}
      layout="sheet"
      initialFocusRef={closeRef}
      returnFocusRef={returnFocusRef}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-[8px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      <nav
        ref={panelRef}
        aria-labelledby={titleId}
        className="relative flex max-h-full w-full flex-col sm:w-[480px]"
      >
        {startBox && panelBox ? (
          <motion.div
            aria-hidden
            className="absolute overflow-hidden bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            initial={startBox}
            animate={isClosing ? (reduceMotion ? panelBox : (buttonBox ?? panelBox)) : panelBox}
            transition={isClosing ? morphClose : morphOpen}
            onAnimationComplete={() => {
              if (isClosing) onClose();
            }}
          >
            {/* The Menu button's border, fading as it grows into the panel. */}
            <motion.div
              className="absolute inset-0 rounded-[inherit] border border-[var(--border-strong)]"
              initial={{ opacity: startBox === panelBox ? 0 : 1 }}
              animate={{ opacity: isClosing && !reduceMotion ? 1 : 0 }}
              transition={isClosing ? morphClose : { duration: 0.25 }}
            />
          </motion.div>
        ) : null}
        <motion.div
          className="relative flex min-h-0 flex-col gap-10 overflow-y-auto rounded-[2rem] px-4 pb-6 pt-4 sm:px-10 sm:pb-8 sm:pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          transition={isClosing ? contentClose : contentOpen}
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
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                        isSelected
                          ? "text-[var(--foreground)]"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                      data-cuelume-press="tick"
                    >
                      {isSelected ? (
                        // Slides to the selected option.
                        <motion.span
                          layoutId="theme-pill"
                          className="absolute inset-0 rounded-full bg-[var(--surface)] shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                        />
                      ) : null}
                      <span className="relative">{option.icon}</span>
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
              onClick={dismiss}
              aria-label="Close menu"
              className={roundButtonClass}
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button type="button" onClick={closeAfter(onNewChat)} className={menuLinkClass} data-cuelume-press="tick">
              New chat
            </button>
            <Link href="/consulting" className={menuLinkClass} data-cuelume-press="tick">
              How I can help
            </Link>
            <Link href="/about" className={menuLinkClass} data-cuelume-press="tick">
              Why I do this
            </Link>
            <a href={`mailto:${SITE.email}`} className={menuLinkClass} data-track="email_clicked" data-cuelume-press="tick">
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
                          onClick={closeAfter(() => onSelectThread(thread.id))}
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
                      onClick={closeAfter(() => {
                        setIsConfirmingClear(false);
                        onClearAllChats();
                      })}
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
        </motion.div>
      </nav>
    </Modal>
  );
}
