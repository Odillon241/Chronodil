import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern pour éviter les connexions multiples
let supabaseClient: SupabaseClient | null = null;

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
      realtime: {
        params: {
          eventsPerSecond: 10, // Limiter les événements pour éviter la surcharge
        },
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
