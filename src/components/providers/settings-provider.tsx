"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getGeneralSettings } from "@/actions/general-settings.actions";

// Mapping pour migrer les anciennes couleurs vers les nouvelles
const colorMigrationMap: Record<string, string> = {
  "rusty-red": "green-anis",
  "ou-crimson": "green-teal",
  "powder-blue": "green-anis",
  "golden-orange": "yellow-vibrant",
  "green": "green-anis",
  "dark-green": "green-teal",
  "light-green": "green-anis",
  "forest-green": "green-teal",
  "sage-green": "green-anis",
};

const validAccentColors = ["yellow-vibrant", "green-anis", "green-teal"];

// Fonction pour normaliser la couleur d'accentuation
const normalizeAccentColor = (accentColor: string | null | undefined): string => {
  if (!accentColor) return "green-anis";
  if (validAccentColors.includes(accentColor)) return accentColor;
  return colorMigrationMap[accentColor] || "green-anis";
};

/**
 * Provider qui charge les paramètres généraux de l'utilisateur au démarrage du dashboard
 * et les applique une seule fois pour éviter les conflits avec next-themes
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Ne charger qu'une seule fois quand l'utilisateur est connecté
    if (!session?.user || isInitialized) return;

    const loadAndApplySettings = async () => {
      try {
        const result = await getGeneralSettings({});
        if (result?.data) {
          applySettings(result.data);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
        setIsInitialized(true);
      }
    };

    loadAndApplySettings();
  }, [session?.user, isInitialized]);

  const applySettings = (settings: any) => {
    if (!settings) return;

    // Appliquer la taille de police
    if (settings.fontSize) {
      document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }

    // Appliquer le contraste élevé
    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    // Appliquer la réduction des animations
    if (settings.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    // Appliquer la densité d'affichage
    if (settings.viewDensity) {
      document.documentElement.setAttribute("data-density", settings.viewDensity);
    }

    // Appliquer la couleur d'accentuation (normalisée)
    if (settings.accentColor) {
      const normalizedColor = normalizeAccentColor(settings.accentColor);
      document.documentElement.setAttribute("data-accent", normalizedColor);
    }
  };

  return <>{children}</>;
}

