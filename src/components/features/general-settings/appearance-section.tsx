"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { SettingsSlider } from "./settings-slider";

interface AppearanceSectionProps {
  settings: {
    accentColor: string;
    viewDensity: string;
    fontSize: number;
  };
  onUpdate: (key: string, value: any) => void;
  isSaving: boolean;
}

const accentColors = [
  { value: "yellow-vibrant", label: "Jaune vif", class: "bg-[#F8E800]" },
  { value: "green-anis", label: "Vert anis", class: "bg-[#95C11F]" },
  { value: "green-teal", label: "Vert sarcelle", class: "bg-[#39837A]" },
  { value: "dark", label: "Sombre", class: "bg-[#2C2C2C]" },
];

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

const validAccentColors = accentColors.map((c) => c.value); // ["yellow-vibrant", "green-anis", "green-teal", "dark"]

export function AppearanceSection({ settings, onUpdate, isSaving }: AppearanceSectionProps) {
  const t = useTranslations("settings.appearance");

  const viewDensityOptions = [
    { value: "compact", label: t("density.compact") },
    { value: "normal", label: t("density.normal") },
    { value: "comfortable", label: t("density.comfortable") },
  ];

  // Migration automatique des anciennes couleurs
  useEffect(() => {
    if (settings?.accentColor && !validAccentColors.includes(settings.accentColor)) {
      const migratedColor = colorMigrationMap[settings.accentColor] || "green";
      console.log(`🔄 Migration de la couleur: ${settings.accentColor} → ${migratedColor}`);
      onUpdate("accentColor", migratedColor);
      document.documentElement.setAttribute("data-accent", migratedColor);
    }
  }, [settings?.accentColor, onUpdate]);

  // Normaliser la couleur actuelle pour l'affichage
  const currentAccentColor = settings?.accentColor 
    ? (validAccentColors.includes(settings.accentColor) 
        ? settings.accentColor 
        : colorMigrationMap[settings.accentColor] || "green-anis")
    : "green-anis";

  const handleAccentColorChange = (colorName: string) => {
    console.log("🎨 Changement couleur d'accentuation:", colorName);
    // Appliquer immédiatement pour un feedback visuel
    document.documentElement.setAttribute("data-accent", colorName);
    // Sauvegarder en base de données
    onUpdate("accentColor", colorName);
    // Déclencher un événement pour synchroniser avec SettingsProvider
    window.dispatchEvent(new CustomEvent("settings-updated"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* Accent Color */}
        <div className="space-y-3 border-t pt-6">
          <Label>{t("accentColor")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {accentColors.map((color) => {
              const isSelected = currentAccentColor === color.value;
              return (
                <button
                  key={color.value}
                  onClick={() => handleAccentColorChange(color.value)}
                  disabled={isSaving}
                  className={`relative p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 hover:bg-muted/50 ${
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "border-border"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full ${color.class}`} />
                  <p className="text-xs font-medium text-center">{color.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Density & Font Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          {/* View Density */}
          <div className="space-y-3">
            <Label htmlFor="view-density">{t("viewDensity")}</Label>
            <Select
              value={settings.viewDensity}
              onValueChange={(value) => {
                // Appliquer immédiatement la densité d'affichage pour un feedback visuel instantané
                document.documentElement.setAttribute("data-density", value);
                onUpdate("viewDensity", value);
              }}
            >
              <SelectTrigger id="view-density" disabled={isSaving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewDensityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <SettingsSlider
            id="font-size"
            label={t("fontSize")}
            value={settings.fontSize}
            min={12}
            max={24}
            step={1}
            unit="px"
            description={t("fontSizeDesc")}
            onValueChange={(value) => onUpdate("fontSize", value)}
            onValueChangeImmediate={(value) => {
              // Appliquer immédiatement la taille de police pour un feedback visuel instantané
              document.documentElement.style.fontSize = `${value}px`;
            }}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
