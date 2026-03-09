/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // For better deployment
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['armigorehab.com'],
  },
  // Add any environment variables needed
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://armigorehab.com',
  },
}

module.exports = nextConfig
