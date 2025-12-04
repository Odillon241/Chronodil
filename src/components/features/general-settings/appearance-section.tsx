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
import { useT } from "@/lib/translations";
import { SettingsSlider } from "./settings-slider";
import { Palette, LayoutGrid, Type, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

const validAccentColors = accentColors.map((c) => c.value);

// Migration des anciennes couleurs
const colorMigrationMap: Record<string, string> = {
  "rusty-red": "green-anis",
  "ou-crimson": "green-teal",
  "powder-blue": "green-anis",
  "golden-orange": "yellow-vibrant",
  "green": "green-anis",
  "dark-green": "green-teal",
};

export function AppearanceSection({ settings, onUpdate, isSaving }: AppearanceSectionProps) {
  const t = useT("settings.appearance");

  const viewDensityOptions = [
    { value: "compact", label: t("density.compact"), description: "Moins d'espace" },
    { value: "normal", label: t("density.normal"), description: "Par défaut" },
    { value: "comfortable", label: t("density.comfortable"), description: "Plus d'espace" },
  ];

  // Migration automatique des anciennes couleurs
  useEffect(() => {
    if (settings?.accentColor && !validAccentColors.includes(settings.accentColor)) {
      const migratedColor = colorMigrationMap[settings.accentColor] || "green-anis";
      console.log(`🔄 Migration couleur: ${settings.accentColor} → ${migratedColor}`);
      onUpdate("accentColor", migratedColor);
      document.documentElement.setAttribute("data-accent", migratedColor);
    }
  }, [settings?.accentColor, onUpdate]);

  // Normaliser la couleur actuelle
  const currentAccentColor = settings?.accentColor 
    ? (validAccentColors.includes(settings.accentColor) 
        ? settings.accentColor 
        : colorMigrationMap[settings.accentColor] || "green-anis")
    : "green-anis";

  const handleAccentColorChange = (colorName: string) => {
    document.documentElement.setAttribute("data-accent", colorName);
    onUpdate("accentColor", colorName);
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
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">{t("accentColor")}</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {accentColors.map((color) => {
              const isSelected = currentAccentColor === color.value;
              return (
                <button
                  key={color.value}
                  onClick={() => handleAccentColorChange(color.value)}
                  disabled={isSaving}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                    "hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full shadow-inner", color.class)}>
                    {isSelected && (
                      <div className="h-full w-full flex items-center justify-center">
                        <Check className={cn(
                          "h-5 w-5",
                          color.value === "yellow-vibrant" || color.value === "green-anis" 
                            ? "text-gray-900" 
                            : "text-white"
                        )} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Density & Font Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* View Density */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="view-density" className="font-medium">{t("viewDensity")}</Label>
            </div>
            <Select
              value={settings.viewDensity}
              onValueChange={(value) => {
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
                    <div className="flex items-center justify-between gap-3">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">{t("fontSize")}</Label>
            </div>
            <SettingsSlider
              id="font-size"
              label=""
              value={settings.fontSize}
              min={10}
              max={20}
              step={1}
              unit="px"
              description={t("fontSizeDesc")}
              onValueChange={(value) => onUpdate("fontSize", value)}
              onValueChangeImmediate={(value) => {
                document.documentElement.style.fontSize = `${value}px`;
              }}
              disabled={isSaving}
              formatValue={(v) => `${v}px`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
