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
    system:
      "You generate short, specific conversation titles. Given a user's message, return a 4–7 word title that captures what they're asking about. Return ONLY the title — no quotes, no punctuation at the end, no explanation.",
    prompt: message,
  });

  const title = text.trim().replace(/^["']|["']$/g, "").replace(/[.!?]$/, "");

  return Response.json({ title: title || null });
}
