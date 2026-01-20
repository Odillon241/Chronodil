"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Moon, Clock, Calendar, Save, AlertTriangle, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuietHours } from "@/hooks/use-quiet-hours";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const DAYS_OF_WEEK = [
  { value: "0", label: "Dim", fullLabel: "Dimanche" },
  { value: "1", label: "Lun", fullLabel: "Lundi" },
  { value: "2", label: "Mar", fullLabel: "Mardi" },
  { value: "3", label: "Mer", fullLabel: "Mercredi" },
  { value: "4", label: "Jeu", fullLabel: "Jeudi" },
  { value: "5", label: "Ven", fullLabel: "Vendredi" },
  { value: "6", label: "Sam", fullLabel: "Samedi" },
];

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

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
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3 lg:gap-12 w-full pb-8">
      <div className="md:col-span-2 space-y-8">
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            Heures calmes
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurez une période pendant laquelle vous ne recevrez pas de notifications
            sonores ou de bureau.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Activation Row */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-card">
            <div className="space-y-1">
              <Label htmlFor="quiet-hours-enabled" className="text-base font-medium cursor-pointer">
                Activer les heures calmes
              </Label>
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
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm ${isQuiet
                  ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  : "bg-primary/10 border-primary/20 text-foreground"
                  }`}
              >
                <div className={`p-2 rounded-full ${isQuiet ? "bg-blue-100 dark:bg-blue-900" : "bg-primary/20 text-primary"}`}>
                  {isQuiet ? <Moon className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {isQuiet ? "Heures calmes actives" : "Notifications actives"}
                  </p>
                  <p className="text-xs opacity-90">
                    {isQuiet
                      ? "Les notifications sont actuellement silencieuses"
                      : "Vous recevez les notifications normalement"
                    }
                  </p>
                </div>
              </div>

              {/* Configuration Container */}
              <div className="bg-card border rounded-lg p-6 space-y-8 shadow-sm mb-6">
                {/* Horaires */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Plage horaire
                  </Label>
                  <div className="flex flex-wrap gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start-time" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                        Début
                      </Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger id="start-time" className="w-[140px] pl-9 font-medium relative">
                          <Moon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Début" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={`start-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                        Fin
                      </Label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger id="end-time" className="w-[140px] pl-9 font-medium relative">
                          <CheckCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Fin" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={`end-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Jours de la semaine */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Jours actifs
                  </Label>
                  <div className="space-y-2">
                    <ToggleGroup
                      type="multiple"
                      value={selectedDays}
                      onValueChange={setSelectedDays}
                      className="justify-start flex-wrap gap-2"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <ToggleGroupItem
                          key={day.value}
                          value={day.value}
                          aria-label={day.fullLabel}
                          className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border-border border hover:bg-muted hover:text-foreground transition-all"
                          variant="outline"
                        >
                          {day.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <p className="text-xs text-muted-foreground pt-1">
                      {selectedDays.length === 0
                        ? "Actif tous les jours de la semaine"
                        : `Actif uniquement: ${selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ")}`
                      }
                    </p>
                  </div>
                </div>

                {/* Prévisualisation */}
                <div className="bg-muted/30 rounded-md p-4 border flex gap-3 items-start">
                  <div className="p-1.5 bg-background rounded border shadow-sm shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Récapitulatif</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Le mode heures calmes s'activera automatiquement de <span className="font-semibold text-foreground">{startTime}</span> à <span className="font-semibold text-foreground">{endTime}</span>
                      {selectedDays.length > 0 ? " les jours sélectionnés." : " tous les jours."}
                    </p>
                    {parseInt(startTime.replace(":", "")) > parseInt(endTime.replace(":", "")) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Attention : la période chevauche deux journées (nuit)
                      </p>
                    )}
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex items-center justify-end p-4 border-t mt-6 -mx-6 -mb-6 bg-muted/5 rounded-b-lg">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="min-w-[140px]"
                  >
                    {isSaving ? (
                      <Spinner className="size-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide / Aide */}
      {enabled && (
        <div className="space-y-6">
          <div className="bg-muted/30 border rounded-lg p-5 space-y-4 sticky top-6">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                <Moon className="w-3.5 h-3.5" />
              </span>
              Guide Heures Calmes
            </h4>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Le mode heures calmes vous permet de vous déconnecter en coupant
                automatiquement les alertes sonores et visuelles.
              </p>

              <ul className="space-y-3">
                <li className="flex gap-2">
                  <CheckCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground block text-xs uppercase tracking-wide mb-0.5">Notifications</strong>
                    Elles continuent d'arriver dans votre centre de notifications mais ne sonnent pas.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground block text-xs uppercase tracking-wide mb-0.5">Urgences</strong>
                    Les messages marqués comme "Urgent" pourront toujours émettre un son si configuré.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground block text-xs uppercase tracking-wide mb-0.5">Planning</strong>
                    Ajustez les jours pour désactiver ce mode automatiquement le week-end par exemple.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
