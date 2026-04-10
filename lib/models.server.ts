import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { resolveModelId, type ModelId } from "@/lib/models";

export function createModel(value?: string | null) {
  const modelId = resolveModelId(value);

  return MODEL_FACTORIES[modelId]();
}

const MODEL_FACTORIES = {
  "claude-sonnet-4-5": () => anthropic("claude-sonnet-4-5"),
  "claude-3-5-haiku-latest": () => anthropic("claude-3-5-haiku-latest"),
  "gpt-4o": () => openai("gpt-4o"),
  "gpt-4o-mini": () => openai("gpt-4o-mini"),
} satisfies Record<ModelId, () => LanguageModel>;
