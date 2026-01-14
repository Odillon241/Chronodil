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
import { Calendar as CalendarIcon, Plus, Trash2, Save, ArrowLeft, Clock, CalendarDays, Briefcase, MapPin, User, Loader2 } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
  totalHours: number;
  startDate: Date;
  endDate: Date;
  status: "IN_PROGRESS" | "COMPLETED";
  soundEnabled: boolean;
  catalogId?: string;
  projectColor?: string;
  projectName?: string;
  // Extra fields for UI and Task syncing
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  complexity?: "FAIBLE" | "MOYEN" | "LEV_";
  estimatedHours?: number;
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- Timesheet Form ---
  const {
    register: registerTimesheet,
    handleSubmit: handleSubmitTimesheet,
    setValue: setTimesheetValue,
    watch: watchTimesheet,
    formState: { errors: timesheetErrors },
  } = useForm<HRTimesheetInput>({
    resolver: zodResolver(hrTimesheetSchema),
    defaultValues: {
      weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Lundi
      weekEndDate: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 4), // Vendredi
      employeeName: "",
      position: "",
      site: "",
      employeeObservations: "",
    },
  });

  // --- Activity Form ---
  const {
    register: registerActivity,
    handleSubmit: handleSubmitActivity,
    setValue: setActivityValue,
    watch: watchActivity,
    reset: resetActivity,
    formState: { errors: activityErrors },
  } = useForm<HRActivityInput>({
    resolver: zodResolver(hrActivitySchema) as any,
    defaultValues: {
      activityType: "OPERATIONAL",
      activityName: "",
      description: "",
      periodicity: "WEEKLY",
      startDate: new Date(),
      endDate: new Date(),
      status: "IN_PROGRESS",
      totalHours: 0,
      weeklyQuantity: 0,
      soundEnabled: true,
    },
  });

  // Load User Profile
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
        console.error("Erreur chargement profil:", error);
      }
    };
    loadUserProfile();
  }, [setTimesheetValue]);

  // Load Tasks & Catalog
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksResult, catalogResult, categoriesResult] = await Promise.all([
          getUserTasksForHRTimesheet({}),
          getActivityCatalog({}),
          getActivityCategories(),
        ]);

        if (tasksResult?.data) setAvailableTasks(tasksResult.data as Task[]);
        if (catalogResult?.data) setCatalog(catalogResult.data);
        if (categoriesResult?.data) setCategories(categoriesResult.data);
      } catch (error) {
        console.error("Erreur chargement données:", error);
        toast.error("Erreur lors du chargement des données");
      }
    };
    loadData();
  }, []);

  // Sync Activity Dates with Timesheet Dates
  useEffect(() => {
    if (isSheetOpen) {
      const weekStart = watchTimesheet("weekStartDate");
      const weekEnd = watchTimesheet("weekEndDate");
      if (weekStart) setActivityValue("startDate", weekStart);
      if (weekEnd) setActivityValue("endDate", weekEnd);
    }
  }, [isSheetOpen, watchTimesheet, setActivityValue]);

  // Handle Logic
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      setActivityValue("activityName", task.name);
      setActivityValue("description", task.description || "");
      setActivityValue("activityType", "OPERATIONAL");
      setActivityValue("priority", task.priority);
      setActivityValue("complexity", task.complexity || undefined);
      setActivityValue("estimatedHours", task.estimatedHours || undefined);
    }
  };

  const handleCatalogItemSelect = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const item = catalog.find(c => c.id === catalogId);
    if (item) {
      setActivityValue("activityName", item.name);
      setActivityValue("activityType", item.category === "CONTROLE ET REPORTING" ? "REPORTING" : "OPERATIONAL");
      setActivityValue("catalogId", item.id);
      if (item.defaultPeriodicity) setActivityValue("periodicity", item.defaultPeriodicity as any);
      if (item.description) setActivityValue("description", item.description);
    }
  };

  // Fonction appelée après validation Zod réussie
  const handleAddActivity = (data: HRActivityInput) => {
    // Validation supplémentaire du mode de saisie
    if (inputMode === "task" && !selectedTaskId) {
      toast.error("Sélectionnez une tâche");
      return;
    }
    if (inputMode === "manual" && !selectedCategory) {
      toast.error("Sélectionnez une catégorie");
      return;
    }

    const selectedTask = inputMode === "task" ? availableTasks.find(t => t.id === selectedTaskId) : null;

    const newActivity: Activity & { _tempId: string } = {
      activityType: data.activityType,
      activityName: data.activityName,
      description: data.description,
      periodicity: data.periodicity,
      weeklyQuantity: data.weeklyQuantity as number | undefined,
      totalHours: (data.totalHours as number) || 0,
      startDate: data.startDate as Date,
      endDate: data.endDate as Date,
      status: data.status || "IN_PROGRESS",
      taskId: inputMode === "task" ? selectedTaskId : undefined,
      catalogId: data.catalogId,
      projectName: selectedTask?.Project?.name,
      projectColor: selectedTask?.Project?.color,
      soundEnabled: data.soundEnabled ?? true,
      priority: data.priority,
      complexity: data.complexity,
      estimatedHours: data.estimatedHours as number | undefined,
      _tempId: crypto.randomUUID(),
    };

    console.log("📋 Activité validée ajoutée au state:", newActivity);
    setActivities([...activities, newActivity]);

    // Reset and Close
    resetActivity();
    setSelectedTaskId("");
    setSelectedCategory("");
    setSelectedCatalogId("");
    setIsSheetOpen(false);
    toast.success("Activité ajoutée");
  };

  const onSubmitFinal = async (data: HRTimesheetInput) => {
    if (activities.length === 0) {
      toast.error("Ajoutez au moins une activité");
      return;
    }

    setIsLoading(true);
    try {
      const tsResult = await createHRTimesheet(data);
      if (!tsResult?.data) throw new Error(tsResult?.serverError || "Erreur création");

      const timesheetId = tsResult.data.id;
      let successCount = 0;
      const errors: string[] = [];

      for (const act of activities) {
        // Ensure dates are proper Date objects (fix serialization issues)
        const startDate = act.startDate instanceof Date ? act.startDate : new Date(act.startDate);
        const endDate = act.endDate instanceof Date ? act.endDate : new Date(act.endDate);

        // Prepare input strictly
        const actInput: HRActivityInput = {
          activityType: act.activityType,
          activityName: act.activityName,
          description: act.description,
          periodicity: act.periodicity,
          weeklyQuantity: act.weeklyQuantity,
          totalHours: act.totalHours,
          startDate,
          endDate,
          status: act.status,
          taskId: act.taskId,
          catalogId: act.catalogId,
          priority: act.priority,
          complexity: act.complexity,
          estimatedHours: act.estimatedHours,
          soundEnabled: act.soundEnabled,
        };

        console.log("📤 Envoi activité:", act.activityName, { startDate, endDate, totalHours: act.totalHours });

        const res = await addHRActivity({ timesheetId, activity: actInput });

        if (res?.data) {
          successCount++;
          console.log("✅ Activité créée:", act.activityName);
        } else {
          // Log détaillé de l'erreur pour diagnostic
          console.error("❌ Échec création activité:", act.activityName, {
            serverError: res?.serverError,
            validationErrors: res?.validationErrors,
            fullResponse: res,
            sentData: actInput,
          });

          // Extraire le message d'erreur
          let errorMsg = "Erreur inconnue";
          if (res?.serverError) {
            errorMsg = res.serverError;
          } else if (res?.validationErrors) {
            // Les erreurs de validation Zod sont structurées
            const valErrors = res.validationErrors;
            if (valErrors.activity) {
              // Erreurs imbriquées dans l'objet activity
              errorMsg = Object.entries(valErrors.activity)
                .map(([field, err]) => `${field}: ${Array.isArray(err) ? err.join(', ') : err}`)
                .join('; ');
            } else {
              errorMsg = JSON.stringify(valErrors);
            }
          }
          errors.push(`${act.activityName}: ${errorMsg}`);
        }
      }

      if (successCount === activities.length) {
        toast.success(`Feuille créée avec ${successCount} activités`);
      } else if (successCount > 0) {
        toast.warning(`Feuille créée avec ${successCount}/${activities.length} activités. Erreurs: ${errors.join(", ")}`);
      } else {
        toast.error(`Feuille créée mais aucune activité n'a pu être ajoutée. Erreurs: ${errors.join(", ")}`);
      }

      router.push("/dashboard/hr-timesheet");
    } catch (err: any) {
      console.error("❌ Erreur création timesheet:", err);
      toast.error(err.message || "Erreur lors de la soumission");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCatalog = selectedCategory ? catalog.filter(c => c.category === selectedCategory) : [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Nouvelle Feuille de Temps</h1>
            <p className="text-sm text-muted-foreground">Remplissez les informations de la semaine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="destructive" onClick={() => router.back()} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            size="lg"
            onClick={handleSubmitTimesheet(onSubmitFinal)}
            disabled={isLoading}
            className="shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer la feuille
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Left Column: General Info (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Infos Employé
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom complet</Label>
                <div className="font-medium text-foreground">{watchTimesheet("employeeName") || "—"}</div>
                {/* Hidden input binding if needed, but handled by watch */}
                <input type="hidden" {...registerTimesheet("employeeName")} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Poste</Label>
                <Input {...registerTimesheet("position")} placeholder="Poste occupé" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Site</Label>
                <Input {...registerTimesheet("site")} placeholder="Site de travail" className="h-10" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Période
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Début de semaine</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(watchTimesheet("weekStartDate") as Date, "dd MMM yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchTimesheet("weekStartDate") as Date | undefined}
                      onSelect={(d) => {
                        if (d) {
                          const start = startOfWeek(d, { weekStartsOn: 1 });
                          setTimesheetValue("weekStartDate", start);
                          setTimesheetValue("weekEndDate", addDays(start, 4));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin de semaine</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(watchTimesheet("weekEndDate") as Date, "dd MMM yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchTimesheet("weekEndDate") as Date | undefined}
                      onSelect={(d) => d && setTimesheetValue("weekEndDate", d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Separator className="my-3" />

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observations</Label>
                <Textarea
                  {...registerTimesheet("employeeObservations")}
                  placeholder="Notes optionnelles..."
                  className="resize-none min-h-[60px] text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activities (2/3) */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Activités déclarées
              <Badge variant="secondary" className="ml-2">{activities.length}</Badge>
            </h2>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="shadow-sm border-primary/20 hover:bg-primary/5 text-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une activité
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
                <SheetHeader>
                  <SheetTitle>Nouvelle Activité</SheetTitle>
                  <SheetDescription>
                    Ajoutez une tâche ou une activité à votre feuille de temps.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Mode Selection */}
                  <div className="space-y-3">
                    <Label>Source de l'activité</Label>
                    <RadioGroup
                      value={inputMode}
                      onValueChange={(v) => setInputMode(v as any)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="mode-task"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${inputMode === 'task' ? 'border-primary' : ''}`}
                      >
                        <RadioGroupItem value="task" id="mode-task" className="sr-only" />
                        <Briefcase className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">Tâche assignée</span>
                      </Label>
                      <Label
                        htmlFor="mode-manual"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${inputMode === 'manual' ? 'border-primary' : ''}`}
                      >
                        <RadioGroupItem value="manual" id="mode-manual" className="sr-only" />
                        <Save className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">Saisie manuelle</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Task Input */}
                  {inputMode === 'task' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Sélectionner la tâche</Label>
                        <Select value={selectedTaskId} onValueChange={handleTaskSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une tâche..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTasks.length > 0 ? availableTasks.map(t => (
                              <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                                <div className="flex flex-col gap-0.5 text-left">
                                  <span className="font-medium">{t.name}</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    {t.Project && <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: t.Project.color }} />}
                                    {t.Project?.name || "Sans projet"} · {t.status}
                                  </span>
                                </div>
                              </SelectItem>
                            )) : <div className="p-2 text-sm text-muted-foreground">Aucune tâche disponible</div>}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedTaskId && (
                        <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground">
                          {availableTasks.find(t => t.id === selectedTaskId)?.description || "Pas de description"}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Input */}
                  {inputMode === 'manual' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedCatalogId(""); }}>
                          <SelectTrigger><SelectValue placeholder="Catégorie..." /></SelectTrigger>
                          <SelectContent>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nom de l'activité</Label>
                        {selectedCategory ? (
                          <Select value={selectedCatalogId} onValueChange={handleCatalogItemSelect}>
                            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent>
                              {filteredCatalog.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input placeholder="Sélectionnez d'abord une catégorie" disabled />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Heures totales</Label>
                      <Input type="number" step="0.5" {...registerActivity("totalHours", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={watchActivity("status")} onValueChange={(v: any) => setActivityValue("status", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                          <SelectItem value="COMPLETED">Terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fréquence</Label>
                      <Select value={watchActivity("periodicity")} onValueChange={(v: any) => setActivityValue("periodicity", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Quotidien</SelectItem>
                          <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                          <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                          <SelectItem value="PUNCTUAL">Ponctuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {watchActivity("periodicity") === "WEEKLY" && (
                      <div className="space-y-2">
                        <Label>Quantité hebdomadaire</Label>
                        <Input type="number" {...registerActivity("weeklyQuantity", { valueAsNumber: true })} />
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Du</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left h-9">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format((watchActivity("startDate") as Date) || new Date(), "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={watchActivity("startDate") as Date | undefined} onSelect={d => d && setActivityValue("startDate", d)} /></PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Au</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left h-9">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format((watchActivity("endDate") as Date) || new Date(), "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={watchActivity("endDate") as Date | undefined} onSelect={d => d && setActivityValue("endDate", d)} /></PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description / Notes</Label>
                    <Textarea {...registerActivity("description")} placeholder="Détails supplémentaires..." className="resize-none" rows={3} />
                  </div>

                </div>

                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </SheetClose>
                  <Button onClick={handleSubmitActivity(handleAddActivity)}>Ajouter</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {activities.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Aucune activité enregistrée</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Commencez par ajouter des activités pour cette semaine. Vous pouvez lier des tâches existantes ou créer de nouvelles activités.
                </p>
                <Button variant="outline" onClick={() => setIsSheetOpen(true)} size="lg" className="border-primary/20 hover:bg-primary/5 text-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter ma première activité
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md bg-background overflow-hidden">
              <HRTimesheetActivitiesTable
                activities={activities as any}
                onDelete={(id) => {
                  // Filtrer l'activité par _tempId (activités temporaires avant sauvegarde)
                  setActivities(activities.filter(a => (a as any)._tempId !== id));
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}