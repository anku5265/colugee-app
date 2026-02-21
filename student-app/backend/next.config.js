/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API routes only - no pages
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
