import "server-only";

import { SITE } from "@/data/site";
import { briefText, type Brief } from "@/lib/brief";

// Optional: emails James when someone sends him their brief. Needs
// RESEND_API_KEY and LEAD_NOTIFY_FROM (a sender on a domain verified in Resend);
// LEAD_NOTIFY_TO defaults to SITE.email. Without them the lead is only in /admin.
export async function notifyNewLead(lead: { email: string; name?: string; brief: Brief; note?: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFY_FROM;
  if (!apiKey || !from) return;

  const who = lead.name ? `${lead.name} <${lead.email}>` : lead.email;
  const brief = briefText(lead.brief) || "(no brief)";
  // Written by the visitor and not screened by Jev, so it's labelled as theirs.
  const note = lead.note ? `\n\nTheir note, in their own words (unverified):\n${lead.note}` : "";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: process.env.LEAD_NOTIFY_TO || SITE.email,
        reply_to: lead.email,
        subject: `New lead from the site: ${lead.name || lead.email}`,
        text: `${who} sent you their brief.\n\n${brief}${note}\n\nReply to this email to follow up. All leads and the full job card are in /admin.`,
      }),
    });
    if (!response.ok) console.error("Lead notification failed.", response.status, await response.text());
  } catch (error) {
    console.error("Lead notification failed.", error);
  }
}
