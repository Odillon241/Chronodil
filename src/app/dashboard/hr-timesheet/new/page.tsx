"use client";

import { useState, useEffect } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { calculateWorkingHours } from "@/lib/business-hours";
import {
  createHRTimesheet,
  addHRActivity,
  getActivityCatalog,
  getActivityCategories,
} from "@/actions/hr-timesheet.actions";
import { getUserTasksForHRTimesheet } from "@/actions/task.actions";
import { getMyProfile } from "@/actions/user.actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HRTimesheetActivitiesTable } from "@/components/hr-timesheet/hr-timesheet-activities-table";

interface Activity {
  taskId?: string;
  activityType: "OPERATIONAL" | "REPORTING";
  activityName: string;
  description?: string;
  periodicity: "DAILY" | "WEEKLY" | "MONTHLY" | "PUNCTUAL" | "WEEKLY_MONTHLY";
  weeklyQuantity?: number;
  totalHours?: number;
  startDate: Date;
  endDate: Date;
  status: "IN_PROGRESS" | "COMPLETED";
  soundEnabled: boolean;
  catalogId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  complexity?: "FAIBLE" | "MOYEN" | "LEV_";
  estimatedHours?: number;
  projectName?: string;
  projectColor?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  type: string;
  defaultPeriodicity?: string | null;
  description?: string | null;
}

interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  complexity?: "FAIBLE" | "MOYEN" | "LEV_" | null;
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
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [inputMode, setInputMode] = useState<"task" | "manual">("task");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");

  const {
    register: registerTimesheet,
    handleSubmit: handleSubmitTimesheet,
    setValue: setTimesheetValue,
    watch: watchTimesheet,
    formState: { errors: timesheetErrors },
  } = useForm<HRTimesheetInput>({
    resolver: zodResolver(hrTimesheetSchema),
    defaultValues: {
      // Semaine de travail : du lundi au vendredi
      weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      weekEndDate: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 4), // Vendredi
      employeeName: "",
      position: "",
      site: "",
      employeeObservations: "",
    },
  });

  const {
    register: registerActivity,
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

  // Charger le profil utilisateur et pré-remplir les champs
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileResult = await getMyProfile({});
        if (profileResult?.data) {
          const userData = profileResult.data as any;
          setTimesheetValue("employeeName", userData.name || "");
          setTimesheetValue("position", userData.position || "");
        }
      } catch (error) {
        console.error("Erreur chargement profil utilisateur:", error);
      }
    };
    loadUserProfile();
  }, [setTimesheetValue]);

  // Charger les tâches et le catalogue
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksResult, catalogResult, categoriesResult] = await Promise.all([
          getUserTasksForHRTimesheet({}),
          getActivityCatalog({}),
          getActivityCategories(),
        ]);

        console.log("📊 Résultats chargement:", {
          tasksResult,
          tasksData: tasksResult?.data,
          tasksLength: tasksResult?.data?.length,
          tasksServerError: tasksResult?.serverError,
          catalogLength: catalogResult?.data?.length,
          categoriesLength: categoriesResult?.data?.length,
        });

        // Vérifier les erreurs d'authentification
        if (tasksResult?.serverError) {
          console.error("❌ Erreur serveur (tâches):", tasksResult.serverError);
          if (tasksResult.serverError === "Unauthorized" || tasksResult.serverError.includes("authentifi")) {
            toast.error("Session expirée. Veuillez vous reconnecter.");
            return;
          }
        }

        if (tasksResult?.data) {
          console.log("✅ Tâches chargées:", tasksResult.data.length, "tâches");
          setAvailableTasks(tasksResult.data as Task[]);
        } else if (!tasksResult?.serverError) {
          console.warn("⚠️ Aucune tâche active (TODO/IN_PROGRESS) trouvée pour cet utilisateur");
        }

        if (catalogResult?.data) {
          setCatalog(catalogResult.data);
        }
        if (categoriesResult?.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        console.error("❌ Erreur chargement des données:", error);
        toast.error("Erreur lors du chargement des données");
      }
    };
    loadData();
  }, []);

  // Pré-remplir les dates avec celles du timesheet
  useEffect(() => {
    const weekStart = watchTimesheet("weekStartDate");
    const weekEnd = watchTimesheet("weekEndDate");
    if (weekStart) setActivityValue("startDate", weekStart);
    if (weekEnd) setActivityValue("endDate", weekEnd);
  }, [watchTimesheet("weekStartDate"), watchTimesheet("weekEndDate"), setActivityValue]);

  // Gérer la sélection de tâche
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      setActivityValue("activityName", task.name);
      setActivityValue("description", task.description || "");
      setActivityValue("activityType", "OPERATIONAL");
    }
  };

  // Déterminer le type à partir de la catégorie
  const getTypeFromCategory = (category: string): "OPERATIONAL" | "REPORTING" => {
    return category === "CONTROLE ET REPORTING" ? "REPORTING" : "OPERATIONAL";
  };

  // Filtrer les activités du catalogue selon la catégorie
  const filteredCatalogActivities = selectedCategory
    ? catalog.filter(item => item.category === selectedCategory)
    : [];

  // Gérer la sélection d'activité du catalogue
  const handleCatalogItemSelect = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const catalogItem = catalog.find(c => c.id === catalogId);
    if (catalogItem) {
      // Auto-remplir les champs
      setActivityValue("activityName", catalogItem.name);
      setActivityValue("activityType", getTypeFromCategory(catalogItem.category));
      setActivityValue("catalogId", catalogItem.id);
      if (catalogItem.description) {
        setActivityValue("description", catalogItem.description);
      }
      if (catalogItem.defaultPeriodicity) {
        setActivityValue("periodicity", catalogItem.defaultPeriodicity as any);
      }
    }
  };

  // Ajout d'une activité
  const handleAddActivity = () => {
    const activityData = watchActivity();

    if (!activityData.activityName) {
      toast.error("Le nom de l'activité est requis");
      return;
    }

    if (inputMode === "task" && !selectedTaskId) {
      toast.error("Veuillez sélectionner une tâche");
      return;
    }

    // Vérifier les doublons de tâches
    if (inputMode === "task" && activities.some(a => a.taskId === selectedTaskId)) {
      toast.error("Cette tâche est déjà ajoutée");
      return;
    }

    const selectedTask = inputMode === "task" ? availableTasks.find(t => t.id === selectedTaskId) : null;

    const activity: Activity = {
      taskId: inputMode === "task" ? selectedTaskId : undefined,
      activityType: activityData.activityType,
      activityName: activityData.activityName,
      description: activityData.description,
      periodicity: activityData.periodicity,
      weeklyQuantity: activityData.weeklyQuantity,
      totalHours: activityData.totalHours,
      startDate: activityData.startDate,
      endDate: activityData.endDate,
      status: activityData.status ?? "IN_PROGRESS",
      soundEnabled: false, // Default: no sound notification
      catalogId: activityData.catalogId,
      priority: selectedTask?.priority,
      complexity: selectedTask?.complexity || undefined,
      estimatedHours: selectedTask?.estimatedHours || undefined,
      projectName: selectedTask?.Project?.name,
      projectColor: selectedTask?.Project?.color,
    };

    setActivities([...activities, activity]);
    resetActivity();
    setSelectedTaskId("");
    setSelectedCategory("");
    setSelectedCatalogId("");
    setActivityValue("startDate", watchTimesheet("weekStartDate"));
    setActivityValue("endDate", watchTimesheet("weekEndDate"));
    toast.success("Activité ajoutée à la liste !");
  };

  // Suppression d'activité
  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
    toast.success("Activité retirée de la liste");
  };

  // Soumission finale
  const onSubmitFinal = async (data: HRTimesheetInput) => {
    if (activities.length === 0) {
      toast.error("Veuillez ajouter au moins une activité");
      return;
    }

    setIsLoading(true);
    try {
      const timesheetResult = await createHRTimesheet(data);

      if (!timesheetResult?.data) {
        toast.error(timesheetResult?.serverError || "Erreur lors de la création du timesheet");
        return;
      }

      const timesheetId = timesheetResult.data.id;

      let successCount = 0;
      for (const activity of activities) {
        // Transformer l'objet Activity local en HRActivityInput compatible avec le backend
        // On ne garde QUE les champs définis dans hrActivitySchema
        const activityInput: HRActivityInput = {
          activityType: activity.activityType,
          activityName: activity.activityName,
          description: activity.description,
          periodicity: activity.periodicity,
          weeklyQuantity: activity.weeklyQuantity,
          totalHours: activity.totalHours,
          startDate: activity.startDate,
          endDate: activity.endDate,
          status: activity.status,
          soundEnabled: activity.soundEnabled,
          catalogId: activity.catalogId,
          taskId: activity.taskId, // ✅ Lier la tâche existante
          priority: activity.priority,
          complexity: activity.complexity,
          estimatedHours: activity.estimatedHours,
        };

        console.log("📤 Envoi activité au backend:", {
          taskId: activityInput.taskId,
          activityName: activityInput.activityName,
        });

        const activityResult = await addHRActivity({
          timesheetId,
          activity: activityInput,
        });

        if (activityResult?.serverError) {
          console.error("❌ Erreur création activité:", activityResult.serverError);
        }

        if (activityResult?.data) {
          successCount++;
          console.log("✅ Activité créée avec succès, taskId:", activityResult.data.taskId);
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


  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouvelle feuille de temps RH</h1>
        <p className="text-muted-foreground">Créez un nouveau timesheet hebdomadaire</p>
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
                        // Semaine de travail : du lundi au vendredi (4 jours après lundi)
                        const weekEnd = addDays(weekStart, 4);
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

      {/* Formulaire d'ajout d'activité - LINÉAIRE */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une activité à la semaine</CardTitle>
          <CardDescription>
            Sélectionnez une tâche existante ou saisissez une activité manuellement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Choix du mode de saisie */}
          <div className="space-y-2">
            <Label>Mode de saisie</Label>
            <RadioGroup value={inputMode} onValueChange={(v) => setInputMode(v as "task" | "manual")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="task" id="mode-task" />
                <Label htmlFor="mode-task" className="font-normal cursor-pointer">
                  Tâche existante
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="mode-manual" />
                <Label htmlFor="mode-manual" className="font-normal cursor-pointer">
                  Saisie manuelle
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Sélection de tâche */}
          {inputMode === "task" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task">Tâche *</Label>
                {availableTasks.length === 0 ? (
                  <div className="text-center py-4 border rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Aucune tâche active disponible. Créez des tâches dans l'onglet "Tâches".
                    </p>
                  </div>
                ) : (
                  <Select value={selectedTaskId} onValueChange={handleTaskSelect}>
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
                              {task.priority === "URGENT" ? "🔥" :
                               task.priority === "HIGH" ? "⬆️" :
                               task.priority === "MEDIUM" ? "➡️" : "⬇️"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedTaskId && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                  <CardContent className="pt-4">
                    {(() => {
                      const task = availableTasks.find(t => t.id === selectedTaskId);
                      if (!task) return null;
                      return (
                        <div className="space-y-2 text-sm">
                          <p><strong>Nom:</strong> {task.name}</p>
                          {task.description && <p><strong>Description:</strong> {task.description}</p>}
                          {task.Project && <p><strong>Projet:</strong> {task.Project.name}</p>}
                          <div className="flex gap-2 flex-wrap">
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
            </div>
          )}

          {/* Saisie manuelle */}
          {inputMode === "manual" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedCatalogId("");
                      setActivityValue("activityName", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nom de l'activité *</Label>
                  <Select
                    value={selectedCatalogId}
                    onValueChange={handleCatalogItemSelect}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCategory ? "Sélectionner une activité" : "Sélectionnez d'abord une catégorie"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {filteredCatalogActivities.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activityErrors.activityName && (
                    <p className="text-sm text-destructive">{activityErrors.activityName.message}</p>
                  )}
                </div>
              </div>

              {/* Afficher le type auto-sélectionné */}
              {selectedCatalogId && (
                <div className="space-y-2">
                  <Label>Type d'activité (auto)</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={watchActivity("activityType") === "OPERATIONAL" ? "default" : "secondary"}>
                      {watchActivity("activityType") === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Basé sur la catégorie sélectionnée
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Détails supplémentaires..."
                  rows={2}
                  {...registerActivity("description")}
                />
              </div>
            </div>
          )}

          {/* Champs communs (toujours visibles) */}
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Périodicité *</Label>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut *</Label>
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
              <Label htmlFor="weeklyQuantity">Quantité hebdomadaire</Label>
              <Input
                id="weeklyQuantity"
                type="number"
                min="0"
                step="1"
                placeholder="Ex: 5"
                {...registerActivity("weeklyQuantity", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de fois que l'activité est effectuée par semaine
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalHours">Durée totale (heures)</Label>
              <Input
                id="totalHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="Ex: 8.5"
                {...registerActivity("totalHours", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Nombre total d'heures consacrées à cette activité
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Date début *</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Date fin *</Label>
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
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={handleAddActivity}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter l'activité
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetActivity();
                setSelectedTaskId("");
                setSelectedCategory("");
                setSelectedCatalogId("");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des activités ajoutées */}
      <Card>
        <CardHeader>
          <CardTitle>Activités de la semaine</CardTitle>
          <CardDescription>
            Liste des activités qui seront ajoutées à cette feuille de temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Aucune activité ajoutée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajoutez des activités via le formulaire ci-dessus
              </p>
            </div>
          ) : (
            <>
              <HRTimesheetActivitiesTable
                activities={activities.map((activity, index) => {
                  const catalogItem = activity.catalogId 
                    ? catalog.find(item => item.id === activity.catalogId)
                    : null;
                  
                  return {
                    id: `temp-${index}`,
                    activityType: activity.activityType,
                    activityName: activity.activityName,
                    description: activity.description,
                    periodicity: activity.periodicity,
                    startDate: activity.startDate,
                    endDate: activity.endDate,
                    totalHours: activity.totalHours || calculateWorkingHours(activity.startDate, activity.endDate),
                    status: activity.status,
                    ActivityCatalog: catalogItem ? {
                      name: catalogItem.name,
                      category: catalogItem.category
                    } : null,
                  };
                })}
                onDelete={(id) => {
                  const index = parseInt(id.replace("temp-", ""));
                  handleRemoveActivity(index);
                }}
                showActions={true}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Bouton de soumission finale */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitTimesheet(onSubmitFinal)}
              disabled={isLoading || activities.length === 0}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Création en cours...
                </span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer la feuille de temps
                </>
              )}
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

