import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { parseId } from "@/lib/analytics";
import { describeStoreError, storeApi, storeQuery } from "@/lib/store.server";

export const dynamic = "force-dynamic";

// One stored transcript for /admin: GET ?id=<conversationId>.
export async function GET(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const conversationId = parseId(new URL(request.url).searchParams.get("id"));
  if (!conversationId) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  try {
    const conversation = await storeQuery(storeApi.admin.conversation, { conversationId });
    if (!conversation) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Loading a conversation failed.", error);
    return NextResponse.json({ error: "Could not load the conversation.", detail: describeStoreError(error) }, { status: 503 });
  }
}
