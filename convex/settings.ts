import { v } from "convex/values";
import { assertServer, mutation, query } from "./lib";

// Site settings (Skaffen's avatar). Values are validated on the site's server
// before they get here (lib/avatar-settings.ts).
export const get = query({
  args: { secret: v.string(), key: v.string() },
  handler: async (ctx, { secret, key }) => {
    assertServer(secret);
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row?.value ?? null;
  },
});

export const set = mutation({
  args: { secret: v.string(), key: v.string(), value: v.any() },
  handler: async (ctx, { secret, key, value }) => {
    assertServer(secret);
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (row) await ctx.db.patch(row._id, { value, updatedAt: Date.now() });
    else await ctx.db.insert("settings", { key, value, updatedAt: Date.now() });
  },
});
