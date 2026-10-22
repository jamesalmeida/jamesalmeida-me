import { after } from "next/server";
import { parseLead } from "@/lib/analytics";
import { notifyNewLead } from "@/lib/lead-notify.server";
import { readPublicJson } from "@/lib/public-request";
import { leadIpLimiter } from "@/lib/rate-limit";
import { storeApi, storeMutation } from "@/lib/store.server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024;

// The optional email field on the brief card. Unlike analytics this is stored before
// responding, so the visitor only sees "Thanks" once it's saved.
export async function POST(request: Request) {
  const result = await readPublicJson(request, leadIpLimiter, MAX_BODY_BYTES);
  if ("response" in result) return result.response;
  const lead = parseLead(result.body);
  if (!lead) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });

  try {
    const saved = await storeMutation(storeApi.leads.submit, lead);
    if (!saved) return Response.json({ error: "Saving isn't set up." }, { status: 503 });
  } catch (error) {
    console.error("Saving a lead failed.", error);
    return Response.json({ error: "Could not save your email." }, { status: 503 });
  }
  after(() => notifyNewLead(lead));
  return Response.json({ ok: true });
}
