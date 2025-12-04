"use client";

import { useTransition } from "react";
import { updateGeneralSettings } from "@/actions/general-settings.actions";
import { useRouter } from "next/navigation";

/**
 * Hook simplifié pour la gestion de la locale
 * Note: Actuellement l'application utilise uniquement le français
 */
export function useLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLocale = async (newLocale: "fr" | "en") => {
    try {
      // Mettre à jour dans la base de données
      await updateGeneralSettings({ language: newLocale });
      
      // Rafraîchir la page pour appliquer la nouvelle langue
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur lors du changement de langue:", error);
    }
  };

  return {
    locale: "fr" as const,
    changeLocale,
    isPending,
  };
}
