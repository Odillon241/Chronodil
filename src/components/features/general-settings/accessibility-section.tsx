"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/translations";
import { Eye, Zap, Info } from "lucide-react";

interface AccessibilitySectionProps {
  settings: {
    highContrast: boolean;
    reduceMotion: boolean;
  };
  onUpdate: (key: string, value: any) => void;
  isSaving: boolean;
}

export function AccessibilitySection({ settings, onUpdate, isSaving }: AccessibilitySectionProps) {
  const t = useT("settings.accessibility");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <div className="space-y-4">
        {/* High Contrast */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="high-contrast" className="font-medium cursor-pointer">
                {t("highContrast")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("highContrastDesc")}
              </p>
            </div>
          </div>
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={(checked) => onUpdate("highContrast", checked)}
            disabled={isSaving}
          />
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reduce-motion" className="font-medium cursor-pointer">
                {t("reduceMotion")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("reduceMotionDesc")}
              </p>
            </div>
          </div>
          <Switch
            id="reduce-motion"
            checked={settings.reduceMotion}
            onCheckedChange={(checked) => onUpdate("reduceMotion", checked)}
            disabled={isSaving}
          />
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {t("tip")}
          </p>
        </div>
      </div>
    </div>
  );
}
