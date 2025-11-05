"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

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
  { value: "rusty-red", label: "Green", class: "bg-primary" },
  { value: "ou-crimson", label: "Dark Green", class: "bg-ou-crimson" },
  { value: "powder-blue", label: "Light Green", class: "bg-powder-blue" },
  { value: "forest-green", label: "Forest Green", class: "bg-forest-green" },
  { value: "golden-orange", label: "Sage Green", class: "bg-golden-orange" },
];

export function AppearanceSection({ settings, onUpdate, isSaving }: AppearanceSectionProps) {
  const t = useTranslations("settings.appearance");

  const viewDensityOptions = [
    { value: "compact", label: t("density.compact") },
    { value: "normal", label: t("density.normal") },
    { value: "comfortable", label: t("density.comfortable") },
  ];

  const handleAccentColorChange = (colorName: string) => {
    console.log("🎨 Changement couleur d'accentuation:", colorName);
    document.documentElement.setAttribute("data-accent", colorName);
    onUpdate("accentColor", colorName);
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
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentColorChange(color.value)}
                disabled={isSaving}
                className={`relative p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 hover:bg-muted/50 ${
                  settings.accentColor === color.value
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border"
                }`}
              >
                <div className={`h-8 w-8 rounded-full ${color.class}`} />
                <p className="text-xs font-medium text-center">{color.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* View Density & Font Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          {/* View Density */}
          <div className="space-y-3">
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
          <div className="space-y-3">
            <Label htmlFor="font-size">
              {t("fontSize")}: {settings.fontSize}px
            </Label>
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
        </div>
      </div>
    </div>
  );
}
