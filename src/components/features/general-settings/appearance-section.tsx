"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";

interface AppearanceSectionProps {
  settings: {
    darkModeEnabled: boolean;
    accentColor: string;
    viewDensity: string;
    fontSize: number;
  };
  onUpdate: (key: string, value: any) => void;
  isSaving: boolean;
}

const accentColors = [
  { value: "rusty-red", label: "Rusty Red", class: "bg-rusty-red" },
  { value: "ou-crimson", label: "OU Crimson", class: "bg-ou-crimson" },
  { value: "powder-blue", label: "Powder Blue", class: "bg-powder-blue" },
  { value: "forest-green", label: "Forest Green", class: "bg-forest-green" },
  { value: "golden-orange", label: "Golden Orange", class: "bg-golden-orange" },
];

export function AppearanceSection({ settings, onUpdate, isSaving }: AppearanceSectionProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("settings.appearance");

  const viewDensityOptions = [
    { value: "compact", label: t("density.compact") },
    { value: "normal", label: t("density.normal") },
    { value: "comfortable", label: t("density.comfortable") },
  ];

  // Synchroniser le thème next-themes avec darkModeEnabled au chargement
  useEffect(() => {
    if (settings.darkModeEnabled !== undefined && resolvedTheme) {
      const expectedTheme = settings.darkModeEnabled ? "dark" : "light";
      if (resolvedTheme !== expectedTheme) {
        console.log("🎨 Initialisation thème:", { darkModeEnabled: settings.darkModeEnabled, expectedTheme, resolvedTheme });
        setTheme(expectedTheme);
      }
    }
  }, [settings.darkModeEnabled, resolvedTheme, setTheme]);

  // Handler pour le toggle du mode sombre
  const handleDarkModeToggle = (checked: boolean) => {
    console.log("🌓 Toggle mode sombre:", checked);
    // 1. Changer immédiatement le thème next-themes
    setTheme(checked ? "dark" : "light");
    // 2. Sauvegarder en base de données
    onUpdate("darkModeEnabled", checked);
  };

  // Handler pour le changement de couleur d'accentuation
  const handleAccentColorChange = (colorName: string) => {
    console.log("🎨 Changement couleur d'accentuation:", colorName);

    // 1. Appliquer immédiatement via data-attribute (le CSS gère le reste)
    document.documentElement.setAttribute("data-accent", colorName);

    // 2. Sauvegarder en base de données
    onUpdate("accentColor", colorName);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dark Mode */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">{t("darkMode")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("darkModeDesc")}
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.darkModeEnabled}
              onCheckedChange={handleDarkModeToggle}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3 border-t pt-6">
          <Label>{t("accentColor")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentColorChange(color.value)}
                disabled={isSaving}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.accentColor === color.value
                    ? "border-foreground bg-muted"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className={`h-6 w-6 rounded ${color.class}`} />
                <p className="text-xs mt-2 font-medium text-center">{color.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* View Density */}
        <div className="space-y-3 border-t pt-6">
          <Label htmlFor="view-density">{t("viewDensity")}</Label>
          <Select
            value={settings.viewDensity}
            onValueChange={(value) => onUpdate("viewDensity", value)}
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
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size">
              {t("fontSize")}: {settings.fontSize}px
            </Label>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={24}
            step={1}
            value={[settings.fontSize]}
            onValueChange={([value]) => onUpdate("fontSize", value)}
            disabled={isSaving}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {t("fontSizeDesc")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
