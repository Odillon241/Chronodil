"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hrActivitySchema, type HRActivityInput } from "@/lib/validations/hr-timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar as CalendarIcon, ArrowLeft, Plus, Trash2, Save, Edit2, Clock, User, Briefcase, MapPin, Check, X, Activity } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
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
} from "@/actions/hr-timesheet.actions";
import { getUserTasksForHRTimesheet } from "@/actions/task.actions";
import { useRouter, useParams } from "next/navigation";

interface Activity {
  id: string;
  activityType: string;
  activityName: string;
  description?: string;
  periodicity: string;
  weeklyQuantity?: number;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  status: string;
  ActivityCatalog?: {
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
  HRActivity: Activity[];
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
}

function EditableCell({ value, field, timesheetId, onUpdate }: EditableCellProps) {
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-8 text-sm"
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 w-7 p-0"
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 group cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <span className="font-semibold">{value}</span>
      <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [inputMode, setInputMode] = useState<"task" | "manual">("task");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
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
      if (catalogResult?.data) {
        setCatalog(catalogResult.data);
      }
      if (categoriesResult?.data) {
        setCategories(categoriesResult.data);
      }
      if (tasksResult?.data) {
        console.log("✅ Tâches chargées pour édition:", tasksResult.data.length);
        setAvailableTasks(tasksResult.data as Task[]);
      }
    } catch (error) {
      console.error("Erreur chargement catalogue:", error);
    }
  };

  // Fonction pour mettre à jour un champ du timesheet
  const handleUpdateField = async (field: string, value: string) => {
    if (!timesheet) return;

    const result = await updateHRTimesheet({
      id: timesheetId,
      data: {
        [field]: value,
      },
    });

    if (result?.data) {
      setTimesheet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [field]: value,
        };
      });
    } else {
      throw new Error(result?.serverError || "Erreur lors de la mise à jour");
    }
  };

  // Gérer la sélection de tâche
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

  // Fonction pour déterminer le type à partir de la catégorie
  const getTypeFromCategory = (category: string): "OPERATIONAL" | "REPORTING" => {
    // La catégorie "Reporting" correspond au type REPORTING, toutes les autres sont OPERATIONAL
    return category === "Reporting" ? "REPORTING" : "OPERATIONAL";
  };

  const onSubmitActivity = async (data: HRActivityInput) => {
    if (!timesheet) return;

    // Transformer l'objet en HRActivityInput compatible avec le backend
    let activityData: HRActivityInput;

    if (inputMode === "task") {
      // Mode tâche existante
      if (!selectedTaskId) {
        toast.error("Veuillez sélectionner une tâche");
        return;
      }

      const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
      activityData = {
        ...data,
        taskId: selectedTaskId, // ✅ Lier la tâche existante
        priority: selectedTask?.priority,
        complexity: selectedTask?.complexity || undefined,
        estimatedHours: selectedTask?.estimatedHours || undefined,
      };
    } else {
      // Mode saisie manuelle
      const activityType = getTypeFromCategory(selectedCategory);
      activityData = {
        ...data,
        activityType,
      };
    }

    console.log("📤 Envoi activité (édition):", {
      taskId: activityData.taskId,
      activityName: activityData.activityName,
    });

    setIsSaving(true);
    try {
      const result = await addHRActivity({
        timesheetId: timesheet.id,
        activity: activityData,
      });

      if (result?.serverError) {
        console.error("❌ Erreur création activité:", result.serverError);
      }

      if (result?.data) {
        toast.success("Activité ajoutée !");
        console.log("✅ Activité créée avec succès, taskId:", result.data.taskId);
        reset();
        setSelectedCategory("");
        setSelectedTaskId("");
        setSelectedCatalogId("");
        setShowActivityForm(false);
        loadTimesheet(); // Recharger pour voir la nouvelle activité
      } else {
        toast.error(result?.serverError || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
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
        toast.error(result?.serverError || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const calculateActivityDuration = (start: Date, end: Date): number => {
    const days = differenceInDays(end, start);
    return days * 24;
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!timesheet) {
    return null;
  }

  // Filtrer les activités du catalogue en fonction de la catégorie sélectionnée
  const filteredActivities = selectedCategory
    ? catalog.filter(item => item.category === selectedCategory)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Édition - Semaine du {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
          </h1>
          <p className="text-muted-foreground">
            Modifiez les activités de votre timesheet hebdomadaire
          </p>
        </div>
        <Badge variant="outline">Brouillon</Badge>
      </div>

      {/* Informations du timesheet */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-[200px] font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Employé
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={timesheet.employeeName}
                      field="employeeName"
                      timesheetId={timesheetId}
                      onUpdate={handleUpdateField}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Poste
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={timesheet.position}
                      field="position"
                      timesheetId={timesheetId}
                      onUpdate={handleUpdateField}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Site
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={timesheet.site}
                      field="site"
                      timesheetId={timesheetId}
                      onUpdate={handleUpdateField}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Nombre d'activités
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {timesheet.HRActivity.length} {timesheet.HRActivity.length === 1 ? "activité" : "activités"}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des activités */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités</CardTitle>
              <CardDescription>
                Ajoutez ou supprimez des activités pour cette semaine
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="bg-primary hover:bg-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle activité
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'ajout d'activité */}
          {showActivityForm && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <form onSubmit={handleSubmit(onSubmitActivity)} className="space-y-4">
                {/* Choix du mode de saisie */}
                <div className="space-y-2">
                  <Label>Mode de saisie</Label>
                  <RadioGroup value={inputMode} onValueChange={(v) => setInputMode(v as "task" | "manual")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="task" id="mode-task-edit" />
                      <Label htmlFor="mode-task-edit" className="font-normal cursor-pointer">
                        Tâche existante
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="mode-manual-edit" />
                      <Label htmlFor="mode-manual-edit" className="font-normal cursor-pointer">
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
                        <Label htmlFor="activityType">Type d'activité *</Label>
                        <Select
                          value={selectedCategory}
                          onValueChange={(value: string) => {
                            setSelectedCategory(value);
                            // Déterminer automatiquement le type OPERATIONAL/REPORTING
                            const activityType = getTypeFromCategory(value);
                            setValue("activityType", activityType);
                            // Réinitialiser les champs dépendants
                            setValue("activityName", "");
                            setValue("catalogId", undefined);
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
                    <Label htmlFor="activityName">Nom de l'activité *</Label>
                    {selectedCategory && filteredActivities.length > 0 ? (
                      <Select
                        value={watch("activityName") || ""}
                        onValueChange={(value) => {
                          const selectedActivity = filteredActivities.find(act => act.name === value);
                          if (selectedActivity) {
                            setValue("activityName", selectedActivity.name);
                            setValue("catalogId", selectedActivity.id);
                            // Déterminer le type à partir de la catégorie
                            const activityType = getTypeFromCategory(selectedActivity.category);
                            setValue("activityType", activityType);
                            if (selectedActivity.defaultPeriodicity) {
                              setValue("periodicity", selectedActivity.defaultPeriodicity as any);
                            }
                            if (selectedActivity.description) {
                              setValue("description", selectedActivity.description);
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une activité du catalogue" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {filteredActivities.map((activity) => (
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
                        {...register("activityName")}
                      />
                    )}
                    {errors.activityName && (
                      <p className="text-sm text-destructive">{errors.activityName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Détails supplémentaires..."
                    rows={2}
                    {...register("description")}
                  />
                </div>
              </div>
            )}

            {/* Champs communs (toujours visibles) */}
            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="periodicity">Périodicité *</Label>
                    <Select
                      value={watch("periodicity")}
                      onValueChange={(value: any) => setValue("periodicity", value)}
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
                      value={watch("status")}
                      onValueChange={(value: any) => setValue("status", value)}
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
                          {format(watch("startDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={watch("startDate") ?? new Date()}
                          onSelect={(d) => d && setValue("startDate", d)}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-sm text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date fin *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(watch("endDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={watch("endDate") ?? new Date()}
                          onSelect={(d) => d && setValue("endDate", d)}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary"
                    disabled={isSaving}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isSaving ? "Ajout..." : "Ajouter l'activité"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setSelectedCategory("");
                      setSelectedTaskId("");
                      setSelectedCatalogId("");
                      setShowActivityForm(false);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des activités */}
          {timesheet.HRActivity.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Aucune activité ajoutée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cliquez sur "Nouvelle activité" pour commencer
              </p>
            </div>
          ) : (
            <HRTimesheetActivitiesTable
              activities={timesheet.HRActivity}
              onDelete={handleDeleteActivity}
              showActions={true}
            />
          )}

          {/* Boutons de navigation */}
          {timesheet.HRActivity.length > 0 && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Terminer l'édition
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/hr-timesheet")}
              >
                Retour à la liste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
