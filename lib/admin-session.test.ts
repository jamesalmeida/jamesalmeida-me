import { describe, expect, it } from "vitest";
import {
  contentBlurred,
  contentHidden,
  keepsContentMounted,
  sessionAfterCheck,
  sessionAfterExpiry,
  sessionAfterLock,
} from "./admin-session";

describe("admin session", () => {
  it("starts locked or open from the verify check", () => {
    expect(sessionAfterCheck(false)).toBe("locked");
    expect(sessionAfterCheck(true)).toBe("open");
  });

  it("keeps settings mounted but blurred when a save expires the session", () => {
    const expired = sessionAfterExpiry();
    expect(keepsContentMounted(expired)).toBe(true);
    expect(contentHidden(expired)).toBe(false);
    expect(contentBlurred(expired)).toBe(true);
  });

  it("only locks after the session cookie is cleared", () => {
    expect(sessionAfterLock(false)).toBe("open");
    expect(sessionAfterLock(true)).toBe("locked");
    expect(contentHidden("locked")).toBe(true);
    expect(keepsContentMounted("locked")).toBe(false);
  });
});
