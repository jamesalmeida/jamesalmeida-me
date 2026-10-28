import "server-only";

import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

// A refusal the chat UI can render as a normal assistant message, without
// calling the reply model. The chunk sequence matches a text-only UI stream.
export function blockedChatStream(text: string) {
  return createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id: "text-1" });
      writer.write({ type: "text-delta", id: "text-1", delta: text });
      writer.write({ type: "text-end", id: "text-1" });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish", finishReason: "stop" });
    },
  });
}

export function blockedChatResponse(text: string): Response {
  return createUIMessageStreamResponse({ stream: blockedChatStream(text) });
}
