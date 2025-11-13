  // ⚡ Plugin next-intl activé pour Next.js 16
  import createNextIntlPlugin from 'next-intl/plugin';

  // Pointer vers le fichier de configuration i18n
  const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,

    // Ignorer les erreurs de prerendering
    staticPageGenerationTimeout: 120,

    experimental: {
      serverActions: {
        bodySizeLimit: '2mb',
      },
      // Désactiver le PPR qui cause des problèmes
      ppr: false,
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

  // Exporter la configuration avec le plugin next-intl
  export default withNextIntl(nextConfig);