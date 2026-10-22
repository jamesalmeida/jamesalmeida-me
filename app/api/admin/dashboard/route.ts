import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { isStoreConfigured, storeApi, storeQuery } from "@/lib/store.server";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGES = [7, 30, 90];

// Funnel, drop-off, recent conversations, feedback and leads for /admin.
export async function GET(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  if (!isStoreConfigured()) return NextResponse.json({ configured: false });

  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days = RANGES.includes(requested) ? requested : 30;
  try {
    const [dashboard, leads] = await Promise.all([
      storeQuery(storeApi.admin.dashboard, { since: Date.now() - days * DAY_MS }),
      storeQuery(storeApi.admin.leads, {}),
    ]);
    return NextResponse.json({ configured: true, days, dashboard, leads });
  } catch (error) {
    console.error("Loading the dashboard failed.", error);
    return NextResponse.json({ error: "Could not load the dashboard." }, { status: 503 });
  }
}
