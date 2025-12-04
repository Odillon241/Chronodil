/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Timeout pour la génération de pages statiques
  staticPageGenerationTimeout: 120,

  // Externaliser les packages Node.js natifs qui ne fonctionnent pas avec Turbopack
  serverExternalPackages: ['web-push', '@node-rs/bcrypt', 'bcrypt'],

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig;
