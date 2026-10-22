import { NextResponse } from "next/server";
import { readAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Unlocks /admin: checks the password and nothing else. The page keeps the password
// in memory and sends it again with each save, so nothing is stored here.
export async function POST(request: Request) {
  const result = await readAdminRequest(request);
  if ("response" in result) return result.response;
  return NextResponse.json({ ok: true });
}
