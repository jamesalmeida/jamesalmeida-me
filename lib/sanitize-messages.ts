import "server-only";

import type { UIMessage } from "ai";

const MAX_MESSAGES = 20;
const MAX_TEXT_CHARS = 2_000;
const ALLOWED_TOOL_TYPES = new Set(["tool-showBookingCta", "tool-showPortfolio"]);

function asPlainObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  try {
    const cloned = JSON.parse(JSON.stringify(value)) as unknown;
    if (cloned && typeof cloned === "object" && !Array.isArray(cloned)) {
      return cloned as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function sanitizeParts(raw: unknown): UIMessage["parts"] {
  if (!Array.isArray(raw)) return [];

  const parts: UIMessage["parts"] = [];
  for (const part of raw) {
    if (!part || typeof part !== "object") continue;
    const candidate = part as Record<string, unknown>;

    if (candidate.type === "text" && typeof candidate.text === "string") {
      const text = candidate.text.slice(0, MAX_TEXT_CHARS);
      if (!text) continue;
      parts.push({ type: "text", text });
      continue;
    }

    if (
      typeof candidate.type === "string" &&
      ALLOWED_TOOL_TYPES.has(candidate.type) &&
      candidate.state === "output-available" &&
      typeof candidate.toolCallId === "string"
    ) {
      parts.push({
        type: candidate.type as "tool-showBookingCta",
        toolCallId: candidate.toolCallId,
        state: "output-available",
        input: asPlainObject(candidate.input),
        output: asPlainObject(candidate.output),
      });
    }
  }

  return parts;
}

export function sanitizeMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return [];

  const roleKept = raw.filter((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    const role = (item as { role?: unknown }).role;
    return role === "user" || role === "assistant";
  });

  const messages: UIMessage[] = [];
  for (const [index, candidate] of roleKept.slice(-MAX_MESSAGES).entries()) {
    const parts = sanitizeParts(candidate.parts);
    if (parts.length === 0) continue;
    const role = candidate.role === "assistant" ? "assistant" : "user";
    messages.push({
      id: typeof candidate.id === "string" ? candidate.id : `msg-${index}`,
      role,
      parts,
    });
  }

  if (!messages.some((message) => message.role === "user")) {
    return messages;
  }

  while (messages.length > 0 && messages[messages.length - 1]?.role !== "user") {
    messages.pop();
  }

  return messages;
}
