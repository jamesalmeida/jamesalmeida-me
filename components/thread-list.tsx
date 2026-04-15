"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Menu, Moon, Settings, Sun, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ACCENTS, useTheme, type Accent } from "@/components/theme-provider";
import type { HistoryThread, PortfolioThread } from "@/lib/threads";

const ACCENT_SWATCHES: Record<Accent, { label: string; light: string; dark: string }> = {
  grey: { label: "Grey", light: "#2f4858", dark: "#8ba4b5" },
  orange: { label: "Orange", light: "#ea580c", dark: "#fb923c" },
  red: { label: "Red", light: "#dc2626", dark: "#f87171" },
  blue: { label: "Blue", light: "#2563eb", dark: "#60a5fa" },
  green: { label: "Green", light: "#16a34a", dark: "#4ade80" },
  yellow: { label: "Yellow", light: "#eab308", dark: "#facc15" },
  purple: { label: "Purple", light: "#7c3aed", dark: "#a78bfa" },
};

type ThreadListProps = {
  activeThreadId: string;
  historyThreads: HistoryThread[];
  isOpen: boolean;
  onDeleteThread: (threadId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelectThread: (threadId: string) => void;
  previews: Record<string, string>;
  threads: PortfolioThread[];
};

export function ThreadList({
  activeThreadId,
  historyThreads,
  isOpen,
  onDeleteThread,
  onOpenChange,
  onSelectThread,
  previews,
  threads,
}: ThreadListProps) {
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const seededThreads = threads.filter((thread) => thread.seeded);
  const newChatThread = threads.find((thread) => thread.id === "new-chat");

  return (
    <>
      <button
        className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--foreground)] lg:hidden"
        onClick={() => onOpenChange(!isOpen)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex w-[21rem] max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--panel-strong)] transition-transform duration-300 lg:static lg:max-w-none lg:translate-x-0`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 py-5">
          <div>
            <p className="eyebrow text-xs text-[var(--muted)]">JamesAlmeida.me</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">
              A chat-first portfolio covering projects, experience, socials,
              and the full resume.
            </p>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] lg:hidden"
            onClick={() => onOpenChange(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mx-5 border-b border-[var(--border)]" />

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {newChatThread ? (
            <div className="space-y-2">
              <p className="eyebrow text-[11px] text-[var(--muted)]">Default</p>
              <ThreadButton
                isActive={activeThreadId === newChatThread.id}
                onClick={() => onSelectThread(newChatThread.id)}
                preview={previews[newChatThread.id]}
                thread={newChatThread}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="eyebrow text-[11px] text-[var(--muted)]">Pre-seeded</p>
            <div className="space-y-2">
              {seededThreads.map((thread) => (
                <ThreadButton
                  key={thread.id}
                  isActive={activeThreadId === thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  preview={previews[thread.id]}
                  thread={thread}
                />
              ))}
            </div>
          </div>

          {historyThreads.length > 0 ? (
            <div className="space-y-2">
              <p className="eyebrow text-[11px] text-[var(--muted)]">History</p>
              <div className="space-y-2">
                {historyThreads.map((history) => (
                  <HistoryThreadButton
                    key={history.id}
                    isActive={activeThreadId === history.id}
                    onClick={() => onSelectThread(history.id)}
                    onDelete={() => onDeleteThread(history.id)}
                    preview={previews[history.id] ?? history.title}
                    thread={{
                      id: history.id,
                      title: history.title,
                      icon: history.icon,
                      description: `Saved on ${new Date(history.createdAt).toLocaleDateString()}`,
                      seeded: false,
                      baseMessages: [],
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </nav>
        <div className="mx-5 border-t border-[var(--border)]" />

        <div className="shrink-0 px-5 py-5">
          <p className="eyebrow mb-3 text-[11px] text-[var(--muted)]">Settings</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      ) : null}

      {isSettingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-[-0.02em]">
                Settings
              </h2>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close settings"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-6">
              <p className="eyebrow mb-3 text-[11px] text-[var(--muted)]">
                Accent color
              </p>
              <div className="flex items-center justify-between gap-2">
                {ACCENTS.map((name) => {
                  const swatch = ACCENT_SWATCHES[name];
                  const color = theme === "dark" ? swatch.dark : swatch.light;
                  const isSelected = accent === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAccent(name)}
                      className={`h-8 w-8 rounded-full border transition hover:-translate-y-px ${
                        isSelected
                          ? "border-[var(--foreground)] ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--panel-strong)]"
                          : "border-[var(--border)]"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`${swatch.label} accent`}
                      aria-pressed={isSelected}
                      title={swatch.label}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const SWIPE_REVEAL = 68;

type HistoryThreadButtonProps = {
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  preview: string;
  thread: PortfolioThread;
};

function HistoryThreadButton({
  isActive,
  onClick,
  onDelete,
  preview,
  thread,
}: HistoryThreadButtonProps) {
  const x = useMotionValue(0);
  // Fade the red zone in as the card is swiped — invisible at rest so the
  // semi-transparent panel background doesn't let it bleed through
  const trashOpacity = useTransform(x, [0, -12], [0, 1]);
  // JS hover state so the trash icon stays visible when the mouse moves onto it
  const [isHovered, setIsHovered] = useState(false);
  // Only enable drag on touch devices — avoids accidental drags on desktop
  const [dragEnabled, setDragEnabled] = useState(false);

  useEffect(() => {
    setDragEnabled(window.matchMedia("(hover: none)").matches);
  }, []);

  const snapOpen = () =>
    animate(x, -SWIPE_REVEAL, { type: "spring", stiffness: 400, damping: 35 });
  const snapClosed = () =>
    animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });

  const handleDragEnd = () => {
    if (x.get() < -(SWIPE_REVEAL / 2)) {
      snapOpen();
    } else {
      snapClosed();
    }
  };

  const handleCardClick = () => {
    if (x.get() < -8) {
      snapClosed();
      return;
    }
    onClick();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[1.25rem] border transition-colors duration-200 ${
        isActive
          ? "border-[var(--accent)]/30 shadow-[0_18px_42px_rgba(0,0,0,0.14)]"
          : isHovered
            ? "border-[var(--border-strong)]"
            : "border-[var(--border)]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Red trash zone — behind the card, revealed by swiping left on mobile */}
      {dragEnabled ? (
        <motion.div
          className="absolute inset-y-0 right-0 flex w-[68px] items-center justify-center bg-red-500"
          style={{ opacity: trashOpacity }}
        >
          <button
            onClick={onDelete}
            className="flex h-full w-full items-center justify-center text-white"
            aria-label="Delete thread"
          >
            <Trash2 size={15} />
          </button>
        </motion.div>
      ) : null}

      {/* Card — swipeable on touch, static on desktop */}
      <motion.div
        className={`relative z-10 ${isActive ? "bg-[var(--accent)]" : "bg-[var(--panel)]"}`}
        style={{ x, touchAction: dragEnabled ? "pan-y" : "auto" }}
        drag={dragEnabled ? "x" : false}
        dragConstraints={{ left: -SWIPE_REVEAL, right: 0 }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <button
          className={`w-full rounded-none px-4 py-3 text-left transition-colors duration-200 ${
            isActive
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--panel)] hover:bg-[var(--panel-strong)]"
          }`}
          onClick={handleCardClick}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{thread.title}</div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Desktop trash — top-right corner, JS-driven so it stays visible when mousing onto it */}
      {!dragEnabled ? (
        <button
          onClick={onDelete}
          className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] shadow-sm transition-opacity hover:text-red-500 ${
            isHovered ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-label="Delete thread"
          tabIndex={isHovered ? 0 : -1}
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}

type ThreadButtonProps = {
  isActive: boolean;
  onClick: () => void;
  preview: string;
  thread: PortfolioThread;
};

function ThreadButton({
  isActive,
  onClick,
  preview,
  thread,
}: ThreadButtonProps) {
  return (
    <button
      className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition duration-200 ${
        isActive
          ? "border-[var(--accent)]/30 bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_18px_42px_rgba(0,0,0,0.14)]"
          : "border-[var(--border)] bg-[var(--panel)] hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--panel-strong)]"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`eyebrow rounded-full border px-2 py-1 text-[10px] ${
            isActive
              ? "border-[var(--accent-foreground)]/20 text-[var(--accent-foreground)]/70"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          {thread.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{thread.title}</div>
          <p
            className={`mt-1 text-sm leading-5 ${
              isActive ? "text-[var(--accent-foreground)]/80" : "text-[var(--muted)]"
            }`}
          >
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
