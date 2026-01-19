import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern pour éviter les connexions multiples
let supabaseClient: SupabaseClient | null = null;

/**
 * Fetch avec retry et backoff exponentiel pour les erreurs réseau transitoires
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const maxRetries = 3;
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
         error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('ECONNRESET'));

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

export function createClient(): SupabaseClient {
  // Retourner l'instance existante si elle existe déjà
  if (supabaseClient) {
    return supabaseClient;
  }

  // Créer une nouvelle instance avec configuration Realtime optimisée
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 40, // Haute performance : fluidité maximale pour une réaction instantanée
        },
      },
      global: {
        fetch: fetchWithRetry,
      },
    }
  );

  return supabaseClient;
}

// Fonction pour réinitialiser le client (utile pour les tests ou reconnexion forcée)
export function resetClient(): void {
  if (supabaseClient) {
    // Déconnecter tous les channels avant de réinitialiser
    supabaseClient.removeAllChannels();
    supabaseClient = null;
  }
}
