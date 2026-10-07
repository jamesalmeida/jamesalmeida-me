import "server-only";

import type { UIMessage } from "ai";
import {
  bookingCtaInputSchema,
  bookingCtaOutput,
  portfolioInputSchema,
  portfolioOutput,
} from "@/lib/tool-results";

const MAX_MESSAGES = 20;
const MAX_TEXT_CHARS = 2_000;
const MAX_TOOL_PARTS_PER_MESSAGE = 4;
const MAX_TOOL_INPUT_CHARS = 1_024;
const MAX_TOTAL_TOOL_INPUT_CHARS = 8 * 1_024;
const MAX_PORTFOLIO_IDS = 20;
const MAX_PORTFOLIO_ID_CHARS = 64;
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

  if (type === "tool-showPortfolio") {
    const parsed = portfolioInputSchema.safeParse(input);
    if (!parsed.success) return null;
    const ids = parsed.data.ids;
    if (
      ids &&
      (ids.length > MAX_PORTFOLIO_IDS || ids.some((id) => id.length > MAX_PORTFOLIO_ID_CHARS))
    ) {
      return null;
    }
    budget.inputChars += inputChars;
    return {
      type,
      toolCallId,
      state: "output-available",
      input: parsed.data,
      output: portfolioOutput(parsed.data),
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

export function sanitizeMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return [];

  const roleKept = raw.filter((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    const role = (item as { role?: unknown }).role;
    return role === "user" || role === "assistant";
  });

  const messages: UIMessage[] = [];
  const budget: ToolBudget = { inputChars: 0 };
  for (const [index, candidate] of roleKept.slice(-MAX_MESSAGES).entries()) {
    const parts = sanitizeParts(candidate.parts, budget);
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
