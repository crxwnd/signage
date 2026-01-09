/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error messages
  reactStrictMode: true,

  // Allow WebSocket connections for Socket.io
  webpack: (config, { dev, isServer }) => {
    config.externals = config.externals || [];
    config.externals.push({
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });

    // Optimize for Docker dev mode
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },

  // Transpile workspace packages
  transpilePackages: ['@shared-types'],

  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,

  // Backend image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
      // MinIO direct access
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
    // Disable optimization in development for faster loading
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Security headers - Prevent clickjacking, XSS, MIME sniffing
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
};

module.exports = nextConfig;