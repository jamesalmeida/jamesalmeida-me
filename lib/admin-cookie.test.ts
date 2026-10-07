import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MODEL_COOKIE_MAX_AGE_SECONDS,
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
    vi.stubEnv("ADMIN_COOKIE_SECRET", "");
    vi.stubEnv("DEFAULT_MODEL", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const now = Date.UTC(2026, 9, 1);
  const forge = (key: string, payload: string) =>
    `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;

  it("round-trips a signed model with an issued-at time", () => {
    const cookie = signModel("claude-sonnet-5-5", now);
    expect(cookie).toMatch(/^claude-sonnet-5-5\.\d+\.[\w-]+$/);
    expect(verifyModelCookie(cookie, now)).toBe("claude-sonnet-5-5");
    expect(resolveAdminModel(signModel("claude-sonnet-5-5"))).toBe("claude-sonnet-5-5");
  });

  it("maps a validly signed legacy Sonnet 4.5 cookie to Sonnet 5.5", () => {
    const legacy = forge("test-password", `claude-sonnet-4-5.${Math.floor(now / 1000)}`);
    expect(verifyModelCookie(legacy, now)).toBe("claude-sonnet-5-5");
  });

  it("handles model ids that contain dots", () => {
    expect(verifyModelCookie(signModel("gpt-5.4", now), now)).toBe("gpt-5.4");
  });

  it("rejects unsigned, tampered and empty cookies", () => {
    const cookie = signModel("gpt-4o", now);
    expect(verifyModelCookie("gpt-4o", now)).toBeNull();
    expect(verifyModelCookie("gpt-4o.", now)).toBeNull();
    expect(verifyModelCookie(`${cookie}x`, now)).toBeNull();
    expect(verifyModelCookie(cookie.replace("gpt-4o", "gpt-4o-mini"), now)).toBeNull();
    expect(verifyModelCookie(cookie.replace(/\.\d+\./, ".9999999999."), now)).toBeNull();
    expect(verifyModelCookie(".abc", now)).toBeNull();
    expect(verifyModelCookie("", now)).toBeNull();
    expect(verifyModelCookie(null, now)).toBeNull();
    expect(verifyModelCookie(undefined, now)).toBeNull();
  });

  it("rejects old-format cookies without an issued-at time", () => {
    expect(verifyModelCookie(forge("test-password", "gpt-4o"), now)).toBeNull();
  });

  it("rejects a non-numeric issued-at time", () => {
    expect(verifyModelCookie(forge("test-password", "gpt-4o.abc"), now)).toBeNull();
  });

  it("rejects a correctly signed unknown model", () => {
    const iat = Math.floor(now / 1000);
    expect(verifyModelCookie(forge("test-password", `evil-model.${iat}`), now)).toBeNull();
  });

  it("rejects a removed model id and falls back to the default", () => {
    const iat = Math.floor(now / 1000);
    const cookie = forge("test-password", `claude-3-5-haiku-latest.${iat}`);
    expect(verifyModelCookie(cookie, now)).toBeNull();
    expect(resolveAdminModel(cookie)).toBe("gpt-5.4");
  });

  it("rejects cookies older than the max age or issued in the future", () => {
    const cookie = signModel("gpt-4o", now);
    const maxAgeMs = MODEL_COOKIE_MAX_AGE_SECONDS * 1000;
    expect(verifyModelCookie(cookie, now + maxAgeMs)).toBe("gpt-4o");
    expect(verifyModelCookie(cookie, now + maxAgeMs + 1000)).toBeNull();
    expect(verifyModelCookie(cookie, now - 60 * 60 * 1000)).toBeNull();
  });

  it("rejects a cookie signed with a different password", () => {
    const cookie = signModel("gpt-4o", now);
    vi.stubEnv("ADMIN_PASSWORD", "rotated-password");
    expect(verifyModelCookie(cookie, now)).toBeNull();
  });

  it("signs with ADMIN_COOKIE_SECRET when set, not the password", () => {
    vi.stubEnv("ADMIN_COOKIE_SECRET", "cookie-secret");
    const cookie = signModel("gpt-4o", now);
    expect(verifyModelCookie(cookie, now)).toBe("gpt-4o");
    const payload = cookie.slice(0, cookie.lastIndexOf("."));
    expect(cookie).toBe(forge("cookie-secret", payload));
    expect(verifyModelCookie(forge("test-password", payload), now)).toBeNull();

    // Rotating the password alone keeps the cookie valid; rotating the secret does not.
    vi.stubEnv("ADMIN_PASSWORD", "rotated-password");
    expect(verifyModelCookie(cookie, now)).toBe("gpt-4o");
    vi.stubEnv("ADMIN_COOKIE_SECRET", "rotated-secret");
    expect(verifyModelCookie(cookie, now)).toBeNull();
  });

  it("ignores cookies and refuses to sign when ADMIN_PASSWORD is unset", () => {
    vi.stubEnv("ADMIN_COOKIE_SECRET", "cookie-secret");
    const cookie = signModel("gpt-4o", now);
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(verifyModelCookie(cookie, now)).toBeNull();
    expect(() => signModel("gpt-4o", now)).toThrow(/ADMIN_PASSWORD/);
  });

  it("falls back to the default model for invalid cookies", () => {
    expect(resolveAdminModel("garbage")).toBe("gpt-5.4");
    vi.stubEnv("DEFAULT_MODEL", "gpt-4o-mini");
    expect(resolveAdminModel(undefined)).toBe("gpt-4o-mini");
  });
});

describe("legacy model ids", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps a legacy DEFAULT_MODEL to its replacement", () => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
    vi.stubEnv("DEFAULT_MODEL", "claude-sonnet-4-5");
    expect(resolveAdminModel(undefined)).toBe("claude-sonnet-5-5");
  });

  it("falls back to gpt-5.4 for unknown DEFAULT_MODEL values", () => {
    vi.stubEnv("DEFAULT_MODEL", "not-a-model");
    expect(resolveAdminModel(undefined)).toBe("gpt-5.4");
  });
});
