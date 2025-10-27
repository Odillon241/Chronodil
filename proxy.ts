import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ⚡ Next.js 16 Best Practice: proxy.ts (remplace middleware.ts)
// Gère 2 responsabilités:
// 1. Protection des routes dashboard (authentification)
// 2. Détection de la locale utilisateur (i18n)

const DEFAULT_LOCALE = 'fr';
const LOCALE_COOKIE = 'NEXT_LOCALE';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. PROTECTION AUTH: Vérifier l'authentification pour les routes dashboard
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = getSessionCookie(request);

    // Si pas de session, rediriger vers login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // 2. DÉTECTION LOCALE: Configurer le cookie de langue
  const response = NextResponse.next();

  try {
    // Récupérer la session utilisateur (si disponible)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user?.id) {
      // Vérifier si on a déjà un cookie de locale
      const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;

      if (!existingLocale) {
        // Récupérer la langue de l'utilisateur depuis la DB
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { language: true },
        });

        const userLocale = user?.language || DEFAULT_LOCALE;

        // Stocker la locale dans un cookie
        response.cookies.set(LOCALE_COOKIE, userLocale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365, // 1 an
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    } else {
      // Pas de session, utiliser la locale par défaut si pas de cookie
      const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
      if (!existingLocale) {
        response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    }
  } catch (error) {
    console.error('[Proxy] Error setting locale:', error);
    // En cas d'erreur, définir la locale par défaut si pas de cookie
    if (!request.cookies.get(LOCALE_COOKIE)?.value) {
      response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
  }

  return response;
}

// Configuration: Exécuter le proxy sur toutes les routes sauf les assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
