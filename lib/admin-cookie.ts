import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getDefaultModelId, normalizeModelId, type ModelId } from "@/lib/models";

export const MODEL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
// Tolerate small clock differences between serverless instances.
const MAX_CLOCK_SKEW_SECONDS = 5 * 60;

// ADMIN_COOKIE_SECRET is preferred so a leaked cookie can't be used to crack
// the password offline. Falls back to ADMIN_PASSWORD when unset. Without
// ADMIN_PASSWORD the admin panel is off, so nothing is signed or honoured.
function signingKey(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return process.env.ADMIN_COOKIE_SECRET || password;
}

function sign(key: string, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  const length = Math.max(aBuf.length, bBuf.length, 1);
  const aPad = Buffer.alloc(length);
  const bPad = Buffer.alloc(length);
  aBuf.copy(aPad);
  bBuf.copy(bPad);
  return timingSafeEqual(aPad, bPad) && aBuf.length === bBuf.length;
}

/** Returns `${model}.${issuedAtSeconds}.${base64url HMAC}`. */
export function signModel(model: ModelId, now = Date.now()): string {
  const key = signingKey();
  if (!key) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }
  const payload = `${model}.${Math.floor(now / 1000)}`;
  return `${payload}.${sign(key, payload)}`;
}

export function verifyModelCookie(value?: string | null, now = Date.now()): ModelId | null {
  const key = signingKey();
  if (!key || !value) return null;

  // Model ids can contain dots (gpt-5.4), so split from the right.
  const sigDot = value.lastIndexOf(".");
  if (sigDot <= 0) return null;
  const payload = value.slice(0, sigDot);
  const signature = value.slice(sigDot + 1);

  const iatDot = payload.lastIndexOf(".");
  if (iatDot <= 0) return null;
  // A legacy id (e.g. a retired model) maps to its replacement after the
  // signature over the original payload checks out.
  const model = normalizeModelId(payload.slice(0, iatDot));
  const issuedAtRaw = payload.slice(iatDot + 1);
  if (!model || !/^\d{1,12}$/.test(issuedAtRaw)) return null;

  const expected = sign(key, payload);
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return null;
  }
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null;

  const age = Math.floor(now / 1000) - Number(issuedAtRaw);
  if (age > MODEL_COOKIE_MAX_AGE_SECONDS || age < -MAX_CLOCK_SKEW_SECONDS) return null;
  return model;
}

export function resolveAdminModel(cookieValue?: string | null): ModelId {
  return verifyModelCookie(cookieValue) ?? getDefaultModelId();
}
