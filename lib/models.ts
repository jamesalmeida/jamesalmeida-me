export const MODEL_COOKIE_NAME = "jamesalmeida-model";

export const MODEL_OPTIONS = [
  {
    id: "gpt-5.4",
    label: "GPT-5.4",
    provider: "OpenAI",
    description: "Latest GPT-5.4 model.",
  },
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    provider: "Anthropic",
    description: "Latest Claude Sonnet: balanced speed and reasoning.",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    description: "Strong general-purpose OpenAI model.",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "OpenAI",
    description: "Faster, lower-cost OpenAI option.",
  },
] as const;

export type ModelOption = (typeof MODEL_OPTIONS)[number];
export type ModelId = ModelOption["id"];

const MODEL_BY_ID = Object.fromEntries(
  MODEL_OPTIONS.map((option) => [option.id, option]),
) as Record<ModelId, ModelOption>;

export function isModelId(value: string): value is ModelId {
  return Object.hasOwn(MODEL_BY_ID, value);
}

// Retired ids that map to their replacement, so an old DEFAULT_MODEL value or a
// signed admin cookie keeps working after a model is swapped out.
export const LEGACY_MODEL_IDS: Record<string, ModelId> = {
  "claude-sonnet-4-5": "claude-sonnet-5-5",
};

/** A current model id, a legacy id mapped to its replacement, or null. */
export function normalizeModelId(value?: string | null): ModelId | null {
  if (!value) return null;
  if (isModelId(value)) return value;
  return Object.hasOwn(LEGACY_MODEL_IDS, value) ? LEGACY_MODEL_IDS[value] : null;
}

export function getDefaultModelId(): ModelId {
  return normalizeModelId(process.env.DEFAULT_MODEL) ?? "gpt-5.4";
}

export function resolveModelId(value?: string | null): ModelId {
  return normalizeModelId(value) ?? getDefaultModelId();
}

export function getModelOption(value?: string | null): ModelOption {
  return MODEL_BY_ID[resolveModelId(value)];
}
