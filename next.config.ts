import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The portfolio page was removed when the site went client-first.
  async redirects() {
    return [{ source: "/work", destination: "/about", permanent: false }];
  },
  // Do NOT put secrets in `env` here — that inlines them into the client bundle.
  // Keep ANTHROPIC_API_KEY, OPENAI_API_KEY, ADMIN_PASSWORD, and TYPESAFE_API_KEY in:
  //   - local:  .env.local
  //   - prod:   Vercel → Project → Settings → Environment Variables
  // Server routes read them via process.env automatically.
};

export default withBotId(nextConfig);
