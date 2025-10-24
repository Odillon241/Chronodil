const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚡ React Compiler - Mémoïsation automatique des composants (Next.js 16)
  reactCompiler: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 🚀 Turbopack filesystem caching - Améliore la vitesse de compilation entre les redémarrages
    turbopackFileSystemCacheForDev: true,
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
