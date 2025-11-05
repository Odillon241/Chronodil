"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hrTimesheetSchema, hrActivitySchema, type HRTimesheetInput, type HRActivityInput } from "@/lib/validations/hr-timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  createHRTimesheet,
  addHRActivity,
  getActivityCatalog,
} from "@/actions/hr-timesheet.actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Activity {
  activityType: "OPERATIONAL" | "REPORTING";
  activityName: string;
  description?: string;
  periodicity: "DAILY" | "WEEKLY" | "MONTHLY" | "PUNCTUAL" | "WEEKLY_MONTHLY";
  weeklyQuantity?: number;
  startDate: Date;
  endDate: Date;
  status: "IN_PROGRESS" | "COMPLETED";
  catalogId?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  type: string;
  defaultPeriodicity?: string | null;
  description?: string | null;
}

export default function NewHRTimesheetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  const {
    register: registerTimesheet,
    handleSubmit: handleSubmitTimesheet,
    setValue: setTimesheetValue,
    watch: watchTimesheet,
    formState: { errors: timesheetErrors },
  } = useForm<HRTimesheetInput>({
    resolver: zodResolver(hrTimesheetSchema),
    defaultValues: {
      weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      weekEndDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
      employeeName: "",
      position: "",
      site: "",
      employeeObservations: "",
    },
  });

  const {
    register: registerActivity,
    handleSubmit: handleSubmitActivity,
    setValue: setActivityValue,
    watch: watchActivity,
    reset: resetActivity,
    formState: { errors: activityErrors },
  } = useForm<HRActivityInput>({
    resolver: zodResolver(hrActivitySchema),
    defaultValues: {
      activityType: "OPERATIONAL",
      activityName: "",
      description: "",
      periodicity: "DAILY",
      startDate: new Date(),
      endDate: new Date(),
      status: "IN_PROGRESS",
    },
  });

  // Charger le catalogue d'activités
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const result = await getActivityCatalog({});
        if (result?.data) {
          setCatalog(result.data);
        }
      } catch (error) {
        console.error("Erreur chargement catalogue:", error);
      }
    };
    loadCatalog();
  }, []);

  // Ajout d'activité en local (sans appel API)
  const onSubmitActivity = (data: HRActivityInput) => {
    setActivities([...activities, data]);
    resetActivity();
    toast.success("Activité ajoutée à la liste !");
  };

  // Suppression d'activité de la liste locale
  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
    toast.success("Activité retirée de la liste");
  };

  // Soumission finale : crée le timesheet et ajoute toutes les activités
  const onSubmitFinal = async (data: HRTimesheetInput) => {
    if (activities.length === 0) {
      toast.error("Veuillez ajouter au moins une activité");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Créer le timesheet
      const timesheetResult = await createHRTimesheet(data);

      if (!timesheetResult?.data) {
        toast.error(timesheetResult?.serverError || "Erreur lors de la création du timesheet");
        return;
      }

      const timesheetId = timesheetResult.data.id;

      // 2. Ajouter toutes les activités
      let successCount = 0;
      for (const activity of activities) {
        const activityResult = await addHRActivity({
          timesheetId,
          activity,
        });
        if (activityResult?.data) {
          successCount++;
        }
      }

      if (successCount === activities.length) {
        toast.success(`Feuille de temps créée avec ${successCount} activité(s) !`);
        router.push("/dashboard/hr-timesheet");
      } else {
        toast.warning(`Timesheet créé mais seulement ${successCount}/${activities.length} activités ajoutées`);
        router.push(`/dashboard/hr-timesheet/${timesheetId}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateActivityDuration = (start: Date, end: Date): number => {
    const days = differenceInDays(end, start);
    return days * 24;
  };

  const totalActivitiesHours = activities.reduce((sum, activity) => {
    return sum + calculateActivityDuration(activity.startDate, activity.endDate);
  }, 0);

  // Filtrer les activités opérationnelles du catalogue
  const operationalActivities = catalog.filter(item => item.type === "OPERATIONAL");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle feuille de temps RH</h1>
          <p className="text-muted-foreground">Créez un nouveau timesheet hebdomadaire</p>
        </div>
      </div>

      {/* Informations générales du timesheet */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Renseignez les informations de base de votre feuille de temps hebdomadaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekStartDate">Date début semaine *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(watchTimesheet("weekStartDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchTimesheet("weekStartDate") ?? new Date()}
                    onSelect={(d: Date | undefined) => {
                      if (d) {
                        const weekStart = startOfWeek(d, { weekStartsOn: 1 });
                        const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
                        setTimesheetValue("weekStartDate", weekStart);
                        setTimesheetValue("weekEndDate", weekEnd);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {timesheetErrors.weekStartDate && (
                <p className="text-sm text-destructive">{timesheetErrors.weekStartDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekEndDate">Date fin semaine *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(watchTimesheet("weekEndDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchTimesheet("weekEndDate") ?? new Date()}
                    onSelect={(d: Date | undefined) => d && setTimesheetValue("weekEndDate", d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {timesheetErrors.weekEndDate && (
                <p className="text-sm text-destructive">{timesheetErrors.weekEndDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Nom de l'employé *</Label>
              <Input
                id="employeeName"
                placeholder="Nom complet"
                {...registerTimesheet("employeeName")}
              />
              {timesheetErrors.employeeName && (
                <p className="text-sm text-destructive">{timesheetErrors.employeeName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste *</Label>
              <Input
                id="position"
                placeholder="Titre du poste"
                {...registerTimesheet("position")}
              />
              {timesheetErrors.position && (
                <p className="text-sm text-destructive">{timesheetErrors.position.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Site *</Label>
              <Input
                id="site"
                placeholder="Lieu de travail"
                {...registerTimesheet("site")}
              />
              {timesheetErrors.site && (
                <p className="text-sm text-destructive">{timesheetErrors.site.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeObservations">Observations (optionnel)</Label>
            <Textarea
              id="employeeObservations"
              placeholder="Remarques ou observations particulières..."
              rows={3}
              {...registerTimesheet("employeeObservations")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activités de la semaine */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités de la semaine</CardTitle>
              <CardDescription>
                Ajoutez les activités réalisées durant cette semaine
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'ajout d'activité - Toujours visible */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <form onSubmit={handleSubmitActivity(onSubmitActivity)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activityType">Type d'activité *</Label>
                  <Select
                    value={watchActivity("activityType")}
                    onValueChange={(value: any) => setActivityValue("activityType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATIONAL">Opérationnelle</SelectItem>
                      <SelectItem value="REPORTING">Reporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityName">Nom de l'activité *</Label>
                  {watchActivity("activityType") === "OPERATIONAL" && operationalActivities.length > 0 ? (
                    <Select
                      value={watchActivity("activityName") || ""}
                      onValueChange={(value) => {
                        const selectedActivity = operationalActivities.find(act => act.name === value);
                        if (selectedActivity) {
                          setActivityValue("activityName", selectedActivity.name);
                          setActivityValue("catalogId", selectedActivity.id);
                          if (selectedActivity.defaultPeriodicity) {
                            setActivityValue("periodicity", selectedActivity.defaultPeriodicity as any);
                          }
                          if (selectedActivity.description) {
                            setActivityValue("description", selectedActivity.description);
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une activité du catalogue" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {operationalActivities.map((activity) => (
                          <SelectItem key={activity.id} value={activity.name}>
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="activityName"
                      placeholder="Description de l'activité"
                      {...registerActivity("activityName")}
                    />
                  )}
                  {activityErrors.activityName && (
                    <p className="text-sm text-destructive">{activityErrors.activityName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Détails supplémentaires..."
                  rows={2}
                  {...registerActivity("description")}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="periodicity">Périodicité *</Label>
                  <Select
                    value={watchActivity("periodicity")}
                    onValueChange={(value: any) => setActivityValue("periodicity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Quotidien</SelectItem>
                      <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                      <SelectItem value="MONTHLY">Mensuel</SelectItem>
                      <SelectItem value="PUNCTUAL">Ponctuel</SelectItem>
                      <SelectItem value="WEEKLY_MONTHLY">Hebdo/Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={watchActivity("status")}
                    onValueChange={(value: any) => setActivityValue("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date début *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(watchActivity("startDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={watchActivity("startDate") ?? new Date()}
                        onSelect={(d) => d && setActivityValue("startDate", d)}
                      />
                    </PopoverContent>
                  </Popover>
                  {activityErrors.startDate && (
                    <p className="text-sm text-destructive">{activityErrors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Date fin *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(watchActivity("endDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={watchActivity("endDate") ?? new Date()}
                        onSelect={(d) => d && setActivityValue("endDate", d)}
                      />
                    </PopoverContent>
                  </Popover>
                  {activityErrors.endDate && (
                    <p className="text-sm text-destructive">{activityErrors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary"
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter à la liste
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetActivity()}
                >
                  Réinitialiser
                </Button>
              </div>
            </form>
          </div>

          {/* Liste des activités ajoutées */}
          {activities.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Aucune activité ajoutée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Remplissez le formulaire ci-dessus ou utilisez le catalogue pour ajouter des activités
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="p-4 border rounded-lg flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={activity.activityType === "OPERATIONAL" ? "default" : "secondary"}>
                        {activity.activityType === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
                      </Badge>
                      <Badge variant="outline">{activity.periodicity}</Badge>
                      <Badge variant={activity.status === "COMPLETED" ? "default" : "secondary"}>
                        {activity.status === "COMPLETED" ? "Terminé" : "En cours"}
                      </Badge>
                    </div>
                    <h4 className="font-semibold">{activity.activityName}</h4>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    )}
                    <div className="text-sm mt-2">
                      <span className="text-muted-foreground">Période: </span>
                      <span>
                        {format(activity.startDate, "dd/MM/yyyy", { locale: fr })}
                        {" → "}
                        {format(activity.endDate, "dd/MM/yyyy", { locale: fr })}
                      </span>
                      <span className="ml-4 font-semibold text-primary">
                        {calculateActivityDuration(activity.startDate, activity.endDate)}h
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveActivity(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Card className="bg-primary/10 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Total heures des activités</p>
                    <p className="text-2xl font-bold text-primary">{totalActivitiesHours}h</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton de soumission finale */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitTimesheet(onSubmitFinal)}
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || activities.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Création en cours..." : "Créer la feuille de temps"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          </div>
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Veuillez ajouter au moins une activité avant de créer la feuille de temps
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
