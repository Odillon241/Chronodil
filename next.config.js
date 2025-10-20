const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimisations de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Retirer les console.log en production
  },
}

module.exports = withNextIntl(nextConfig)
