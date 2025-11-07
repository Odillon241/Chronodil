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
import { Calendar as CalendarIcon, Plus, Trash2, Save, ArrowLeft, Clock, CalendarDays } from "lucide-react";
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
} from "@/actions/hr-timesheet.actions";
import { getUserTasksForHRTimesheet } from "@/actions/task.actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Activity {
  taskId: string; // ID de la tâche liée (REQUIS)
  activityType: "OPERATIONAL" | "REPORTING";
  activityName: string;
  description?: string;
  periodicity: "DAILY" | "WEEKLY" | "MONTHLY" | "PUNCTUAL" | "WEEKLY_MONTHLY";
  weeklyQuantity?: number;
  startDate: Date;
  endDate: Date;
  status: "IN_PROGRESS" | "COMPLETED";
  catalogId?: string;
  // Champs de la tâche
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  complexity?: "FAIBLE" | "MOYEN" | "ÉLEVÉ";
  estimatedHours?: number;
  projectName?: string;
  projectColor?: string;
}

interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  complexity?: "FAIBLE" | "MOYEN" | "ÉLEVÉ" | null;
  estimatedHours?: number | null;
  dueDate?: Date | null;
  Project?: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
}

export default function NewHRTimesheetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

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
      periodicity: "WEEKLY",
      startDate: new Date(),
      endDate: new Date(),
      status: "IN_PROGRESS",
    },
  });

  // Charger les tâches disponibles de l'utilisateur
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasksResult = await getUserTasksForHRTimesheet({});
        if (tasksResult?.data) {
          setAvailableTasks(tasksResult.data as Task[]);
        }
      } catch (error) {
        console.error("Erreur chargement des tâches:", error);
        toast.error("Erreur lors du chargement des tâches");
      }
    };
    loadTasks();
  }, []);

  // Ajout d'une tâche comme activité
  const handleAddTaskAsActivity = () => {
    if (!selectedTaskId) {
      toast.error("Veuillez sélectionner une tâche");
      return;
    }

    const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
    if (!selectedTask) {
      toast.error("Tâche non trouvée");
      return;
    }

    // Vérifier si la tâche n'est pas déjà dans la liste
    if (activities.some(a => a.taskId === selectedTaskId)) {
      toast.error("Cette tâche est déjà ajoutée");
      return;
    }

    // Créer l'activité depuis la tâche sélectionnée
    const activityData: Activity = {
      taskId: selectedTask.id,
      activityType: "OPERATIONAL", // Par défaut OPERATIONAL
      activityName: selectedTask.name,
      description: selectedTask.description || undefined,
      periodicity: watchActivity("periodicity") || "WEEKLY",
      startDate: watchActivity("startDate") || watchTimesheet("weekStartDate"),
      endDate: watchActivity("endDate") || watchTimesheet("weekEndDate"),
      status: watchActivity("status") || "IN_PROGRESS",
      priority: selectedTask.priority,
      complexity: selectedTask.complexity || undefined,
      estimatedHours: selectedTask.estimatedHours || undefined,
      projectName: selectedTask.Project?.name,
      projectColor: selectedTask.Project?.color,
    };

    setActivities([...activities, activityData]);
    setSelectedTaskId("");
    resetActivity();
    toast.success(`Tâche "${selectedTask.name}" ajoutée à la semaine !`);
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
          {/* Sélection de tâches existantes */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Sélectionner une tâche de la semaine</h3>

              {availableTasks.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-background">
                  <p className="text-muted-foreground">Aucune tâche disponible</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Créez d'abord des tâches dans l'onglet "Tâches"
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="task">Tâche *</Label>
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une tâche" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            <div className="flex items-center gap-2">
                              {task.Project && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: task.Project.color }}
                                />
                              )}
                              <span>{task.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {task.priority === "URGENT" ? "🔥 Urgent" :
                                 task.priority === "HIGH" ? "⬆️ Haute" :
                                 task.priority === "MEDIUM" ? "➡️ Moyenne" : "⬇️ Basse"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTaskId && (
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                      <CardContent className="pt-4">
                        {(() => {
                          const task = availableTasks.find(t => t.id === selectedTaskId);
                          if (!task) return null;
                          return (
                            <div className="space-y-2 text-sm">
                              <p><strong>Nom:</strong> {task.name}</p>
                              {task.description && (
                                <p><strong>Description:</strong> {task.description}</p>
                              )}
                              {task.Project && (
                                <p><strong>Projet:</strong> {task.Project.name}</p>
                              )}
                              <div className="flex gap-2">
                                <Badge>{task.status}</Badge>
                                <Badge variant="outline">{task.priority}</Badge>
                                {task.complexity && <Badge variant="secondary">{task.complexity}</Badge>}
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="periodicity">Périodicité</Label>
                      <Select
                        value={watchActivity("periodicity") || "WEEKLY"}
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
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={watchActivity("status") || "IN_PROGRESS"}
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
                      <Label>Date début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(
                              watchActivity("startDate") || watchTimesheet("weekStartDate"),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={watchActivity("startDate") || watchTimesheet("weekStartDate")}
                            onSelect={(d) => d && setActivityValue("startDate", d)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(
                              watchActivity("endDate") || watchTimesheet("weekEndDate"),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={watchActivity("endDate") || watchTimesheet("weekEndDate")}
                            onSelect={(d) => d && setActivityValue("endDate", d)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      onClick={handleAddTaskAsActivity}
                      className="bg-primary hover:bg-primary"
                      disabled={!selectedTaskId || isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter cette tâche
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedTaskId("");
                        resetActivity();
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Liste des activités ajoutées */}
          {activities.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Aucune tâche ajoutée pour cette semaine</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sélectionnez une tâche ci-dessus pour l'ajouter à votre feuille de temps
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* En-tête avec projet */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {activity.projectName && (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: activity.projectColor || "#3b82f6" }}
                              />
                              <span className="text-xs font-medium">{activity.projectName}</span>
                            </div>
                          )}
                          <Badge variant={activity.activityType === "OPERATIONAL" ? "default" : "secondary"}>
                            {activity.activityType === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {activity.periodicity === "DAILY" ? "Quotidien" :
                             activity.periodicity === "WEEKLY" ? "Hebdomadaire" :
                             activity.periodicity === "MONTHLY" ? "Mensuel" :
                             activity.periodicity === "PUNCTUAL" ? "Ponctuel" :
                             activity.periodicity === "WEEKLY_MONTHLY" ? "Hebdo/Mensuel" :
                             activity.periodicity}
                          </Badge>
                          <Badge variant={activity.status === "COMPLETED" ? "default" : "secondary"}>
                            {activity.status === "COMPLETED" ? "Terminé" : "En cours"}
                          </Badge>
                          {activity.priority && (
                            <Badge variant={
                              activity.priority === "URGENT" ? "destructive" :
                              activity.priority === "HIGH" ? "default" :
                              "outline"
                            }>
                              {activity.priority === "URGENT" ? "🔥 Urgent" :
                               activity.priority === "HIGH" ? "⬆️ Haute" :
                               activity.priority === "MEDIUM" ? "➡️ Moyenne" : "⬇️ Basse"}
                            </Badge>
                          )}
                        </div>

                        {/* Nom de l'activité/tâche */}
                        <div>
                          <h4 className="font-semibold text-base">{activity.activityName}</h4>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                        </div>

                        {/* Informations de période et durée */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Période:</span>
                            <span className="font-medium">
                              {format(activity.startDate, "dd/MM/yyyy", { locale: fr })}
                              {" → "}
                              {format(activity.endDate, "dd/MM/yyyy", { locale: fr })}
                            </span>
                          </div>
                          <Separator orientation="vertical" className="hidden sm:block h-4" />
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Durée:</span>
                            <span className="font-semibold text-primary text-base">
                              {calculateActivityDuration(activity.startDate, activity.endDate)}h
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bouton de suppression */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveActivity(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Total des heures */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <p className="font-semibold text-base">Total heures des activités</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{totalActivitiesHours}h</p>
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
