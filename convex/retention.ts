import { internal } from "./refs";
import { internalMutation } from "./lib";

const TABLES = ["messages", "conversations", "events", "feedback"] as const;
const BATCH = 500;

// Deletes rows past their expiresAt (90 days, see lib.ts). Runs daily from crons.ts
// and reschedules itself until a pass finds nothing left.
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deleted = 0;
    for (const table of TABLES) {
      const expired = await ctx.db
        .query(table)
        .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
        .take(BATCH);
      for (const row of expired) await ctx.db.delete(row._id);
      deleted += expired.length;
    }
    if (deleted > 0) await ctx.scheduler.runAfter(0, internal.retention.purgeExpired, {});
  },
});
