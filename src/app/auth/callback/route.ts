import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Route de callback pour Supabase Auth
 * Gère :
 * - Confirmation d'email après inscription
 * - Liens magiques (magic links)
 * - Réinitialisation de mot de passe
 * - OAuth callbacks
 */

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Gérer les erreurs de callback
  if (error) {
    console.error('[Auth Callback] Error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignoré dans les Server Components
          }
        },
      },
    }
  );

  // Cas 1: Code PKCE (OAuth, Magic Link, Email confirmation)
  if (code) {
    console.log('[Auth Callback] Exchanging code for session...');
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError.message);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // Synchroniser l'utilisateur avec Prisma
    if (data.user) {
      try {
        await prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            emailVerified: !!data.user.email_confirmed_at,
            updatedAt: new Date(),
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            role: data.user.user_metadata?.role || 'EMPLOYEE',
            emailVerified: !!data.user.email_confirmed_at,
            updatedAt: new Date(),
          },
        });
        console.log('[Auth Callback] User synced to Prisma:', data.user.email);
      } catch (prismaError) {
        console.error('[Auth Callback] Prisma sync error:', prismaError);
        // Ne pas bloquer la redirection
      }
    }

    console.log('[Auth Callback] Session established for:', data.user?.email);
    
    // Redirection spéciale pour la réinitialisation de mot de passe
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  // Cas 2: Token hash (ancienne méthode, OTP)
  if (token_hash && type) {
    console.log('[Auth Callback] Verifying OTP with token_hash, type:', type);
    
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (verifyError) {
      console.error('[Auth Callback] OTP verify error:', verifyError.message);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(verifyError.message)}`, request.url)
      );
    }

    // Synchroniser l'utilisateur avec Prisma
    if (data.user) {
      try {
        await prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            emailVerified: !!data.user.email_confirmed_at,
            updatedAt: new Date(),
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            role: data.user.user_metadata?.role || 'EMPLOYEE',
            emailVerified: !!data.user.email_confirmed_at,
            updatedAt: new Date(),
          },
        });
      } catch (prismaError) {
        console.error('[Auth Callback] Prisma sync error:', prismaError);
      }
    }

    // Redirection selon le type
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  // Aucun code ni token - rediriger vers login
  console.warn('[Auth Callback] No code or token_hash provided');
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

export async function POST(request: NextRequest) {
  // Pour les webhooks ou autres besoins POST
  return NextResponse.json({ message: 'Auth callback route' });
}
