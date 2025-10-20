"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

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

export function LocalizationSection({ settings, onUpdate, isSaving }: LocalizationSectionProps) {
  const t = useTranslations("settings.localization");
  const router = useRouter();

  const handleLanguageChange = async (value: string) => {
    await onUpdate("language", value);
    // Rafraîchir la page pour appliquer la nouvelle langue
    setTimeout(() => router.refresh(), 500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <div className="space-y-3 border-t pt-6">
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
        <div className="space-y-3 border-t pt-6">
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
        <div className="space-y-3 border-t pt-6">
          <Label htmlFor="timezone">{t("timezone")}</Label>
          <Select
            value={settings.timezone}
            onValueChange={(value) => onUpdate("timezone", value)}
          >
            <SelectTrigger id="timezone" disabled={isSaving}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
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
      </CardContent>
    </Card>
  );
}
