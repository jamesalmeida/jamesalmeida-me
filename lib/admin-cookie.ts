import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getDefaultModelId, isModelId, type ModelId } from "@/lib/models";

function passwordKey(): string | null {
  const key = process.env.ADMIN_PASSWORD;
  return key ? key : null;
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

export function signModel(model: ModelId): string {
  const key = passwordKey();
  if (!key) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }
  const signature = createHmac("sha256", key).update(model).digest("base64url");
  return `${model}.${signature}`;
}

export function verifyModelCookie(value?: string | null): ModelId | null {
  const key = passwordKey();
  if (!key || !value) return null;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;

  const model = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!isModelId(model)) return null;

  const expected = createHmac("sha256", key).update(model).digest("base64url");
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return null;
  }
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null;
  return model;
}

export function resolveAdminModel(cookieValue?: string | null): ModelId {
  return verifyModelCookie(cookieValue) ?? getDefaultModelId();
}
