const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚡ React Compiler - Mémoïsation automatique des composants (Next.js 16)
  reactCompiler: true,

  // 🎯 Partial Pre-Rendering - Rendu hybride statique/dynamique (Next.js 16)
  // Note: Désactivé temporairement - nécessite de wrapper les données non-cachées dans <Suspense>
  // TODO: Activer après refactoring des pages pour utiliser <Suspense>
  // cacheComponents: true,

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
        hostname: 'ipghppjjhjbkhuqzqzyq.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Optimisations de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Retirer les console.log en production
  },
}

module.exports = withNextIntl(nextConfig)
