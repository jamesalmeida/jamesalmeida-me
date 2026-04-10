import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { createModel } from "@/lib/models.server";
import { getModelOption, MODEL_COOKIE_NAME } from "@/lib/models";
import { getSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const selectedModelId = cookieStore.get(MODEL_COOKIE_NAME)?.value;
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const model = createModel(selectedModelId);
  const modelOption = getModelOption(selectedModelId);

  const result = streamText({
    model,
    system: getSystemPrompt(),
    messages: convertToModelMessages(messages ?? []),
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return { model: modelOption.id };
      }

      if (part.type === "finish") {
        return {
          model: modelOption.id,
          totalTokens: part.totalUsage?.totalTokens,
        };
      }

      return undefined;
    },
  });
}
