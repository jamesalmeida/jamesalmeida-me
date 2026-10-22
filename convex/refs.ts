import { anyApi, type FunctionReference } from "convex/server";

// Function references without generated code (see lib.ts).
export const internal = anyApi as unknown as {
  retention: { purgeExpired: FunctionReference<"mutation", "internal", Record<string, never>> };
};
