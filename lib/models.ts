export const MODEL_COOKIE_NAME = "jamesalmeida-model";

export const MODEL_OPTIONS = [
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Balanced reasoning for most conversations.",
  },
  {
    id: "claude-3-5-haiku-latest",
    label: "Claude Haiku",
    provider: "Anthropic",
    description: "Fast, lighter-weight Claude option.",
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
  return value in MODEL_BY_ID;
}

export function getDefaultModelId(): ModelId {
  const envModel = process.env.DEFAULT_MODEL;
  return envModel && isModelId(envModel) ? envModel : "claude-sonnet-4-5";
}

export function resolveModelId(value?: string | null): ModelId {
  return value && isModelId(value) ? value : getDefaultModelId();
}

export function getModelOption(value?: string | null): ModelOption {
  return MODEL_BY_ID[resolveModelId(value)];
}
