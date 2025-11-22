/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error messages
  reactStrictMode: true,

  // Allow WebSocket connections for Socket.io
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });
    return config;
  },

  // Transpile workspace packages
  transpilePackages: ['@shared-types'],

  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
};

module.exports = nextConfig;
