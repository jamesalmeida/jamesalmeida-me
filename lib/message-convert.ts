import type { UIMessage } from "ai";

type ConvertiblePart = {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  args?: unknown;
  result?: unknown;
};

type ConvertibleMessage = {
  id?: string;
  role: string;
  content?: readonly ConvertiblePart[];
};

// @assistant-ui/react-ai-sdk 1.1.21 converts `tool-*` parts with
// state "output-available" back into tool-call parts (result = output).
export function toUIMessages(threadMessages: readonly ConvertibleMessage[]): UIMessage[] {
  const messages: UIMessage[] = [];

  threadMessages.forEach((message, index) => {
    if (
      message.role !== "user" &&
      message.role !== "assistant" &&
      message.role !== "system"
    ) {
      return;
    }

    const parts: UIMessage["parts"] = [];
    for (const part of message.content ?? []) {
      if (part.type === "text") {
        if (typeof part.text === "string" && part.text.length > 0) {
          parts.push({ type: "text", text: part.text });
        }
        continue;
      }

      if (
        part.type === "tool-call" &&
        part.result !== undefined &&
        typeof part.toolName === "string" &&
        part.toolName.length > 0 &&
        typeof part.toolCallId === "string"
      ) {
        parts.push({
          type: `tool-${part.toolName}` as "tool-showBookingCta",
          toolCallId: part.toolCallId,
          state: "output-available",
          input: part.args ?? {},
          output: part.result,
        });
      }
    }

    if (parts.length === 0) return;

    messages.push({
      id: message.id || `msg-${index}`,
      role: message.role,
      parts,
    });
  });

  return messages;
}
