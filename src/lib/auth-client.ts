"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect, useState, useCallback } from "react";
import type { User, Session as SupabaseSession, AuthError } from "@supabase/supabase-js";

// Types
export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    image?: string | null;
  } | null;
}

export interface SessionData {
  data: UserSession | null;
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour gérer la session utilisateur avec Supabase Auth
 */
export function useSession(): SessionData {
  const [user, setUser] = useState<UserSession["user"]>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsPending(true);
      const supabase = createClient();
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (supabaseUser) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "",
          role: supabaseUser.user_metadata?.role || "EMPLOYEE",
          image: supabaseUser.user_metadata?.avatar_url || null,
        });
      } else {
        setUser(null);
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    // Écouter les changements d'authentification
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
            role: session.user.user_metadata?.role || "EMPLOYEE",
            image: session.user.user_metadata?.avatar_url || null,
          });
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
        setIsPending(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession]);

  return {
    data: user ? { user } : null,
    isPending,
    error,
    refetch: fetchSession,
  };
}

/**
 * Connexion avec email et mot de passe
 */
export async function signIn(credentials: { email: string; password: string }): Promise<{
  error?: AuthError | null;
  data?: { user: User | null; session: SupabaseSession | null };
}> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  return { data, error };
}

/**
 * Inscription avec email et mot de passe
 */
export async function signUp(credentials: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  error?: AuthError | null;
  data?: { user: User | null; session: SupabaseSession | null };
}> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        name: credentials.name,
      },
    },
  });

  return { data, error };
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<{ error?: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Réinitialisation du mot de passe
 */
export async function resetPassword(email: string): Promise<{ error?: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
}

/**
 * Mise à jour du mot de passe
 */
export async function updatePassword(newPassword: string): Promise<{ error?: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}

/**
 * Vérification du code OTP pour la réinitialisation de mot de passe
 */
export async function verifyOtpForRecovery(
  email: string,
  token: string
): Promise<{
  error?: AuthError | null;
  data?: { user: User | null; session: SupabaseSession | null };
}> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  return { data, error };
}

// Export du client Supabase pour les cas spéciaux
export { createClient };
