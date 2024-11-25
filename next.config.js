/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/static/:path*',
        destination: 'http://localhost:5002/static/:path*'
      },
      {
        source: '/dataclient/:path*', 
        destination: 'http://localhost:5002/static/dataclient/:path*'
      }
    ]
  },
  webpack: (config) => {
    config.cache = false;
    return config
  },
  images: {
    domains: ['localhost'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96]
  },
  experimental: {
    // optimizeCss: true
  }
};

module.exports = nextConfig;