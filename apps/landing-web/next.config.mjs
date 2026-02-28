// apps/landing-web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC if issues persist
  swcMinify: false,
  
  // Your existing rewrites
  async rewrites() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002";
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;