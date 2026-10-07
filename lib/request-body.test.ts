import { describe, expect, it } from "vitest";
import { readBodyWithLimit } from "./request-body";

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api", { method: "POST", body, headers });

describe("readBodyWithLimit", () => {
  it("returns the text when under the limit", async () => {
    expect(await readBodyWithLimit(post("hello"), 10)).toEqual({ ok: true, text: "hello" });
  });

  it("rejects early on a Content-Length over the limit", async () => {
    const req = post("tiny", { "content-length": "999" });
    expect(await readBodyWithLimit(req, 10)).toEqual({ ok: false });
    expect(req.bodyUsed).toBe(false);
  });

  it("compares UTF-8 bytes, not UTF-16 code units", async () => {
    // 4 characters, 12 bytes in UTF-8.
    expect(await readBodyWithLimit(post("€€€€"), 10)).toEqual({ ok: false });
    expect(await readBodyWithLimit(post("€€€"), 10)).toEqual({ ok: true, text: "€€€" });
  });
});
