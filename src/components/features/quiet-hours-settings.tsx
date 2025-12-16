"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Moon, Clock, Calendar, Save } from "lucide-react";
import { toast } from "sonner";
import { useQuietHours } from "@/hooks/use-quiet-hours";
import { Spinner } from "@/components/ui/spinner";

const DAYS_OF_WEEK = [
  { value: "0", label: "Dim", fullLabel: "Dimanche" },
  { value: "1", label: "Lun", fullLabel: "Lundi" },
  { value: "2", label: "Mar", fullLabel: "Mardi" },
  { value: "3", label: "Mer", fullLabel: "Mercredi" },
  { value: "4", label: "Jeu", fullLabel: "Jeudi" },
  { value: "5", label: "Ven", fullLabel: "Vendredi" },
  { value: "6", label: "Sam", fullLabel: "Samedi" },
];

export function QuietHoursSettings() {
  const { settings, isQuiet, isLoading, updateSettings } = useQuietHours();

  const [enabled, setEnabled] = useState(false);
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("07:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Synchroniser avec les paramètres chargés
  useEffect(() => {
    setEnabled(settings.enabled);
    setStartTime(settings.startTime);
    setEndTime(settings.endTime);
    setSelectedDays(settings.days);
  }, [settings]);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateSettings({
        enabled,
        startTime,
        endTime,
        days: selectedDays,
      });

      if (success) {
        toast.success("Paramètres d'heures calmes enregistrés");
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    enabled !== settings.enabled ||
    startTime !== settings.startTime ||
    endTime !== settings.endTime ||
    JSON.stringify(selectedDays.sort()) !== JSON.stringify(settings.days.sort());

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-primary" />
          <CardTitle>Heures calmes</CardTitle>
        </div>
        <CardDescription>
          Configurez une période pendant laquelle vous ne recevrez pas de notifications
          sonores ou de bureau.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activation */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="quiet-hours-enabled">Activer les heures calmes</Label>
            <p className="text-sm text-muted-foreground">
              Les notifications seront silencieuses pendant cette période
            </p>
          </div>
          <Switch
            id="quiet-hours-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Indicateur d'état actuel */}
        {enabled && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              isQuiet
                ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                : "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
            }`}
          >
            {isQuiet ? (
              <>
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Heures calmes actives - Les notifications sont silencieuses
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Notifications actives - Hors des heures calmes
                </span>
              </>
            )}
          </div>
        )}

        {enabled && (
          <>
            {/* Horaires */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Début
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fin
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Jours de la semaine */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Jours actifs (laisser vide pour tous les jours)
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    title={day.fullLabel}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Heures calmes actives:{" "}
                  {selectedDays
                    .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.fullLabel)
                    .join(", ")}
                </p>
              )}
            </div>

            {/* Prévisualisation */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Période de silence:</span>{" "}
                {startTime} → {endTime}
                {selectedDays.length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({selectedDays.length} jour{selectedDays.length > 1 ? "s" : ""})
                  </span>
                )}
                {selectedDays.length === 0 && (
                  <span className="text-muted-foreground"> (tous les jours)</span>
                )}
              </p>
              {parseInt(startTime.replace(":", "")) > parseInt(endTime.replace(":", "")) && (
                <p className="text-xs text-muted-foreground mt-1">
                  La période passe minuit (ex: 22h → 7h du lendemain)
                </p>
              )}
            </div>
          </>
        )}

        {/* Bouton de sauvegarde */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer les modifications
        </Button>
      </CardContent>
    </Card>
  );
}
