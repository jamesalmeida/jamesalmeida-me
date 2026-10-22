import { describe, expect, it } from "vitest";
import { describeStoreError } from "./store.server";

describe("describeStoreError", () => {
  it("explains the common Convex setup mistakes", () => {
    expect(describeStoreError(new Error("[Request ID: x] Server Error\nCould not find public function for 'admin:dashboard'"))).toMatch(/aren't deployed/);
    expect(describeStoreError(new Error("Uncaught Error: Unauthorized"))).toMatch(/CONVEX_SERVER_SECRET/);
    expect(describeStoreError(new TypeError("fetch failed"))).toMatch(/CONVEX_URL/);
    expect(describeStoreError("x".repeat(400))).toHaveLength(300);
  });
});
