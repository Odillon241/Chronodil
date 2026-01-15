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
        // Ignorer l'erreur si c'est juste "pas de session"
        if (authError.message?.includes('session') || authError.name === 'AuthSessionMissingError') {
          setUser(null);
          setError(null);
          return;
        }
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
      console.error("Erreur fetchSession:", err);
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
        console.log("[Auth] State change:", event, session?.user?.email);
        
        if (event === "SIGNED_IN" && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
            role: session.user.user_metadata?.role || "EMPLOYEE",
            image: session.user.user_metadata?.avatar_url || null,
          });
          setIsPending(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsPending(false);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Mettre à jour l'utilisateur lors du rafraîchissement du token
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
            role: session.user.user_metadata?.role || "EMPLOYEE",
            image: session.user.user_metadata?.avatar_url || null,
          });
        }
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
  
  console.log("[Auth] Attempting signIn for:", credentials.email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    console.error("[Auth] SignIn error:", error.message);
  } else {
    console.log("[Auth] SignIn success:", data.user?.email);
  }

  return { data, error };
}

/**
 * Connexion avec Google OAuth
 */
export async function signInWithGoogle(): Promise<{
  error?: AuthError | null;
  data?: { provider: string; url: string | null } | null;
}> {
  const supabase = createClient();
  
  console.log("[Auth] Attempting Google OAuth signIn...");
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error("[Auth] Google OAuth error:", error.message);
  } else {
    console.log("[Auth] Google OAuth redirect initiated");
  }

  return { data, error };
}

/**
 * Inscription avec email et mot de passe
 * Utilise l'Admin API via notre route API pour créer des utilisateurs pré-confirmés
 */
export async function signUp(credentials: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  error?: { message: string } | null;
  data?: { user: { id: string; email: string; name: string } | null } | null;
  success?: boolean;
}> {
  console.log("[Auth] Attempting signUp for:", credentials.email);

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Auth] SignUp error:", result.error?.message);
      return { error: result.error, data: null };
    }

    console.log("[Auth] SignUp success:", result.user?.email);
    return { 
      data: { user: result.user }, 
      error: null,
      success: true,
    };
  } catch (error: any) {
    console.error("[Auth] SignUp error:", error.message);
    return { 
      error: { message: "Erreur de connexion au serveur" }, 
      data: null 
    };
  }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<{ error?: AuthError | null }> {
  const supabase = createClient();
  console.log("[Auth] Signing out...");
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Auth] SignOut error:", error.message);
  }
  return { error };
}

/**
 * Réinitialisation du mot de passe via Supabase Auth
 */
export async function resetPassword(email: string): Promise<{ error?: AuthError | null }> {
  const supabase = createClient();
  console.log("[Auth] Requesting password reset for:", email);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  if (error) {
    console.error("[Auth] Reset password error:", error.message);
  }
  return { error };
}

/**
 * Mise à jour du mot de passe (après clic sur le lien de réinitialisation)
 */
export async function updatePassword(newPassword: string): Promise<{ error?: AuthError | null }> {
  const supabase = createClient();
  console.log("[Auth] Updating password...");
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    console.error("[Auth] Update password error:", error.message);
  }
  return { error };
}

/**
 * Obtenir la session actuelle
 */
export async function getSession(): Promise<{
  data: { session: SupabaseSession | null };
  error: AuthError | null;
}> {
  const supabase = createClient();
  return await supabase.auth.getSession();
}

/**
 * Obtenir l'utilisateur actuel
 */
export async function getUser(): Promise<{
  data: { user: User | null };
  error: AuthError | null;
}> {
  const supabase = createClient();
  return await supabase.auth.getUser();
}

// Export du client Supabase pour les cas spéciaux
export { createClient };
