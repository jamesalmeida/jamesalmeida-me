import { describe, expect, it } from "vitest";
import {
  initialThreadSession,
  reduceThreadSession,
  sessionConversationId,
  sessionKey,
  sessionThreadId,
} from "./thread-session";

describe("thread session", () => {
  it("moves from the landing into a chat without remounting", () => {
    const landing = initialThreadSession();
    const chat = reduceThreadSession(landing, {
      type: "first_message_sent",
      threadId: "history-1",
      conversationId: "m1",
    });
    expect(chat).toEqual({ phase: "chat", key: 0, threadId: "history-1", conversationId: "m1" });
    expect(sessionKey(chat)).toBe(sessionKey(landing));
    expect(sessionThreadId(chat)).toBe("history-1");
    expect(sessionConversationId(chat)).toBe("m1");
  });

  it("ignores a second first_message_sent", () => {
    const chat = reduceThreadSession(initialThreadSession(), {
      type: "first_message_sent",
      threadId: "history-1",
      conversationId: "m1",
    });
    expect(
      reduceThreadSession(chat, { type: "first_message_sent", threadId: "history-2", conversationId: "m2" }),
    ).toBe(chat);
  });

  it("bumps the key for New chat, opening a chat and clearing all", () => {
    const chat = reduceThreadSession(initialThreadSession(), {
      type: "first_message_sent",
      threadId: "history-1",
      conversationId: "m1",
    });
    const opened = reduceThreadSession(chat, {
      type: "chat_opened",
      threadId: "history-2",
      conversationId: "m2",
    });
    expect(opened).toMatchObject({ phase: "chat", threadId: "history-2", key: chat.key + 1 });

    const landing = reduceThreadSession(opened, { type: "new_chat" });
    expect(landing).toEqual({ phase: "landing", key: opened.key + 1 });

    const cleared = reduceThreadSession(opened, { type: "all_cleared" });
    expect(cleared).toEqual({ phase: "landing", key: opened.key + 1 });
  });

  it("only leaves a chat when the chat on screen is the one deleted", () => {
    const chat = reduceThreadSession(initialThreadSession(), {
      type: "first_message_sent",
      threadId: "history-1",
      conversationId: "m1",
    });
    expect(reduceThreadSession(chat, { type: "chat_deleted", threadId: "history-2" })).toBe(chat);
    expect(reduceThreadSession(chat, { type: "chat_deleted", threadId: "history-1" })).toEqual({
      phase: "landing",
      key: chat.key + 1,
    });
  });

  it("uses the new-chat slot on the landing", () => {
    const landing = initialThreadSession();
    expect(sessionThreadId(landing)).toBe("new-chat");
    expect(sessionConversationId(landing)).toBeUndefined();
  });
});
