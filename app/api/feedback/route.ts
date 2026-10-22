import { after } from "next/server";
import { parseFeedback } from "@/lib/analytics";
import { readPublicJson } from "@/lib/public-request";
import { analyticsIpLimiter } from "@/lib/rate-limit";
import { storeApi, storeMutationQuietly } from "@/lib/store.server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12 * 1024;

// Thumbs up/down and the feedback form under each reply (lib/feedback.ts).
export async function POST(request: Request) {
  const result = await readPublicJson(request, analyticsIpLimiter, MAX_BODY_BYTES);
  if ("response" in result) return result.response;
  const feedback = parseFeedback(result.body);
  if (!feedback) return Response.json({ error: "Invalid feedback." }, { status: 400 });
  after(() => storeMutationQuietly(storeApi.feedback.submit, feedback));
  return new Response(null, { status: 204 });
}
