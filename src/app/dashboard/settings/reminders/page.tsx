"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Clock, Calendar } from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { getReminderPreferences, updateReminderPreferences } from "@/actions/reminder-preferences.actions";

const reminderPreferencesSchema = z.object({
  enableTimesheetReminders: z.boolean(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)").optional(),
  reminderDays: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).optional(),
});

type ReminderPreferencesForm = z.infer<typeof reminderPreferencesSchema>;

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" },
] as const;

export default function ReminderPreferencesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReminderPreferencesForm>({
    resolver: zodResolver(reminderPreferencesSchema),
    defaultValues: {
      enableTimesheetReminders: true,
      reminderTime: "17:00",
      reminderDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    },
  });

  const enableReminders = watch("enableTimesheetReminders");

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const result = await getReminderPreferences({});
        if (result?.data) {
          setValue("enableTimesheetReminders", result.data.enableTimesheetReminders);
          setValue("reminderTime", result.data.reminderTime || "17:00");
          setValue("reminderDays", (result.data.reminderDays || []) as ("MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY")[]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des préférences:", error);
        toast.error("Erreur lors du chargement des préférences");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadPreferences();
  }, [setValue]);

  const onSubmit = async (data: ReminderPreferencesForm) => {
    setIsLoading(true);
    try {
      const result = await updateReminderPreferences(data);
      
      if (result?.data?.success) {
        toast.success("Préférences de rappel mises à jour !");
      } else {
        toast.error(result?.serverError || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour des préférences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    const currentDays = watch("reminderDays") || [];
    const validDay = day as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    if (checked) {
      setValue("reminderDays", [...currentDays, validDay]);
    } else {
      setValue("reminderDays", currentDays.filter((d) => d !== day));
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <SpinnerCustom />
          <p className="text-muted-foreground mt-4">Chargement des préférences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Préférences de rappel</h1>
        <p className="text-base text-muted-foreground mt-1">
          Configurez vos préférences pour recevoir des rappels de saisie de temps
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Rappels de saisie de temps
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les rappels pour vous aider à saisir vos heures de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Activation/Désactivation des rappels */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor="enableReminders" className="text-base font-medium">
                  Activer les rappels de saisie de temps
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevez des notifications pour vous rappeler de saisir vos heures de travail
                </p>
              </div>
              <Switch
                id="enableReminders"
                checked={enableReminders}
                onCheckedChange={(checked) => setValue("enableTimesheetReminders", checked)}
                className="self-start sm:self-center"
              />
            </div>

            {enableReminders && (
              <>
                <Separator />
                
                {/* Heure du rappel */}
                <div className="space-y-3">
                  <Label htmlFor="reminderTime" className="flex items-center gap-2 text-base font-medium">
                    <Clock className="h-4 w-4" />
                    Heure du rappel
                  </Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    {...register("reminderTime")}
                    className="w-full sm:w-32"
                  />
                  {errors.reminderTime && (
                    <p className="text-sm text-destructive">{errors.reminderTime.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    L'heure à laquelle vous souhaitez recevoir vos rappels
                  </p>
                </div>

                <Separator />

                {/* Jours de rappel */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Calendar className="h-4 w-4" />
                    Jours de rappel
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={(watch("reminderDays") || []).includes(day.value)}
                          onCheckedChange={(checked) => handleDayToggle(day.value, !!checked)}
                        />
                        <Label
                          htmlFor={day.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez les jours où vous souhaitez recevoir des rappels
                  </p>
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary"
                disabled={isLoading}
              >
                {isLoading ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>À propos des rappels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • Les rappels vous aideront à ne pas oublier de saisir vos heures de travail quotidiennes
          </p>
          <p>
            • Vous recevrez une notification à l'heure choisie pour les jours sélectionnés
          </p>
          <p>
            • Vous pouvez modifier ces préférences à tout moment
          </p>
          <p>
            • Les rappels ne sont envoyés que si vous n'avez pas encore saisi de temps pour la journée
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
