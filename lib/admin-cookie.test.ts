import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveAdminModel,
  signModel,
  timingSafeEqualString,
  verifyModelCookie,
} from "./admin-cookie";

describe("timingSafeEqualString", () => {
  it("compares strings of equal and unequal length", () => {
    expect(timingSafeEqualString("secret", "secret")).toBe(true);
    expect(timingSafeEqualString("secret", "secreT")).toBe(false);
    expect(timingSafeEqualString("secret", "secret1")).toBe(false);
    expect(timingSafeEqualString("secret", "")).toBe(false);
    expect(timingSafeEqualString("", "")).toBe(true);
  });

  it("does not treat a zero-padded string as equal", () => {
    expect(timingSafeEqualString("abc", "abc\0")).toBe(false);
  });
});

describe("model cookie", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
    vi.stubEnv("DEFAULT_MODEL", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a signed model", () => {
    const cookie = signModel("claude-sonnet-4-5");
    expect(cookie.startsWith("claude-sonnet-4-5.")).toBe(true);
    expect(verifyModelCookie(cookie)).toBe("claude-sonnet-4-5");
    expect(resolveAdminModel(cookie)).toBe("claude-sonnet-4-5");
  });

  it("rejects unsigned, tampered and empty cookies", () => {
    const cookie = signModel("gpt-4o");
    expect(verifyModelCookie("gpt-4o")).toBeNull();
    expect(verifyModelCookie("gpt-4o.")).toBeNull();
    expect(verifyModelCookie(`${cookie}x`)).toBeNull();
    expect(verifyModelCookie(cookie.replace("gpt-4o", "gpt-4o-mini"))).toBeNull();
    expect(verifyModelCookie(".abc")).toBeNull();
    expect(verifyModelCookie("")).toBeNull();
    expect(verifyModelCookie(null)).toBeNull();
    expect(verifyModelCookie(undefined)).toBeNull();
  });

  it("rejects a correctly signed unknown model", () => {
    const signature = createHmac("sha256", "test-password").update("evil-model").digest("base64url");
    expect(verifyModelCookie(`evil-model.${signature}`)).toBeNull();
  });

  it("rejects a cookie signed with a different password", () => {
    const cookie = signModel("gpt-4o");
    vi.stubEnv("ADMIN_PASSWORD", "rotated-password");
    expect(verifyModelCookie(cookie)).toBeNull();
  });

  it("ignores cookies and refuses to sign when ADMIN_PASSWORD is unset", () => {
    const cookie = signModel("gpt-4o");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(verifyModelCookie(cookie)).toBeNull();
    expect(() => signModel("gpt-4o")).toThrow(/ADMIN_PASSWORD/);
  });

  it("falls back to the default model for invalid cookies", () => {
    expect(resolveAdminModel("garbage")).toBe("gpt-5.4");
    vi.stubEnv("DEFAULT_MODEL", "gpt-4o-mini");
    expect(resolveAdminModel(undefined)).toBe("gpt-4o-mini");
  });
});
