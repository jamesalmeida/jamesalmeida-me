import { describe, expect, it } from "vitest";
import { describeStoreError, normalizeConvexDeploymentUrl } from "./store.server";

describe("normalizeConvexDeploymentUrl", () => {
  it("drops a trailing slash so the client does not call //api/query", () => {
    expect(normalizeConvexDeploymentUrl("https://happy-animal-123.convex.cloud/")).toBe(
      "https://happy-animal-123.convex.cloud",
    );
    expect(normalizeConvexDeploymentUrl("  https://happy-animal-123.convex.cloud/api/query  ")).toBe(
      "https://happy-animal-123.convex.cloud",
    );
  });

  it("treats a blank value as unset", () => {
    expect(normalizeConvexDeploymentUrl(undefined)).toBeNull();
    expect(normalizeConvexDeploymentUrl("  ")).toBeNull();
  });
});

describe("describeStoreError", () => {
  it("explains the common Convex setup mistakes", () => {
    expect(describeStoreError(new Error("[Request ID: x] Server Error\nCould not find public function for 'admin:dashboard'"))).toMatch(/aren't deployed/);
    expect(describeStoreError(new Error("Uncaught Error: Unauthorized"))).toMatch(/CONVEX_SERVER_SECRET/);
    expect(describeStoreError({ data: { code: "unauthorized" }, message: "[Request ID: x] Server Error" })).toMatch(
      /CONVEX_SERVER_SECRET/,
    );
    expect(describeStoreError(new TypeError("fetch failed"))).toMatch(/CONVEX_URL/);
    expect(describeStoreError(new Error(""))).toMatch(/trailing slash/);
    expect(describeStoreError(new Error("[Request ID: x] Server Error"))).toMatch(/Logs/);
    expect(describeStoreError("x".repeat(400))).toHaveLength(300);
  });
});
