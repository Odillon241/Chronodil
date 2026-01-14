import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ⚡ Next.js 16 Proxy (remplace middleware.ts qui est déprécié en v16)
// Gère 2 responsabilités:
// 1. Protection des routes dashboard (authentification via Supabase)
// 2. Détection de la locale utilisateur (i18n)

const DEFAULT_LOCALE = 'fr';
const LOCALE_COOKIE = 'NEXT_LOCALE';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Créer une réponse initiale
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Créer le client Supabase pour le middleware
  // Configuration officielle recommandée par Supabase pour le middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mettre à jour les cookies de la requête
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Créer une nouvelle réponse avec les cookies mis à jour
          response = NextResponse.next({
            request,
          });
          // Appliquer les cookies à la réponse
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Appeler getUser() pour rafraîchir le token et valider la session
  // Ne JAMAIS faire confiance à getSession() dans le middleware (peut être spoofé)
  const { data: { user }, error } = await supabase.auth.getUser();

  // 1. PROTECTION AUTH: Bloquer l'accès non authentifié au dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!user || error) {
      const loginUrl = new URL("/auth/login", request.url);
      // Ajouter l'URL de redirection après login
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Rediriger les utilisateurs connectés depuis les pages auth vers dashboard
  if (pathname.startsWith('/auth/') && user && !error) {
    // Vérifier s'il y a une URL de redirection
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const dashboardUrl = redirectTo && redirectTo.startsWith('/dashboard')
      ? new URL(redirectTo, request.url)
      : new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. DÉTECTION LOCALE: Configurer le cookie de langue
  try {
    // Vérifier si on a déjà un cookie de locale
    const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;

    if (!existingLocale) {
      // Définir la locale par défaut
      response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 an
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
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
