/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
<<<<<<< HEAD
  swcMinify: false,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
=======
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5002/api/:path*'
      },
      {
        source: '/static/:path*',
        destination: 'http://localhost:5002/static/:path*'
      },
      {
        source: '/dataclient/:path*',
        destination: '/api/storage/:path*'
      }
    ]
  },
  webpack: (config, { isServer }) => {
    config.cache = false;
    if (!isServer) {
      config.watchOptions = {
        ignored: ['**/.next/**', '**/node_modules/**', '**/.git/**']
      }
    }
    return config
  },
  images: {
    domains: ['localhost'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  experimental: {
    // optimizeCss: true,
    outputFileTracingExcludes: {
      '*': [
        'node_modules/**/*',
        'storage/**/*'
      ],
    },
    appDir: true,
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  async redirects() {
    return [
      // Kiểm tra các redirect của bạn
    ]
>>>>>>> d9dc322e7dd5c6f75b65786234d2ae7f64044279
  }
}

module.exports = nextConfig 