import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crée un client Supabase pour les actions serveur
 * Utilise les cookies pour l'authentification
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
    }
  );
}

