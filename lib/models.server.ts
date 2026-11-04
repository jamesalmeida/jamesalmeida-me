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
  "gpt-5.4": () => openai("gpt-5.4"),
  "claude-sonnet-5-5": () => anthropic("claude-sonnet-5-5"),
  "gpt-4o": () => openai("gpt-4o"),
  "gpt-4o-mini": () => openai("gpt-4o-mini"),
} satisfies Record<ModelId, () => LanguageModel>;

// The job card (lib/job-card.server.ts) uses a small fixed model, never the admin's
// override. Each provider with a key is tried in turn, so one outage doesn't stop it.
export function createJobCardModels(): LanguageModel[] {
  return [
    ...(process.env.ANTHROPIC_API_KEY ? [anthropic("claude-haiku-5-5")] : []),
    ...(process.env.OPENAI_API_KEY ? [openai("gpt-4o-mini")] : []),
  ];
}
