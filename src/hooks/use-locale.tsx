"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";
import { updateGeneralSettings } from "@/actions/general-settings.actions";
import { useRouter } from "next/navigation";

export function useLocale() {
  const currentLocale = useNextIntlLocale();
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
    locale: currentLocale,
    changeLocale,
    isPending,
  };
}

