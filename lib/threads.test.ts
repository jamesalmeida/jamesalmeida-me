import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HISTORY_THREADS_KEY,
  MAX_HISTORY_THREADS,
  MAX_MESSAGES_PER_THREAD,
  THREAD_STORAGE_KEY,
  capHistoryThreads,
  evictOldestHistory,
  pruneStoredThreads,
  readHistoryThreads,
  readStoredActiveThread,
  readStoredThreads,
  saveThreadMessages,
  writeHistoryThreads,
  writeStoredActiveThread,
  writeStoredThreads,
  type HistoryThread,
  type StoredThreads,
} from "./threads";

class FakeStorage {
  data = new Map<string, string>();
  quota = Infinity;
  throwOnGet = false;

  getItem(key: string) {
    if (this.throwOnGet) throw new Error("SecurityError");
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    let size = value.length;
    for (const [k, v] of this.data) if (k !== key) size += v.length;
    if (size > this.quota) {
      const error = new Error("quota");
      error.name = "QuotaExceededError";
      throw error;
    }
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }
}

const message = (id: string, role: "user" | "assistant", text: string): UIMessage => ({
  id,
  role,
  parts: [{ type: "text", text }],
});

const stored = (createdAt: number, messages: UIMessage[] = []) => ({
  createdAt,
  lastVisited: createdAt,
  userMessages: messages,
});

const history = (id: string, createdAt: number): HistoryThread => ({
  id,
  title: "General Chat",
  icon: "JA",
  description: "hi",
  createdAt,
  sourceThreadId: "new-chat",
});

let storage: FakeStorage;

beforeEach(() => {
  storage = new FakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("caps", () => {
  it("keeps only the last MAX_MESSAGES_PER_THREAD messages when saving", () => {
    const messages = Array.from({ length: MAX_MESSAGES_PER_THREAD + 20 }, (_, i) =>
      message(`m${i}`, i % 2 ? "assistant" : "user", `text ${i}`),
    );
    const next = saveThreadMessages({}, "new-chat", messages);
    const saved = next["new-chat"].userMessages;
    expect(saved).toHaveLength(MAX_MESSAGES_PER_THREAD);
    expect(saved[0].id).toBe("m20");
    expect(saved.at(-1)?.id).toBe(`m${MAX_MESSAGES_PER_THREAD + 19}`);
  });

  it("caps messages when reading old, oversized storage", () => {
    const messages = Array.from({ length: MAX_MESSAGES_PER_THREAD + 5 }, (_, i) =>
      message(`m${i}`, "user", `text ${i}`),
    );
    storage.data.set(THREAD_STORAGE_KEY, JSON.stringify({ "new-chat": stored(1, messages) }));
    expect(readStoredThreads()["new-chat"].userMessages).toHaveLength(MAX_MESSAGES_PER_THREAD);
  });

  it("keeps the newest MAX_HISTORY_THREADS history threads in order", () => {
    const threads = Array.from({ length: MAX_HISTORY_THREADS + 3 }, (_, i) =>
      history(`history-${i}`, 1000 - i),
    );
    const capped = capHistoryThreads(threads);
    expect(capped).toHaveLength(MAX_HISTORY_THREADS);
    expect(capped[0].id).toBe("history-0");
    expect(capped.map((t) => t.id)).not.toContain(`history-${MAX_HISTORY_THREADS}`);
  });

  it("returns the same history array when under the cap", () => {
    const threads = [history("history-1", 1)];
    expect(capHistoryThreads(threads)).toBe(threads);
  });

  it("caps history when reading storage", () => {
    const threads = Array.from({ length: MAX_HISTORY_THREADS + 10 }, (_, i) =>
      history(`history-${i}`, i),
    );
    storage.data.set(HISTORY_THREADS_KEY, JSON.stringify(threads));
    expect(readHistoryThreads()).toHaveLength(MAX_HISTORY_THREADS);
  });
});

describe("pruneStoredThreads", () => {
  it("drops history entries not in the list and keeps static threads", () => {
    const threads: StoredThreads = {
      "new-chat": stored(1),
      "history-1": stored(2),
      "history-2": stored(3),
    };
    const pruned = pruneStoredThreads(threads, new Set(["history-2"]));
    expect(Object.keys(pruned).sort()).toEqual(["history-2", "new-chat"]);
  });

  it("returns the same object when nothing is dropped", () => {
    const threads: StoredThreads = { "new-chat": stored(1), "history-1": stored(2) };
    expect(pruneStoredThreads(threads, new Set(["history-1"]))).toBe(threads);
  });
});

describe("evictOldestHistory", () => {
  it("removes the oldest half of history threads and never static ones", () => {
    const threads: StoredThreads = {
      "new-chat": stored(0),
      "history-c": stored(30),
      "history-a": stored(10),
      "history-b": stored(20),
    };
    const next = evictOldestHistory(threads);
    expect(Object.keys(next).sort()).toEqual(["history-c", "new-chat"]);
  });

  it("returns the same object when there is no history", () => {
    const threads: StoredThreads = { "new-chat": stored(0) };
    expect(evictOldestHistory(threads)).toBe(threads);
  });
});

describe("writeStoredThreads", () => {
  it("writes and returns the threads", () => {
    const threads: StoredThreads = { "new-chat": stored(1, [message("a", "user", "hi")]) };
    expect(writeStoredThreads(threads)).toBe(threads);
    expect(readStoredThreads()).toEqual(threads);
  });

  it("evicts the oldest history and retries once when storage is full", () => {
    const big = "x".repeat(400);
    const threads: StoredThreads = {
      "new-chat": stored(0),
      "history-old": stored(1, [message("o", "user", big)]),
      "history-new": stored(2, [message("n", "user", big)]),
    };
    storage.quota = JSON.stringify(threads).length - 100;

    const written = writeStoredThreads(threads);
    expect(written).not.toBeNull();
    expect(Object.keys(written!).sort()).toEqual(["history-new", "new-chat"]);
    expect(Object.keys(readStoredThreads()).sort()).toEqual(["history-new", "new-chat"]);
  });

  it("returns null without throwing when the retry also fails", () => {
    storage.quota = 10;
    const threads: StoredThreads = {
      "new-chat": stored(0, [message("a", "user", "x".repeat(100))]),
      "history-1": stored(1),
    };
    expect(writeStoredThreads(threads)).toBeNull();
  });

  it("returns null without throwing when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("SecurityError");
      },
    });
    expect(writeStoredThreads({ "new-chat": stored(0) })).toBeNull();
    expect(() => writeHistoryThreads([])).not.toThrow();
    expect(() => writeStoredActiveThread("new-chat")).not.toThrow();
  });
});

describe("safe reads", () => {
  it("returns empty state for corrupt JSON", () => {
    storage.data.set(THREAD_STORAGE_KEY, "{not json");
    storage.data.set(HISTORY_THREADS_KEY, "[oops");
    expect(readStoredThreads()).toEqual({});
    expect(readHistoryThreads()).toEqual([]);
  });

  it("returns empty state for JSON of the wrong shape", () => {
    storage.data.set(THREAD_STORAGE_KEY, JSON.stringify([1, 2, 3]));
    storage.data.set(HISTORY_THREADS_KEY, JSON.stringify({ a: 1 }));
    expect(readStoredThreads()).toEqual({});
    expect(readHistoryThreads()).toEqual([]);
  });

  it("falls back to defaults when getItem throws", () => {
    storage.throwOnGet = true;
    expect(readStoredThreads()).toEqual({});
    expect(readHistoryThreads()).toEqual([]);
    expect(readStoredActiveThread()).toBe("new-chat");
  });

  it("returns empty state without a window (SSR)", () => {
    vi.unstubAllGlobals();
    expect(readStoredThreads()).toEqual({});
    expect(readHistoryThreads()).toEqual([]);
  });
});
