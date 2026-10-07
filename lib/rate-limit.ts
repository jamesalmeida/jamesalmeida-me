import "server-only";

// In-memory fixed-window rate limiter. State lives in module scope, so it is
// per serverless instance: a cold start resets it and parallel instances each
// keep their own counts. That is acceptable here as a cheap first line of
// defence (BotID and provider spend caps are the others). No external storage.

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

type Entry = { count: number; resetAt: number };

export class RateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly options: { limit: number; windowMs: number; maxKeys?: number },
  ) {}

  get size(): number {
    return this.entries.size;
  }

  /** Counts one request for `key`. Blocked requests are not counted. */
  check(key: string, now = Date.now()): RateLimitResult {
    const { limit, windowMs } = this.options;
    let entry = this.entries.get(key);

    if (entry && entry.resetAt <= now) {
      this.entries.delete(key);
      entry = undefined;
    }

    if (!entry) {
      this.makeRoom(now);
      // Map keeps insertion order, so the first key always has the oldest window.
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    if (entry.count >= limit) {
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
    }

    entry.count += 1;
    return { ok: true };
  }

  private makeRoom(now: number) {
    const maxKeys = this.options.maxKeys ?? 10_000;
    if (this.entries.size < maxKeys) return;

    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
    while (this.entries.size >= maxKeys) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }
}

const TEN_MINUTES = 10 * 60 * 1000;

export const chatIpLimiter = new RateLimiter({ limit: 30, windowMs: TEN_MINUTES });
// Crude per-instance circuit breaker across all visitors.
export const chatGlobalLimiter = new RateLimiter({ limit: 600, windowMs: 60 * 60 * 1000 });
export const titleIpLimiter = new RateLimiter({ limit: 20, windowMs: TEN_MINUTES });

/** First IP in `x-forwarded-for` (set by Vercel), then `x-real-ip`, then "unknown". */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Checks each limiter in order and stops at the first one that blocks. */
export function checkRateLimits(
  checks: Array<[RateLimiter, string]>,
  now = Date.now(),
): RateLimitResult {
  for (const [limiter, key] of checks) {
    const result = limiter.check(key, now);
    if (!result.ok) return result;
  }
  return { ok: true };
}

export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { error: "Too many requests. Please wait a minute and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
