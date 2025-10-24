"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

interface AccessibilitySectionProps {
  settings: {
    highContrast: boolean;
    screenReaderMode: boolean;
    reduceMotion: boolean;
  };
  onUpdate: (key: string, value: any) => void;
  isSaving: boolean;
}

export function AccessibilitySection({ settings, onUpdate, isSaving }: AccessibilitySectionProps) {
  const t = useTranslations("settings.accessibility");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* High Contrast */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">{t("highContrast")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("highContrastDesc")}
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => onUpdate("highContrast", checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Screen Reader Mode */}
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="screen-reader">{t("screenReader")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("screenReaderDesc")}
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={settings.screenReaderMode}
              onCheckedChange={(checked) => onUpdate("screenReaderMode", checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Reduce Motion */}
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">{t("reduceMotion")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("reduceMotionDesc")}
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => onUpdate("reduceMotion", checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {t("tip")}
          </p>
        </div>
      </div>
    </div>
  );
}
