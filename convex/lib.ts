import {
  internalMutationGeneric,
  mutationGeneric,
  queryGeneric,
  type DataModelFromSchemaDefinition,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import type schema from "./schema";

// Typed function builders, the same as convex/_generated/server would export. This
// repo doesn't depend on generated code, so it typechecks and builds without a
// Convex deployment (CI, previews, local dev).
type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export const query = queryGeneric as QueryBuilder<DataModel, "public">;
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
export const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, "internal">;

export const DAY_MS = 24 * 60 * 60 * 1000;
export const RETENTION_MS = 90 * DAY_MS;

// Every public function is called only by the site's server (lib/store.server.ts),
// which passes CONVEX_SERVER_SECRET. Set the same value in the Convex dashboard.
export function assertServer(secret: string) {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || secret !== expected) throw new Error("Unauthorized");
}
