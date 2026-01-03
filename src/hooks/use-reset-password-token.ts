"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth-client";
import { toast } from "sonner";

type TokenStatus = "validating" | "valid" | "invalid";

interface UseResetPasswordTokenResult {
  /** État actuel de la vérification du token */
  status: TokenStatus;
  /** Indique si le token est en cours de validation */
  isValidating: boolean;
  /** Indique si le token est valide */
  isValid: boolean;
  /** Relancer la vérification du token */
  retry: () => void;
}

/**
 * Hook pour gérer la vérification du token de réinitialisation de mot de passe
 * 
 * Supporte plusieurs formats de tokens Supabase Auth:
 * 1. Hash fragment: #access_token=xxx&refresh_token=xxx&type=recovery
 * 2. Query params PKCE: ?code=xxx
 * 3. Query params OTP: ?token_hash=xxx&type=recovery
 * 4. Session déjà active
 */
export function useResetPasswordToken(): UseResetPasswordTokenResult {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<TokenStatus>("validating");

  const verifyToken = useCallback(async () => {
    setStatus("validating");

    try {
      const supabase = createClient();

      // Étape 1: Vérifier le hash fragment (format Supabase standard pour recovery)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (accessToken && refreshToken && hashType === "recovery") {
        // Attendre que Supabase traite le hash automatiquement
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Vérifier si la session a été établie
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Erreur de session:", sessionError);
          setStatus("invalid");
          toast.error("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
          return;
        }

        if (session) {
          setStatus("valid");
          cleanupUrl();
          return;
        }

        // Essayer de définir la session manuellement si nécessaire
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionError) {
          console.error("Erreur lors de la définition de session:", setSessionError);
          setStatus("invalid");
          toast.error("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
          return;
        }

        setStatus("valid");
        cleanupUrl();
        return;
      }

      // Étape 2: Vérifier si une session est déjà active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Erreur de session:", sessionError);
        setStatus("invalid");
        toast.error("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
        return;
      }

      if (session) {
        setStatus("valid");
        return;
      }

      // Étape 3: Vérifier les query params (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("Erreur d'échange de code:", exchangeError);
          setStatus("invalid");
          toast.error("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
          return;
        }
        setStatus("valid");
        return;
      }

      // Étape 4: Vérifier les query params (OTP flow)
      const tokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type");
      if (tokenHash && queryType === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (verifyError) {
          console.error("Erreur de vérification OTP:", verifyError);
          setStatus("invalid");
          toast.error("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
          return;
        }
        setStatus("valid");
        return;
      }

      // Aucun token valide trouvé
      console.error(
        "Aucun code ou token valide dans l'URL.",
        "Hash:", window.location.hash,
        "Query:", window.location.search
      );
      setStatus("invalid");
      toast.error("Lien invalide. Demandez un nouveau lien de réinitialisation.");
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      setStatus("invalid");
      toast.error("Une erreur s'est produite");
    }
  }, [searchParams]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  return {
    status,
    isValidating: status === "validating",
    isValid: status === "valid",
    retry: verifyToken,
  };
}

/**
 * Nettoie l'URL en supprimant le hash fragment
 * pour éviter la réutilisation des tokens
 */
function cleanupUrl() {
  window.history.replaceState(null, "", window.location.pathname);
}
