"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocalizationSectionProps {
  settings: {
    language: string;
    dateFormat: string;
    hourFormat: string;
    timezone: string;
  };
  onUpdate: (key: string, value: any) => void;
  isSaving: boolean;
}

const languages = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const dateFormats = [
  { value: "DD/MM/YYYY", label: "JJ/MM/AAAA (23/10/2025)" },
  { value: "MM/DD/YYYY", label: "MM/JJ/AAAA (10/23/2025)" },
  { value: "YYYY-MM-DD", label: "AAAA-MM-JJ (2025-10-23)" },
];

const hourFormats = [
  { value: "24", label: "24 heures (14:30)" },
  { value: "12", label: "12 heures (02:30 PM)" },
];

const timezones = [
  { value: "Africa/Libreville", label: "Afrique/Libreville (WAT)" },
  { value: "Africa/Lagos", label: "Afrique/Lagos (WAT)" },
  { value: "Africa/Douala", label: "Afrique/Douala (WAT)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/London", label: "Europe/Londres (GMT/BST)" },
  { value: "America/New_York", label: "Amérique/New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Amérique/Los Angeles (PST/PDT)" },
  { value: "Asia/Tokyo", label: "Asie/Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Asie/Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Asie/Dubaï (GST)" },
];

/**
 * Détecte la localisation du navigateur
 * @returns Les paramètres de localisation détectés
 */
function detectBrowserLocalization() {
  try {
    // Détecter la langue
    const browserLang = navigator.language || navigator.languages?.[0] || "fr";
    const langCode = browserLang.split("-")[0].toLowerCase();
    const detectedLanguage = languages.find((l) => l.value === langCode)?.value || "fr";

    // Détecter le fuseau horaire
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Utiliser le fuseau horaire détecté (même s'il n'est pas dans la liste, il sera accepté par le schéma)
    const finalTimezone = detectedTimezone;

    // Détecter le format de date en analysant un exemple de date formatée
    const testDate = new Date(2025, 9, 23); // 23 octobre 2025
    const dateFormatter = new Intl.DateTimeFormat(browserLang, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formattedDate = dateFormatter.format(testDate);
    
    // Analyser le format (ex: "23/10/2025", "10/23/2025", "2025-10-23")
    let detectedDateFormat: string;
    if (formattedDate.includes("/")) {
      const parts = formattedDate.split("/");
      const firstPart = parseInt(parts[0]);
      const secondPart = parseInt(parts[1]);
      
      if (parts[0].length === 4) {
        // Format YYYY/MM/DD
        detectedDateFormat = "YYYY-MM-DD";
      } else if (firstPart > 12) {
        // Format DD/MM/YYYY (jour > 12, donc c'est le jour)
        detectedDateFormat = "DD/MM/YYYY";
      } else if (secondPart > 12) {
        // Format MM/DD/YYYY (deuxième partie > 12, donc c'est le jour)
        detectedDateFormat = "MM/DD/YYYY";
      } else {
        // Ambiguïté : utiliser la locale pour décider
        // Les locales européennes utilisent généralement DD/MM/YYYY
        // Les locales américaines utilisent MM/DD/YYYY
        const isEuropeanLocale = ["fr", "de", "es", "it", "pt", "nl", "pl", "ru"].includes(langCode);
        detectedDateFormat = isEuropeanLocale ? "DD/MM/YYYY" : "MM/DD/YYYY";
      }
    } else if (formattedDate.includes("-")) {
      // Format ISO ou similaire
      const parts = formattedDate.split("-");
      if (parts[0].length === 4) {
        detectedDateFormat = "YYYY-MM-DD";
      } else {
        // Format DD-MM-YYYY ou MM-DD-YYYY
        const firstPart = parseInt(parts[0]);
        if (firstPart > 12) {
          detectedDateFormat = "DD/MM/YYYY";
        } else {
          detectedDateFormat = "MM/DD/YYYY";
        }
      }
    } else {
      // Par défaut selon la locale
      const isEuropeanLocale = ["fr", "de", "es", "it", "pt", "nl", "pl", "ru"].includes(langCode);
      detectedDateFormat = isEuropeanLocale ? "DD/MM/YYYY" : "MM/DD/YYYY";
    }

    // Détecter le format d'heure (12h ou 24h)
    const timeFormatter = new Intl.DateTimeFormat(browserLang, {
      hour: "numeric",
      minute: "2-digit",
      hour12: undefined, // Laisser le navigateur décider
    });
    const testTime = new Date(2025, 0, 1, 14, 30); // 14:30
    const formattedTime = timeFormatter.format(testTime);
    const detectedHourFormat = formattedTime.includes("PM") || formattedTime.includes("AM") ? "12" : "24";

    return {
      language: detectedLanguage,
      dateFormat: detectedDateFormat,
      hourFormat: detectedHourFormat,
      timezone: finalTimezone,
    };
  } catch (error) {
    console.error("Erreur lors de la détection de la localisation:", error);
    // Valeurs par défaut en cas d'erreur
    return {
      language: "fr",
      dateFormat: "DD/MM/YYYY",
      hourFormat: "24",
      timezone: "Africa/Libreville",
    };
  }
}

export function LocalizationSection({ settings, onUpdate, isSaving }: LocalizationSectionProps) {
  const t = useTranslations("settings.localization");
  const router = useRouter();
  const [isDetecting, setIsDetecting] = useState(false);

  const handleLanguageChange = async (value: string) => {
    await onUpdate("language", value);
    setTimeout(() => router.refresh(), 500);
  };

  const handleDetectLocalization = async () => {
    setIsDetecting(true);
    try {
      const detected = detectBrowserLocalization();
      
      // Appliquer tous les paramètres détectés un par un
      // (onUpdate ne gère qu'un seul paramètre à la fois)
      await onUpdate("language", detected.language);
      await onUpdate("dateFormat", detected.dateFormat);
      await onUpdate("hourFormat", detected.hourFormat);
      await onUpdate("timezone", detected.timezone);

      toast.success("Localisation détectée et appliquée avec succès");
      
      // Rafraîchir la page si la langue a changé
      if (detected.language !== settings.language) {
        setTimeout(() => router.refresh(), 500);
      }
    } catch (error) {
      console.error("Erreur lors de la détection:", error);
      toast.error("Erreur lors de la détection de la localisation");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDetectLocalization}
          disabled={isSaving || isDetecting}
          className="gap-2"
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Détection...</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span>Détecter automatiquement</span>
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div className="space-y-3">
            <Label htmlFor="language">{t("language")}</Label>
            <Select
              value={settings.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" disabled={isSaving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("languageDesc")}
            </p>
          </div>

          {/* Date Format */}
          <div className="space-y-3">
            <Label htmlFor="date-format">{t("dateFormat")}</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => onUpdate("dateFormat", value)}
            >
              <SelectTrigger id="date-format" disabled={isSaving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hour Format */}
          <div className="space-y-3">
            <Label htmlFor="hour-format">{t("hourFormat")}</Label>
            <Select
              value={settings.hourFormat}
              onValueChange={(value) => onUpdate("hourFormat", value)}
            >
              <SelectTrigger id="hour-format" disabled={isSaving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-3">
            <Label htmlFor="timezone">{t("timezone")}</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => onUpdate("timezone", value)}
            >
              <SelectTrigger id="timezone" disabled={isSaving}>
                <SelectValue>
                  {timezones.find((tz) => tz.value === settings.timezone)?.label || settings.timezone}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Afficher le fuseau horaire actuel s'il n'est pas dans la liste */}
                {!timezones.find((tz) => tz.value === settings.timezone) && settings.timezone && (
                  <SelectItem value={settings.timezone}>
                    {settings.timezone}
                  </SelectItem>
                )}
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("timezoneDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
