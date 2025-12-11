/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Note: Next.js API routes in /app/api take precedence over rewrites
      // So /app/api/auth/signin/route.ts will handle /api/auth/signin
      // Only routes that don't exist in Next.js will be rewritten to external backend
      {
        source: '/api/:path*',
        // destination: 'http://localhost:4000/api/:path*',
        destination: 'https://loan-app-backend-9c31.onrender.com/api/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;