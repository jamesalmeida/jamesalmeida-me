import { after } from "next/server";
import { parseClientEvent } from "@/lib/analytics";
import { readPublicJson } from "@/lib/public-request";
import { analyticsIpLimiter } from "@/lib/rate-limit";
import { storeApi, storeMutationQuietly } from "@/lib/store.server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2 * 1024;

// Funnel events from the browser (lib/visit.ts): landing_view, booking_clicked,
// email_clicked, example_sent. Stored after the response, so the page never waits on it.
export async function POST(request: Request) {
  const result = await readPublicJson(request, analyticsIpLimiter, MAX_BODY_BYTES);
  if ("response" in result) return result.response;
  const event = parseClientEvent(result.body);
  if (!event) return Response.json({ error: "Invalid event." }, { status: 400 });
  after(() => storeMutationQuietly(storeApi.events.record, event));
  return new Response(null, { status: 204 });
}
