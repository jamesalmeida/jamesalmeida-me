import { NextResponse } from "next/server";
import { readAdminJson, requireAdminSession } from "@/lib/admin-auth";
import { storeApi, storeMutation } from "@/lib/store.server";

export const dynamic = "force-dynamic";

// Deletes a lead from /admin: DELETE { id }.
export async function DELETE(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const result = await readAdminJson(request);
  if ("response" in result) return result.response;
  const { id } = result.body;
  if (typeof id !== "string" || !/^[a-z0-9]{1,64}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  try {
    await storeMutation(storeApi.leads.remove, { id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deleting a lead failed.", error);
    return NextResponse.json({ error: "Could not delete the lead." }, { status: 503 });
  }
}
