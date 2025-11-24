"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getGeneralSettings } from "@/actions/general-settings.actions";

export interface GeneralSettings {
  // Apparence
  accentColor: string;
  viewDensity: string;
  fontSize: number;
  // Localisation
  language: string;
  dateFormat: string;
  hourFormat: string;
  timezone: string;
  // Accessibilité
  highContrast: boolean;
  screenReaderMode: boolean;
  reduceMotion: boolean;
}

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

const validAccentColors = ["yellow-vibrant", "green-anis", "green-teal", "dark"];

// Fonction pour normaliser la couleur d'accentuation
const normalizeAccentColor = (accentColor: string | null | undefined): string => {
  if (!accentColor) return "green-anis";
  if (validAccentColors.includes(accentColor)) return accentColor;
  return colorMigrationMap[accentColor] || "green-anis";
};

export function useGeneralSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    loadSettings();
  }, [session?.user]);

  const loadSettings = async () => {
    try {
      const result = await getGeneralSettings({});
      if (result?.data) {
        setSettings(result.data as GeneralSettings);
        applySettings(result.data as GeneralSettings);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applySettings = (settings: GeneralSettings) => {
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
    } else {
      document.documentElement.setAttribute("data-density", "normal");
    }

    // Appliquer la couleur d'accentuation (normalisée) - TOUJOURS appliquer une valeur
    const normalizedColor = normalizeAccentColor(settings.accentColor);
    document.documentElement.setAttribute("data-accent", normalizedColor);
  };

  const updateSetting = (key: keyof GeneralSettings, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    applySettings(updatedSettings);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    refreshSettings: loadSettings,
    applySettings,
  };
}

