// The Vercel Build Command is `npm run vercel-build`. With CONVEX_DEPLOY_KEY (set it
// for Production only), deploy convex/ first, then build the site; without it
// (previews, forks), just build. It says which, so the build log shows it.
import { spawnSync } from "node:child_process";

const deployConvex = Boolean(process.env.CONVEX_DEPLOY_KEY);
console.log(
  deployConvex
    ? "[vercel-build] CONVEX_DEPLOY_KEY is set: deploying convex/ and then building."
    : "[vercel-build] CONVEX_DEPLOY_KEY is not set: building without deploying convex/.",
);

const [command, args] = deployConvex
  ? ["npx", ["convex", "deploy", "--cmd", "npm run build"]]
  : ["npm", ["run", "build"]];

const result = spawnSync(command, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
