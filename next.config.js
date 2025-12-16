/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Get the backend URL from environment variable, fallback to new backend
    const backendUrl = process.env.BACKEND_URL || 'http://loanapp.alwaysdata.net';

    return [
      // IMPORTANT: Next.js API routes in /app/api should take precedence
      // However, to be safe, we exclude routes that exist in Next.js
      // Only rewrite routes that don't exist in Next.js to external backend
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
        // This rewrite will only apply if the route doesn't exist in Next.js
        // Next.js API routes in /app/api take precedence
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