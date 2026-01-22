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

  // ✅ SÉCURITÉ: Headers HTTP de sécurité (OWASP recommandations)
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/:path*',
        headers: [
          // Protection contre le clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Empêcher le sniffing MIME type
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Protection XSS du navigateur
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Politique de référent stricte
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (désactiver les fonctionnalités sensibles)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // HSTS - Forcer HTTPS (1 an avec includeSubDomains)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              "media-src 'self' blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

export default nextConfig;
