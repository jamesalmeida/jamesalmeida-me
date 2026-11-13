import { describe, expect, it } from "vitest";
import { composerInput, sendsExample, showExample } from "./composer-input";

describe("composer input", () => {
  it("separates empty, blank and typed", () => {
    expect(composerInput("")).toBe("empty");
    expect(composerInput("   ")).toBe("blank");
    expect(composerInput(" hi ")).toBe("typed");
  });

  it("shows the example for whitespace too", () => {
    expect(showExample("empty")).toBe(true);
    expect(showExample("blank")).toBe(true);
    expect(showExample("typed")).toBe(false);
  });

  it("sends the example only while the example is visible", () => {
    expect(sendsExample("empty")).toBe(true);
    expect(sendsExample("blank")).toBe(true);
    expect(sendsExample("typed")).toBe(false);
  });
});
