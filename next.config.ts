import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do NOT put secrets in `env` here — that inlines them into the client bundle.
  // Keep ANTHROPIC_API_KEY, OPENAI_API_KEY, and ADMIN_PASSWORD in:
  //   - local:  .env.local
  //   - prod:   Vercel → Project → Settings → Environment Variables
  // Server routes read them via process.env automatically.
};

export default nextConfig;
