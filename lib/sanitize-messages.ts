import "server-only";

import type { UIMessage } from "ai";
import {
  bookingCtaInputSchema,
  bookingCtaOutput,
  briefInputSchema,
  briefOutput,
} from "@/lib/tool-results";

// The newest messages up to this much text, the same worst case as 20 full messages.
// A normal chat fits whole. MAX_MESSAGES only stops a body of thousands of tiny ones.
const MAX_HISTORY_CHARS = 40_000;
const MAX_MESSAGES = 200;
const MAX_TEXT_CHARS = 2_000;
const MAX_TOOL_PARTS_PER_MESSAGE = 4;
// A full brief is six fields of up to 200 characters, plus keys, quotes and `lead`.
const MAX_TOOL_INPUT_CHARS = 1_536;
const MAX_TOTAL_TOOL_INPUT_CHARS = 8 * 1_024;
const TOOL_CALL_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

type ToolBudget = { inputChars: number };

function serializedLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? Infinity;
  } catch {
    return Infinity;
  }
}

// Client-sent tool output is never trusted. The input is validated with the
// tool's own schema and the output is recomputed exactly as `execute` does.
function rebuildToolPart(
  candidate: Record<string, unknown>,
  budget: ToolBudget,
): UIMessage["parts"][number] | null {
  const { type, toolCallId } = candidate;
  const input = candidate.input ?? {};
  if (candidate.state !== "output-available") return null;
  if (typeof toolCallId !== "string" || !TOOL_CALL_ID_PATTERN.test(toolCallId)) return null;

  const inputChars = serializedLength(input);
  if (inputChars > MAX_TOOL_INPUT_CHARS) return null;
  if (budget.inputChars + inputChars > MAX_TOTAL_TOOL_INPUT_CHARS) return null;

  if (type === "tool-showBookingCta") {
    const parsed = bookingCtaInputSchema.safeParse(input);
    if (!parsed.success) return null;
    budget.inputChars += inputChars;
    return {
      type,
      toolCallId,
      state: "output-available",
      input: parsed.data,
      output: bookingCtaOutput(),
    };
  }

  if (type === "tool-showBrief") {
    const parsed = briefInputSchema.safeParse(input);
    if (!parsed.success) return null;
    budget.inputChars += inputChars;
    return {
      type,
      toolCallId,
      state: "output-available",
      input: parsed.data,
      output: briefOutput(parsed.data),
    };
  }

  return null;
}

function sanitizeParts(raw: unknown, budget: ToolBudget): UIMessage["parts"] {
  if (!Array.isArray(raw)) return [];

  const parts: UIMessage["parts"] = [];
  let toolParts = 0;
  for (const part of raw) {
    if (!part || typeof part !== "object") continue;
    const candidate = part as Record<string, unknown>;

    if (candidate.type === "text" && typeof candidate.text === "string") {
      const text = candidate.text.slice(0, MAX_TEXT_CHARS);
      if (!text) continue;
      parts.push({ type: "text", text });
      continue;
    }

    if (toolParts >= MAX_TOOL_PARTS_PER_MESSAGE) continue;
    const toolPart = rebuildToolPart(candidate, budget);
    if (toolPart) {
      parts.push(toolPart);
      toolParts += 1;
    }
  }

  return parts;
}

function textChars(parts: UIMessage["parts"]): number {
  return parts.reduce((total, part) => total + (part.type === "text" ? part.text.length : 0), 0);
}

export function sanitizeMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return [];

  const roleKept = raw.filter((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    const role = (item as { role?: unknown }).role;
    return role === "user" || role === "assistant";
  });

  // Newest first, so the size and tool budgets drop the oldest messages and cards.
  const newestFirst: UIMessage[] = [];
  const budget: ToolBudget = { inputChars: 0 };
  let historyChars = 0;
  const recent = roleKept.slice(-MAX_MESSAGES);
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const candidate = recent[index];
    const parts = sanitizeParts(candidate.parts, budget);
    if (parts.length === 0) continue;
    historyChars += textChars(parts);
    if (historyChars > MAX_HISTORY_CHARS && newestFirst.length > 0) break;
    const role = candidate.role === "assistant" ? "assistant" : "user";
    newestFirst.push({
      id: typeof candidate.id === "string" ? candidate.id : `msg-${index}`,
      role,
      parts,
    });
  }
  const messages = newestFirst.reverse();

  if (!messages.some((message) => message.role === "user")) {
    return messages;
  }

  while (messages.length > 0 && messages[messages.length - 1]?.role !== "user") {
    messages.pop();
  }

  return messages;
}
