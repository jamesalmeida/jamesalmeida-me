import { readUIMessageStream } from "ai";
import { describe, expect, it } from "vitest";
import { blockedChatResponse, blockedChatStream } from "./blocked-chat";

describe("blockedChatResponse", () => {
  it("streams a finished assistant message and does not call a model", async () => {
    const text = "I can't take that one further.";
    const messages = [];
    for await (const message of readUIMessageStream({ stream: blockedChatStream(text) })) {
      messages.push(message);
    }
    const last = messages.at(-1);
    expect(last?.role).toBe("assistant");
    expect(last?.parts.filter((part) => part.type === "text").map((part) => (part.type === "text" ? part.text : ""))).toEqual([
      text,
    ]);

    const response = blockedChatResponse(text);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-vercel-ai-ui-message-stream")).toBe("v1");
    expect(await response.text()).toContain(text);
  });
});
