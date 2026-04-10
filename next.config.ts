import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    // Ensure these are available at build time
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    DEFAULT_MODEL: process.env.DEFAULT_MODEL,
  },
};

export default nextConfig;