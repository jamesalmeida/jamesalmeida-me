import "server-only";

export type LimitedBody = { ok: true; text: string } | { ok: false };

/**
 * Reads the request body as text, rejecting it when it exceeds `maxBytes`.
 * A declared Content-Length over the limit is rejected before reading; the
 * UTF-8 byte length is checked after, since the header can be absent or wrong.
 */
export async function readBodyWithLimit(req: Request, maxBytes: number): Promise<LimitedBody> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false };

  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) return { ok: false };
  return { ok: true, text };
}

export function payloadTooLargeResponse(): Response {
  return Response.json({ error: "Payload too large." }, { status: 413 });
}
