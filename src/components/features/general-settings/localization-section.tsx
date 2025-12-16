"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/translations";
import { Globe, Loader2, Clock, Calendar, Info } from "lucide-react";
import { toast } from "sonner";

interface LocalizationSectionProps {
  settings: {
    dateFormat: string;
    hourFormat: string;
    timezone: string;
  };
  onUpdate: (key: string, value: any) => void;
  isSaving: boolean;
}

const dateFormats = [
  { value: "DD/MM/YYYY", label: "JJ/MM/AAAA", example: "23/10/2025" },
  { value: "MM/DD/YYYY", label: "MM/JJ/AAAA", example: "10/23/2025" },
  { value: "YYYY-MM-DD", label: "AAAA-MM-JJ", example: "2025-10-23" },
];

const hourFormats = [
  { value: "24", label: "24 heures", example: "14:30" },
  { value: "12", label: "12 heures", example: "02:30 PM" },
];

// Fuseaux horaires les plus courants
const commonTimezones = [
  { value: "Africa/Libreville", label: "Libreville (WAT)", offset: "+01:00" },
  { value: "Africa/Lagos", label: "Lagos (WAT)", offset: "+01:00" },
  { value: "Africa/Douala", label: "Douala (WAT)", offset: "+01:00" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "+01:00" },
  { value: "Europe/London", label: "Londres (GMT)", offset: "+00:00" },
  { value: "America/New_York", label: "New York (EST)", offset: "-05:00" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)", offset: "-08:00" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "+09:00" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "+08:00" },
  { value: "Asia/Dubai", label: "Dubaï (GST)", offset: "+04:00" },
];

/**
 * Détecte les paramètres de localisation du navigateur
 */
function detectBrowserLocalization() {
  try {
    const browserLang = navigator.language || "fr";
    const langCode = browserLang.split("-")[0].toLowerCase();
    
    // Détecter le fuseau horaire
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Détecter le format de date
    const testDate = new Date(2025, 9, 23);
    const dateFormatter = new Intl.DateTimeFormat(browserLang, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formattedDate = dateFormatter.format(testDate);
    
    let detectedDateFormat: string;
    if (formattedDate.includes("/")) {
      const parts = formattedDate.split("/");
      const firstPart = parseInt(parts[0]);
      if (parts[0].length === 4) {
        detectedDateFormat = "YYYY-MM-DD";
      } else if (firstPart > 12) {
        detectedDateFormat = "DD/MM/YYYY";
      } else {
        const isEuropean = ["fr", "de", "es", "it", "pt"].includes(langCode);
        detectedDateFormat = isEuropean ? "DD/MM/YYYY" : "MM/DD/YYYY";
      }
    } else {
      detectedDateFormat = "YYYY-MM-DD";
    }

    // Détecter le format d'heure
    const timeFormatter = new Intl.DateTimeFormat(browserLang, {
      hour: "numeric",
      minute: "2-digit",
    });
    const testTime = new Date(2025, 0, 1, 14, 30);
    const formattedTime = timeFormatter.format(testTime);
    const detectedHourFormat = formattedTime.includes("PM") || formattedTime.includes("AM") ? "12" : "24";

    return {
      dateFormat: detectedDateFormat,
      hourFormat: detectedHourFormat,
      timezone: detectedTimezone,
    };
  } catch (error) {
    console.error("Erreur lors de la détection:", error);
    return {
      dateFormat: "DD/MM/YYYY",
      hourFormat: "24",
      timezone: "Africa/Libreville",
    };
  }
}

export function LocalizationSection({ settings, onUpdate, isSaving }: LocalizationSectionProps) {
  const t = useT("settings.localization");
  const [isDetecting, setIsDetecting] = useState(false);

  // Trouver le fuseau horaire actuel dans la liste ou l'afficher tel quel
  const currentTimezone = useMemo(() => {
    const found = commonTimezones.find((tz) => tz.value === settings.timezone);
    if (found) return found;
    return { value: settings.timezone, label: settings.timezone, offset: "" };
  }, [settings.timezone]);

  const handleDetectLocalization = async () => {
    setIsDetecting(true);
    try {
      const detected = detectBrowserLocalization();
      
      await onUpdate("dateFormat", detected.dateFormat);
      await onUpdate("hourFormat", detected.hourFormat);
      await onUpdate("timezone", detected.timezone);

      toast.success("Paramètres régionaux détectés et appliqués");
    } catch (error) {
      console.error("Erreur lors de la détection:", error);
      toast.error("Erreur lors de la détection");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
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
          className="gap-2 shrink-0"
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Détection...</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Détecter</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Format */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="date-format" className="font-medium">{t("dateFormat")}</Label>
          </div>
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
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{format.label}</span>
                    <span className="text-xs text-muted-foreground">{format.example}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hour Format */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="hour-format" className="font-medium">{t("hourFormat")}</Label>
          </div>
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
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{format.label}</span>
                    <span className="text-xs text-muted-foreground">{format.example}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="timezone" className="font-medium">{t("timezone")}</Label>
          </div>
          <Select
            value={settings.timezone}
            onValueChange={(value) => onUpdate("timezone", value)}
          >
            <SelectTrigger id="timezone" disabled={isSaving}>
              <SelectValue>
                {currentTimezone.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {/* Afficher le fuseau actuel s'il n'est pas dans la liste */}
              {!commonTimezones.find((tz) => tz.value === settings.timezone) && settings.timezone && (
                <SelectItem value={settings.timezone}>
                  {settings.timezone} (actuel)
                </SelectItem>
              )}
              {commonTimezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{tz.label}</span>
                    <span className="text-xs text-muted-foreground">{tz.offset}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 dark:text-amber-100">
          Ces paramètres seront utilisés pour l'affichage des dates et heures dans l'application.
        </p>
      </div>
    </div>
  );
}
