import { NextResponse } from "next/server";
import { endAdminSession, hasAdminSession, startAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Whether this browser is signed in to /admin (the session cookie is httpOnly).
export async function GET() {
  return NextResponse.json({ signedIn: await hasAdminSession() });
}

// Unlocks /admin: checks the password and sets the signed session cookie.
export async function POST(request: Request) {
  return startAdminSession(request);
}

// "Lock" in /admin.
export async function DELETE() {
  await endAdminSession();
  return NextResponse.json({ ok: true });
}
