// `npm run build`. With CONVEX_DEPLOY_KEY, deploy convex/ and then build the site.
// A production deploy key (Vercel Production only) updates production. A preview
// deploy key (Vercel Preview only) creates a Convex deployment for that git branch.
// Without a key (CI, local, a preview that isn't wired up) this only builds the site.
// It says which, so the build log shows it.
import { spawnSync } from "node:child_process";

const deployConvex = Boolean(process.env.CONVEX_DEPLOY_KEY);
console.log(
  deployConvex
    ? "[build] CONVEX_DEPLOY_KEY is set: deploying convex/ and then building."
    : "[build] CONVEX_DEPLOY_KEY is not set: building without deploying convex/.",
);

const [command, args] = deployConvex
  ? ["npx", ["convex", "deploy", "--cmd", "npm run build:next"]]
  : ["npm", ["run", "build:next"]];

const result = spawnSync(command, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
