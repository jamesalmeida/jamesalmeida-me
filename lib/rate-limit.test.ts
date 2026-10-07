import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimits, getClientIp, RateLimiter, rateLimitedResponse } from "./rate-limit";

const WINDOW = 10 * 60 * 1000;

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then blocks", () => {
    const limiter = new RateLimiter({ limit: 3, windowMs: WINDOW });
    expect(limiter.check("1.1.1.1").ok).toBe(true);
    expect(limiter.check("1.1.1.1").ok).toBe(true);
    expect(limiter.check("1.1.1.1").ok).toBe(true);
    expect(limiter.check("1.1.1.1").ok).toBe(false);
    expect(limiter.check("2.2.2.2").ok).toBe(true);
  });

  it("returns a sensible Retry-After", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: WINDOW });
    limiter.check("ip");
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(limiter.check("ip")).toEqual({ ok: false, retryAfterSeconds: 6 * 60 });

    vi.advanceTimersByTime(6 * 60 * 1000 - 500);
    expect(limiter.check("ip")).toEqual({ ok: false, retryAfterSeconds: 1 });
  });

  it("resets after the window", () => {
    const limiter = new RateLimiter({ limit: 2, windowMs: WINDOW });
    limiter.check("ip");
    limiter.check("ip");
    expect(limiter.check("ip").ok).toBe(false);

    vi.advanceTimersByTime(WINDOW);
    expect(limiter.check("ip").ok).toBe(true);
    expect(limiter.check("ip").ok).toBe(true);
    expect(limiter.check("ip").ok).toBe(false);
  });

  it("does not count blocked requests", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: WINDOW });
    limiter.check("ip");
    for (let i = 0; i < 50; i += 1) limiter.check("ip");
    vi.advanceTimersByTime(WINDOW);
    expect(limiter.check("ip").ok).toBe(true);
  });

  it("keeps the map bounded, evicting expired entries and then the oldest", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: WINDOW, maxKeys: 3 });
    limiter.check("a");
    limiter.check("b");
    vi.advanceTimersByTime(WINDOW);
    limiter.check("c");
    limiter.check("d");
    // "a" and "b" expired and were swept to make room.
    expect(limiter.size).toBe(2);

    limiter.check("e");
    limiter.check("f");
    expect(limiter.size).toBe(3);
    // "c" was the oldest live entry, so it was evicted and is allowed again.
    expect(limiter.check("c").ok).toBe(true);
    expect(limiter.check("f").ok).toBe(false);

    for (let i = 0; i < 1000; i += 1) limiter.check(`ip-${i}`);
    expect(limiter.size).toBe(3);
  });
});

describe("checkRateLimits", () => {
  it("stops at the first blocking limiter", () => {
    const perIp = new RateLimiter({ limit: 1, windowMs: WINDOW });
    const global = new RateLimiter({ limit: 2, windowMs: WINDOW });
    expect(checkRateLimits([[perIp, "a"], [global, "global"]]).ok).toBe(true);
    expect(checkRateLimits([[perIp, "a"], [global, "global"]]).ok).toBe(false);
    expect(checkRateLimits([[perIp, "b"], [global, "global"]]).ok).toBe(true);
    expect(checkRateLimits([[perIp, "c"], [global, "global"]]).ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry, then x-real-ip, then unknown", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1", "x-real-ip": "5.6.7.8" }))).toBe(
      "1.2.3.4",
    );
    expect(getClientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimitedResponse", () => {
  it("returns 429 JSON with Retry-After", async () => {
    const response = rateLimitedResponse(42);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(await response.json()).toHaveProperty("error");
  });
});
