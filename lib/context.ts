import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

export const getContext = cache((): string => {
  return readFileSync(join(process.cwd(), "data", "context.md"), "utf8");
});
