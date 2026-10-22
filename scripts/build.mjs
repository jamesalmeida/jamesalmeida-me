// `npm run build`. With CONVEX_DEPLOY_KEY (set it in Vercel for Production only),
// deploy convex/ first and then build the site; without it (CI, previews, local),
// just build. It says which, so the build log shows it.
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
