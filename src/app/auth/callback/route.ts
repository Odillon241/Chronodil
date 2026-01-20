import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Route de callback pour Supabase Auth
 * Gere :
 * - Confirmation d'email apres inscription
 * - Liens magiques (magic links)
 * - Reinitialisation de mot de passe
 * - OAuth callbacks
 */

/**
 * Valide et sanitise l'URL de redirection pour prevenir les Open Redirect attacks.
 *
 * Regles de securite:
 * 1. L'URL doit etre relative (commencer par /)
 * 2. L'URL ne doit pas contenir de protocole (http://, https://, //)
 * 3. L'URL doit pointer vers un chemin autorise (/dashboard, /auth)
 * 4. En cas d'URL invalide, retourne /dashboard par defaut
 *
 * @param url - L'URL de redirection a valider
 * @param requestUrl - L'URL de la requete pour validation d'origine
 * @returns L'URL validee ou /dashboard par defaut
 */
function validateRedirectUrl(url: string | null, requestUrl: URL): string {
  const DEFAULT_REDIRECT = '/dashboard'

  // Si pas d'URL fournie, retourner la redirection par defaut
  if (!url) {
    return DEFAULT_REDIRECT
  }

  // Nettoyer l'URL des espaces
  const cleanUrl = url.trim()

  // Bloquer les URLs vides apres nettoyage
  if (!cleanUrl) {
    return DEFAULT_REDIRECT
  }

  // Bloquer les URLs avec protocole (http://, https://, //, javascript:, data:, etc.)
  // Regex pour detecter les schemas de protocole
  const protocolPattern = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/
  if (protocolPattern.test(cleanUrl)) {
    console.warn('[Auth Callback] Blocked redirect with protocol:', cleanUrl)
    return DEFAULT_REDIRECT
  }

  // Bloquer les URLs qui ne commencent pas par /
  if (!cleanUrl.startsWith('/')) {
    console.warn('[Auth Callback] Blocked non-relative redirect:', cleanUrl)
    return DEFAULT_REDIRECT
  }

  // Bloquer les chemins avec double slash au debut (//evil.com)
  if (cleanUrl.startsWith('//')) {
    console.warn('[Auth Callback] Blocked protocol-relative redirect:', cleanUrl)
    return DEFAULT_REDIRECT
  }

  // Bloquer les chemins avec backslash (certains navigateurs interpretent \\ comme //)
  if (cleanUrl.includes('\\')) {
    console.warn('[Auth Callback] Blocked backslash in redirect:', cleanUrl)
    return DEFAULT_REDIRECT
  }

  // Parser l'URL pour extraire le chemin
  try {
    // Construire une URL complete pour la parser correctement
    const fullUrl = new URL(cleanUrl, requestUrl.origin)

    // Verifier que l'origine est la meme (protection contre les URLs absolues)
    if (fullUrl.origin !== requestUrl.origin) {
      console.warn('[Auth Callback] Blocked cross-origin redirect:', cleanUrl)
      return DEFAULT_REDIRECT
    }

    // Liste blanche des chemins autorises
    const allowedPrefixes = ['/dashboard', '/auth']
    const pathname = fullUrl.pathname

    // Verifier que le chemin commence par un prefixe autorise
    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix))

    if (!isAllowed) {
      console.warn('[Auth Callback] Blocked unauthorized path:', pathname)
      return DEFAULT_REDIRECT
    }

    // Retourner le chemin + query string + hash (sans l'origine)
    return fullUrl.pathname + fullUrl.search + fullUrl.hash
  } catch (error) {
    console.warn('[Auth Callback] Invalid redirect URL:', cleanUrl, error)
    return DEFAULT_REDIRECT
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const nextParam = requestUrl.searchParams.get('next')

  // Valider l'URL de redirection pour prevenir les Open Redirect attacks
  const next = validateRedirectUrl(nextParam, requestUrl)

  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Gérer les erreurs de callback
  if (error) {
    console.error('[Auth Callback] Error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url),
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Ignoré dans les Server Components
          }
        },
      },
    },
  )

  // Cas 1: Code PKCE (OAuth, Magic Link, Email confirmation)
  if (code) {
    console.log('[Auth Callback] Exchanging code for session...')

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError.message)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url),
      )
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
        })
        console.log('[Auth Callback] User synced to Prisma:', data.user.id)
      } catch (prismaError) {
        console.error('[Auth Callback] Prisma sync error:', prismaError)
        // Ne pas bloquer la redirection
      }
    }

    console.log('[Auth Callback] Session established for userId:', data.user?.id)

    // Redirection spéciale pour la réinitialisation de mot de passe
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', request.url))
    }

    return NextResponse.redirect(new URL(next, request.url))
  }

  // Cas 2: Token hash (ancienne méthode, OTP)
  if (token_hash && type) {
    console.log('[Auth Callback] Verifying OTP with token_hash, type:', type)

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (verifyError) {
      console.error('[Auth Callback] OTP verify error:', verifyError.message)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(verifyError.message)}`, request.url),
      )
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
        })
      } catch (prismaError) {
        console.error('[Auth Callback] Prisma sync error:', prismaError)
      }
    }

    // Redirection selon le type
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', request.url))
    }

    return NextResponse.redirect(new URL(next, request.url))
  }

  // Aucun code ni token - rediriger vers login
  console.warn('[Auth Callback] No code or token_hash provided')
  return NextResponse.redirect(new URL('/auth/login', request.url))
}

export async function POST(_request: NextRequest) {
  // Pour les webhooks ou autres besoins POST
  return NextResponse.json({ message: 'Auth callback route' })
}
