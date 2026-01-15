"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hrActivitySchema, type HRActivityInput } from "@/lib/validations/hr-timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Trash2, Save, Edit2, Clock, User, Briefcase, MapPin, Check, X, Activity, Info, History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HRTimesheetActivitiesTable } from "@/components/hr-timesheet/hr-timesheet-activities-table";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getHRTimesheet,
  addHRActivity,
  deleteHRActivity,
  getActivityCatalog,
  getActivityCategories,
  updateHRTimesheet,
  updateHRActivity,
} from "@/actions/hr-timesheet.actions";
import { getUserTasksForHRTimesheet } from "@/actions/task.actions";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Activity {
  id?: string;
  _tempId?: string; // ID temporaire pour les activités non encore sauvegardées
  activityType: string;
  activityName: string;
  description?: string;
  periodicity: string;
  weeklyQuantity?: number;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  status: string;
  taskId?: string | null;
  ActivityCatalog?: {
    id?: string;
    name: string;
    category: string;
  } | null;
}

interface Timesheet {
  id: string;
  weekStartDate: Date;
  weekEndDate: Date;
  employeeName: string;
  position: string;
  site: string;
  totalHours: number;
  status: string;
  employeeObservations?: string | null;
  employeeSignedAt?: Date | null;
  managerSignedAt?: Date | null;
  odillonSignedAt?: Date | null;
  HRActivity: Activity[];
  User_HRTimesheet_userIdToUser?: {
    email: string;
  };
  User_HRTimesheet_managerSignedByIdToUser?: {
    name: string;
  } | null;
  User_HRTimesheet_odillonSignedByIdToUser?: {
    name: string;
  } | null;
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

// Composant pour l'édition inline des champs
interface EditableCellProps {
  value: string;
  field: "employeeName" | "position" | "site";
  timesheetId: string;
  onUpdate: (field: string, value: string) => Promise<void>;
  label: string;
  icon?: React.ReactNode;
  align?: "left" | "right";
}

function EditableCell({ value, field, timesheetId, onUpdate, label, icon, align = "right" }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    if (!editValue.trim()) {
      toast.error("Le champ ne peut pas être vide");
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(field, editValue.trim());
      setIsEditing(false);
      toast.success("Champ mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className={cn("flex items-center py-1 group w-full", align === "right" ? "justify-between" : "justify-start gap-2")}>
      {(icon || label) && (
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          {icon} {label}
        </span>
      )}
      {isEditing ? (
        <div className={cn("flex items-center gap-2 flex-1 max-w-[200px]", align === "right" && "justify-end")}>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={cn("h-8 text-sm", align === "right" ? "text-right" : "text-left")}
          />
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={handleSave}><Check className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleCancel}><X className="h-3 w-3" /></Button>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <span className={cn("font-medium text-sm", align === "right" ? "text-right" : "text-left")}>{value}</span>
          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}

export default function EditHRTimesheetPage() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // États formulaire
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [inputMode, setInputMode] = useState<"task" | "manual">("task");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HRActivityInput>({
    resolver: zodResolver(hrActivitySchema) as any,
    defaultValues: {
      activityType: "OPERATIONAL",
      activityName: "",
      description: "",
      periodicity: "DAILY",
      startDate: new Date(),
      endDate: new Date(),
      status: "IN_PROGRESS",
      soundEnabled: true,
      totalHours: 0,
      weeklyQuantity: 0,
    },
  });

  useEffect(() => {
    loadTimesheet();
    loadCatalog();
  }, [timesheetId]);

  const loadTimesheet = async () => {
    try {
      setIsLoading(true);
      const result = await getHRTimesheet({ timesheetId });

      if (result?.data) {
        const ts = result.data as Timesheet;

        if (ts.status !== "DRAFT") {
          toast.error("Ce timesheet ne peut pas être modifié (statut: " + ts.status + ")");
          router.push(`/dashboard/hr-timesheet/${timesheetId}`);
          return;
        }
        setTimesheet(ts);
      } else {
        toast.error("Timesheet non trouvé");
        router.push("/dashboard/hr-timesheet");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
      router.push("/dashboard/hr-timesheet");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const [catalogResult, categoriesResult, tasksResult] = await Promise.all([
        getActivityCatalog({}),
        getActivityCategories(),
        getUserTasksForHRTimesheet({}),
      ]);
      if (catalogResult?.data) setCatalog(catalogResult.data);
      if (categoriesResult?.data) setCategories(categoriesResult.data);
      if (tasksResult?.data) setAvailableTasks(tasksResult.data as Task[]);
    } catch (error) {
      console.error("Erreur chargement catalogue:", error);
    }
  };

  const handleUpdateField = async (field: string, value: string) => {
    if (!timesheet) return;

    const result = await updateHRTimesheet({
      id: timesheetId,
      data: {
        [field]: value,
      },
    });

    if (result?.data) {
      setTimesheet((prev) => prev ? { ...prev, [field]: value } : null);
    } else {
      throw new Error(result?.serverError || "Erreur lors de la mise à jour");
    }
  };

  const handleUpdateObservations = async (value: string) => {
    if (!timesheet) return;
    try {
      const result = await updateHRTimesheet({
        id: timesheetId,
        data: { employeeObservations: value }
      });
      if (result?.data) {
        setTimesheet(prev => prev ? { ...prev, employeeObservations: value } : null);
        toast.success("Observations mises à jour");
      }
    } catch (e) {
      toast.error("Erreur update observations");
    }
  }


  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      setValue("activityName", task.name);
      setValue("description", task.description || "");
      setValue("activityType", "OPERATIONAL");
      setValue("priority", task.priority);
      setValue("complexity", task.complexity || undefined);
      setValue("estimatedHours", task.estimatedHours || undefined);
    }
  };

  const getTypeFromCategory = (category: string): "OPERATIONAL" | "REPORTING" => {
    return category === "CONTROLE ET REPORTING" ? "REPORTING" : "OPERATIONAL";
  };

  const onSubmitActivity = async (data: HRActivityInput) => {
    if (!timesheet) return;

    // Si on est en mode édition
    if (editingActivity && editingActivity.id) {
      setIsSaving(true);
      try {
        let updateData: Partial<HRActivityInput> = {
          activityName: data.activityName,
          description: data.description,
          periodicity: data.periodicity,
          weeklyQuantity: data.weeklyQuantity,
          totalHours: data.totalHours,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          soundEnabled: data.soundEnabled ?? true,
        };

        if (inputMode === "task" && selectedTaskId) {
          const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
          updateData = {
            ...updateData,
            taskId: selectedTaskId,
            priority: selectedTask?.priority,
            complexity: selectedTask?.complexity || undefined,
            estimatedHours: selectedTask?.estimatedHours || undefined,
          };
        } else {
          const activityType = getTypeFromCategory(selectedCategory);
          updateData = { ...updateData, activityType };
          if (selectedCatalogId) updateData.catalogId = selectedCatalogId;
        }

        const result = await updateHRActivity({
          id: editingActivity.id,
          data: updateData,
        });

        if (result?.data) {
          toast.success("Activité mise à jour !");
          resetForm();
          loadTimesheet();
        } else {
          const errorMsg = result?.serverError || "Erreur lors de la mise à jour";
          toast.error(errorMsg);
          console.error("Erreur updateHRActivity:", result);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
        toast.error(errorMsg);
        console.error("Erreur updateHRActivity catch:", error);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Mode création
    let activityData: HRActivityInput;
    if (inputMode === "task") {
      if (!selectedTaskId) {
        toast.error("Veuillez sélectionner une tâche");
        return;
      }
      const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
      activityData = {
        ...data,
        taskId: selectedTaskId,
        priority: selectedTask?.priority,
        complexity: selectedTask?.complexity || undefined,
        estimatedHours: selectedTask?.estimatedHours || undefined,
        soundEnabled: data.soundEnabled ?? true,
      };
    } else {
      if (!selectedCategory) {
        toast.error("Veuillez sélectionner une catégorie");
        return;
      }
      const activityType = getTypeFromCategory(selectedCategory);
      activityData = {
        ...data,
        activityType,
        soundEnabled: data.soundEnabled ?? true,
      };
      if (selectedCatalogId) {
        activityData.catalogId = selectedCatalogId;
      }
    }

    console.log("📋 Données activité avant soumission:", activityData);

    setIsSaving(true);
    try {
      const result = await addHRActivity({
        timesheetId: timesheet.id,
        activity: activityData,
      });

      if (result?.data) {
        toast.success("Activité ajoutée !");
        resetForm();
        loadTimesheet();
      } else {
        const errorMsg = result?.serverError || "Erreur lors de l'ajout";
        toast.error(errorMsg);
        console.error("Erreur addHRActivity:", result);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'ajout";
      toast.error(errorMsg);
      console.error("Erreur addHRActivity catch:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Supprimer cette activité ?")) return;
    try {
      const result = await deleteHRActivity({
        timesheetId,
        activityId,
      });
      if (result?.data) {
        toast.success("Activité supprimée");
        loadTimesheet();
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsSheetOpen(true);

    setValue("activityName", activity.activityName);
    setValue("description", activity.description || "");
    setValue("periodicity", activity.periodicity as any);
    setValue("weeklyQuantity", activity.weeklyQuantity || undefined);
    setValue("totalHours", activity.totalHours || undefined);
    setValue("startDate", new Date(activity.startDate));
    setValue("endDate", new Date(activity.endDate));
    setValue("status", activity.status as any);
    setValue("activityType", activity.activityType as any);

    if (activity.taskId) {
      setInputMode("task");
      setSelectedTaskId(activity.taskId);
      const task = availableTasks.find(t => t.id === activity.taskId);
      if (task) {
        setValue("priority", task.priority);
        setValue("complexity", task.complexity || undefined);
        setValue("estimatedHours", task.estimatedHours || undefined);
      }
    } else if (activity.ActivityCatalog) {
      setInputMode("manual");
      setSelectedCategory(activity.ActivityCatalog.category);
      const catalogId = activity.ActivityCatalog.id ?? "";
      setSelectedCatalogId(catalogId);
      setValue("catalogId", catalogId);
    } else {
      setInputMode("manual");
      setSelectedCategory("");
      setSelectedCatalogId("");
    }
  };

  const resetForm = () => {
    reset();
    setSelectedCategory("");
    setSelectedTaskId("");
    setSelectedCatalogId("");
    setEditingActivity(null);
    setIsSheetOpen(false);
    setInputMode("task");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="ml-4 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!timesheet) return null;

  const filteredActivities = selectedCategory
    ? catalog.filter(item => item.category === selectedCategory)
    : [];

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" className="-ml-3 h-8 text-muted-foreground" onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}`)}>
              <ArrowLeft className="mr-2 h-3 w-3" />
              Retour
            </Button>
            <span>/</span>
            <span>Édition</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="bg-primary/10 p-2 rounded-lg"><CalendarIcon className="h-6 w-6 text-primary" /></span>
            Feuille du {format(new Date(timesheet.weekStartDate), "dd MMM", { locale: fr })}
            <span className="text-muted-foreground mx-1">-</span>
            {format(new Date(timesheet.weekEndDate), "dd MMM yyyy", { locale: fr })}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs uppercase tracking-widest">Brouillon</Badge>
            <Badge variant="secondary" className="text-xs font-normal">
              <Edit2 className="h-3 w-3 mr-1" />
              Mode Édition
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Button onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}`)} className="shadow-sm">
            <Save className="h-4 w-4 mr-2" /> Terminer l'édition
          </Button>
        </div>
      </div>

      {/* Top Info Section in a Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Employee Card */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" /> Informations Employé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-dashed">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {timesheet.employeeName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <EditableCell
                  value={timesheet.employeeName}
                  field="employeeName"
                  timesheetId={timesheetId}
                  onUpdate={handleUpdateField}
                  label=""
                  align="left"
                  icon={null}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-1 pt-1">
              <EditableCell
                value={timesheet.position}
                field="position"
                timesheetId={timesheetId}
                onUpdate={handleUpdateField}
                label="Poste"
                icon={null}
              />
              <EditableCell
                value={timesheet.site}
                field="site"
                timesheetId={timesheetId}
                onUpdate={handleUpdateField}
                label="Site"
                icon={<MapPin className="h-3 w-3" />}
              />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Total Heures</span>
                <Badge variant="default" className="text-sm font-mono">{timesheet.totalHours} h</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations Card */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4" /> Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[120px] bg-muted/30 resize-none text-sm border"
              placeholder="Ajoutez une note ou une observation pour cette semaine..."
              defaultValue={timesheet.employeeObservations || ""}
              onBlur={(e) => handleUpdateObservations(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Validation History / Timeline */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4" /> Historique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-l border-muted pl-4 ml-1 space-y-4">
              {timesheet.odillonSignedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                  <div className="text-sm font-medium">Validation Finale</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(timesheet.odillonSignedAt), "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground">{timesheet.User_HRTimesheet_odillonSignedByIdToUser?.name || "Admin"}</div>
                </div>
              )}

              {timesheet.managerSignedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-background" />
                  <div className="text-sm font-medium">Validation Manager</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(timesheet.managerSignedAt), "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground">{timesheet.User_HRTimesheet_managerSignedByIdToUser?.name || "Manager"}</div>
                </div>
              )}

              {timesheet.employeeSignedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-background" />
                  <div className="text-sm font-medium">Soumission</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(timesheet.employeeSignedAt), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted border border-border ring-4 ring-background" />
                <div className="text-sm font-medium text-muted-foreground">Création</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Activities Section - Full Width */}
      <div className="space-y-6">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Activités Réalisées</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-normal">
                  {timesheet.HRActivity.length} entrées
                </Badge>
                <Button onClick={() => { resetForm(); setIsSheetOpen(true); }} size="sm" className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter une activité
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {timesheet.HRActivity.length > 0 ? (
              <HRTimesheetActivitiesTable
                activities={timesheet.HRActivity}
                onDelete={handleDeleteActivity}
                onEdit={handleEditActivity}
                showActions={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-lg text-foreground">Aucune activité</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Commencez par ajouter votre première activité en cliquant sur le bouton "Ajouter une activité".
                  </p>
                </div>
                <Button variant="outline" onClick={() => { resetForm(); setIsSheetOpen(true); }}>
                  Ajouter maintenant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sheet pour Ajout / Édition */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full flex flex-col h-full p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle className="flex items-center gap-2">
              {editingActivity ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingActivity ? "Modifier l'activité" : "Nouvelle activité"}
            </SheetTitle>
            <SheetDescription>
              {editingActivity ? "Modifiez les détails de l'activité existante." : "Remplissez le formulaire pour ajouter une activité à votre feuille de temps."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="activity-form" onSubmit={handleSubmit(onSubmitActivity)} className="space-y-6">

              {/* Mode de saisie */}
              {!editingActivity && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <RadioGroup value={inputMode} onValueChange={(v) => setInputMode(v as "task" | "manual")} className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="task" id="mode-task" />
                      <Label htmlFor="mode-task" className="cursor-pointer font-medium">Lier à une tâche (Recommandé)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="mode-manual" />
                      <Label htmlFor="mode-manual" className="cursor-pointer font-medium">Saisie manuelle</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {inputMode === "task" ? (
                <div className="space-y-3">
                  <Label>Sélectionner une tâche</Label>
                  {availableTasks.length === 0 ? (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      Aucune tâche disponible. Veuillez utiliser la saisie manuelle.
                    </div>
                  ) : (
                    <Select
                      value={selectedTaskId}
                      onValueChange={handleTaskSelect}
                      disabled={!!editingActivity} // Ne pas changer la tâche en édition
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une tâche..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name} <span className="text-muted-foreground ml-2 text-xs">({task.priority})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={(val) => {
                          setSelectedCategory(val);
                          const activityType = getTypeFromCategory(val);
                          setValue("activityType", activityType);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Catégorie..." /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Activité</Label>
                      <Select
                        value={selectedCatalogId}
                        onValueChange={(val) => {
                          setSelectedCatalogId(val);
                          const item = catalog.find(c => c.id === val);
                          if (item) {
                            setValue("activityName", item.name);
                            setValue("description", item.description || "");
                            if (item.defaultPeriodicity) setValue("periodicity", item.defaultPeriodicity as any);
                          }
                        }}
                        disabled={!selectedCategory}
                      >
                        <SelectTrigger><SelectValue placeholder="Activité..." /></SelectTrigger>
                        <SelectContent>
                          {filteredActivities.map((activ) => (
                            <SelectItem key={activ.id} value={activ.id}>{activ.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activityName">Titre de l'activité</Label>
                  <Input id="activityName" {...register("activityName")} placeholder="Ex: Développement API..." />
                  {errors.activityName && <p className="text-xs text-destructive">{errors.activityName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Périodicité</Label>
                  <Select onValueChange={(val) => setValue("periodicity", val as any)} value={watch("periodicity")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Quotidienne</SelectItem>
                      <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                      <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                      <SelectItem value="PUNCTUAL">Ponctuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {watch("periodicity") === "WEEKLY" && (
                  <div className="space-y-2">
                    <Label>Quantité hebdomadaire</Label>
                    <Input type="number" {...register("weeklyQuantity", { valueAsNumber: true })} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select onValueChange={(val) => setValue("status", val as any)} value={watch("status")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Heures (est.)</Label>
                  <Input type="number" step="0.5" {...register("totalHours", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("startDate") ? format(watch("startDate") as Date, "dd/MM/yyyy") : "Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("startDate") as Date | undefined}
                        onSelect={(date) => date && setValue("startDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Date Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("endDate") ? format(watch("endDate") as Date, "dd/MM/yyyy") : "Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("endDate") as Date | undefined}
                        onSelect={(date) => date && setValue("endDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>



              <div className="space-y-2">
                <Label>Description / Notes</Label>
                <Textarea {...register("description")} placeholder="Détails supplémentaires..." className="resize-none" rows={3} />
              </div>

            </form>
          </div>

          <SheetFooter className="px-6 py-4 border-t mt-auto bg-muted/10">
            <Button type="button" variant="destructive" onClick={() => setIsSheetOpen(false)} disabled={isSaving}>Annuler</Button>
            <Button type="submit" form="activity-form" disabled={isSaving}>
              {isSaving && <Spinner className="mr-2 h-4 w-4" />}
              {editingActivity ? "Enregistrer les modifications" : "Ajouter l'activité"}
            </Button>
          </SheetFooter>

        </SheetContent>
      </Sheet>
    </div >
  );
}

