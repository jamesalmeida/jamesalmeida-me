/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['vercel.app'], // Add domains for external images if needed
  },
  // Optimize for Vercel deployment
  output: 'standalone',
}

module.exports = nextConfig
