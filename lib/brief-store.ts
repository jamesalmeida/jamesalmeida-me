import { toBrief } from "@/lib/brief";
import { parsePersistedBriefCard, type PersistedBriefCard } from "@/lib/brief-card";

// A brief card's edits, collapse and sent state, kept in this browser beside the
// chat. The server is also idempotent (convex/leads.ts), so a lost write or a
// retry can't create a second lead.

const BRIEF_CARDS_KEY = "jamesalmeida-brief-cards";
const MAX_CARDS = 50;

type StoredCards = Record<string, PersistedBriefCard>;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function readAll(): StoredCards {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const parsed: unknown = JSON.parse(storage.getItem(BRIEF_CARDS_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed as Record<string, unknown>).flatMap(([id, value]) => {
      const card = parsePersistedBriefCard(value, toBrief);
      return card ? [[id, card] as const] : [];
    });
    return Object.fromEntries(entries.slice(-MAX_CARDS));
  } catch {
    return {};
  }
}

export function readBriefCard(toolCallId: string): PersistedBriefCard | null {
  return readAll()[toolCallId] ?? null;
}

export function writeBriefCard(toolCallId: string, card: PersistedBriefCard): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const all = readAll();
    const entries = [...Object.entries(all).filter(([id]) => id !== toolCallId), [toolCallId, card] as const];
    storage.setItem(BRIEF_CARDS_KEY, JSON.stringify(Object.fromEntries(entries.slice(-MAX_CARDS))));
  } catch {
    // A draft that isn't kept is fine.
  }
}

export function clearBriefCards(): void {
  try {
    getStorage()?.removeItem(BRIEF_CARDS_KEY);
  } catch {
    // Storage may be disabled.
  }
}
