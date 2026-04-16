import { generateText } from "ai";
import { cookies } from "next/headers";
import { createModel } from "@/lib/models.server";
import { MODEL_COOKIE_NAME } from "@/lib/models";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const selectedModelId = cookieStore.get(MODEL_COOKIE_NAME)?.value;
  const { message } = (await req.json()) as { message: string };

  if (!message) {
    return Response.json({ title: null });
  }

  const model = createModel(selectedModelId);

  const { text } = await generateText({
    model,
    maxTokens: 10,
    system:
      "You are a title generator. Given a user message, output 1–3 words that label the topic. No markdown, no hashtags, no quotes, no punctuation, no explanation. Never include \"James\" or \"James Almeida\". Examples: Tech Stack, Career Timeline, Product Work, Sheldn.ai, Consulting, Contact Info, AI Training, Frontend Rebuilds.",
    prompt: `Label this message in 1–3 words: "${message}"`,
  });

  let title = text
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/[.!?:,]$/g, "");
  const firstLine = title.split("\n")[0].trim();
  title = firstLine;
  if (title.length > 30) {
    const truncated = title.slice(0, 30);
    const lastSpace = truncated.lastIndexOf(" ");
    title = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  }

  return Response.json({ title: title || null });
}
