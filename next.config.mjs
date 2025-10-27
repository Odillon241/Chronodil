// ⚡ Plugin next-intl restauré avec configuration STATIQUE compatible Cache Components
// Le fichier src/i18n.ts charge la locale 'fr' de manière statique (pas de cookies/headers)

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚡ React Compiler - Mémoïsation automatique des composants (Next.js 16)
  reactCompiler: true,

  // 🎯 Cache Components - Rendu hybride statique/dynamique (Next.js 16)
  // ✅ ACTIVÉ - Migration vers système i18n custom compatible
  // next-intl utilisé uniquement pour NextIntlClientProvider (client-side)
  // Chargement des messages géré par src/lib/i18n.ts (compatible Cache Components)
  cacheComponents: true,

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

export default withNextIntl(nextConfig);
