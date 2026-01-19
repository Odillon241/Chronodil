import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Fetch avec retry et backoff exponentiel pour les erreurs réseau transitoires
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error: unknown) {
      lastError = error as Error;

      // Ne retry que sur les erreurs réseau transitoires
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('fetch failed') ||
         error.message.includes('ECONNRESET') ||
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('ECONNREFUSED') ||
         error.cause?.toString().includes('ECONNRESET'));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Backoff exponentiel: 500ms, 1s, 2s
      const delay = Math.pow(2, attempt) * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Crée un client Supabase pour les actions serveur
 * Utilise les cookies pour l'authentification
 * Inclut un système de retry pour les erreurs réseau transitoires
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // La méthode `setAll` a été appelée depuis un Server Component.
            // Cela peut être ignoré si vous n'avez pas besoin de définir de cookies.
          }
        },
      },
      global: {
        fetch: fetchWithRetry,
      },
    }
  );
}

