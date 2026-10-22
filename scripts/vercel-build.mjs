// Vercel runs `npm run vercel-build` instead of `npm run build` when it exists.
// With CONVEX_DEPLOY_KEY (set it for Production only), deploy convex/ first, then
// build the site; without it (previews, forks), just build.
import { spawnSync } from "node:child_process";

const command = process.env.CONVEX_DEPLOY_KEY
  ? ["npx", ["convex", "deploy", "--cmd", "npm run build"]]
  : ["npm", ["run", "build"]];

const result = spawnSync(command[0], command[1], { stdio: "inherit" });
process.exit(result.status ?? 1);
