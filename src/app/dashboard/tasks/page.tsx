"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskComplexitySelector } from "@/components/features/task-complexity-selector";
import { TaskEvaluationForm } from "@/components/features/task-evaluation-form";
import { TaskComplexityBadge } from "@/components/features/task-complexity-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, Circle, FolderOpen, Check, Search, Calendar, Bell, Users, X, Volume2, VolumeX, MoreVertical, Filter } from "lucide-react";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { createTask, updateTask, deleteTask, getMyTasks, getAvailableUsersForSharing, updateTaskStatus, updateTaskPriority } from "@/actions/task.actions";
import { getMyProjects } from "@/actions/project.actions";
import { getAvailableHRTimesheetsForTask } from "@/actions/hr-timesheet.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { isSameDay } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { useTaskReminders } from "@/hooks/use-task-reminders";
import { TaskStatusBadge } from "@/components/features/task-status-badge";
import { TaskPriorityBadge } from "@/components/features/task-priority-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskComments } from "@/components/features/task-comments";
import { TaskActivityTimeline } from "@/components/features/task-activity-timeline";
import { useSession } from "@/lib/auth-client";
import { TaskRoadmap } from "@/components/features/task-roadmap";
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks";
import { TaskKanban } from "@/components/features/task-kanban";
import { TaskGantt } from "@/components/features/task-gantt";
import { TaskCalendar } from "@/components/features/task-calendar";
import { Navbar18, type Navbar18NavItem } from "@/components/ui/shadcn-io/navbar-18";
import { useTasks, type ViewMode } from "@/contexts/tasks-context";

export default function TasksPage() {
  const { data: session } = useSession();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  
  // Utiliser le contexte pour les tâches
  const {
    tasks,
    filteredTasks,
    isLoading,
    searchQuery,
    statusFilter,
    priorityFilter,
    selectedProject,
    viewMode,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setSelectedProject,
    setViewMode,
    refreshTasks,
  } = useTasks();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableTimesheets, setAvailableTimesheets] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Activer les rappels de tâches
  useTaskReminders({ tasks });

  // Écouter les changements en temps réel sur les tâches
  useRealtimeTasks({
    onTaskChange: () => {
      console.log('🔄 Mise à jour en temps réel - Rechargement des tâches...');
      refreshTasks();
    }
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "none",
    estimatedHours: "",
    dueDate: "",
    reminderDate: "",
    reminderTime: "",
    soundEnabled: true,
    isShared: false,
    status: "TODO",
    priority: "MEDIUM",
    complexity: "MOYEN",
    trainingLevel: undefined,
    masteryLevel: undefined,
    understandingLevel: undefined,
    hrTimesheetId: "none",
  });

  useEffect(() => {
    loadProjects();
    loadAvailableTimesheets();
  }, []);

  const loadProjects = async () => {
    try {
      const result = await getMyProjects({});
      if (result?.data) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    }
  };

  const loadAvailableTimesheets = async () => {
    try {
      const result = await getAvailableHRTimesheetsForTask();
      if (result?.data) {
        setAvailableTimesheets(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des timesheets:", error);
    }
  };


  const loadAvailableUsers = async (projectId?: string) => {
    try {
      const result = await getAvailableUsersForSharing({
        projectId: projectId === "none" ? undefined : projectId,
      });
      if (result?.data) {
        setAvailableUsers(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTask) {
        const result = await updateTask({
          id: editingTask.id,
          name: formData.name,
          description: formData.description,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
          reminderTime: formData.reminderTime || undefined,
          soundEnabled: formData.soundEnabled,
        });

        if (result?.data) {
          toast.success("Tâche mise à jour !");
        } else {
          toast.error(result?.serverError || "Erreur");
        }
      } else {
        const result = await createTask({
          name: formData.name,
          description: formData.description,
          projectId: formData.projectId === "none" ? undefined : formData.projectId || undefined,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
          reminderTime: formData.reminderTime || undefined,
          soundEnabled: formData.soundEnabled,
          isShared: formData.isShared,
          sharedWith: formData.isShared ? selectedUsers : undefined,
          status: formData.status as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED",
          priority: formData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          complexity: formData.complexity as "FAIBLE" | "MOYEN" | "ÉLEVÉ",
          trainingLevel: formData.trainingLevel,
          masteryLevel: formData.masteryLevel,
          understandingLevel: formData.understandingLevel,
          hrTimesheetId: formData.hrTimesheetId === "none" ? undefined : formData.hrTimesheetId || undefined,
        });

        if (result?.data) {
          toast.success("Tâche créée !");
          if (formData.isShared && selectedUsers.length > 0) {
            toast.success(`Tâche partagée avec ${selectedUsers.length} utilisateur(s)`);
          }
        } else {
          toast.error(result?.serverError || "Erreur");
        }
      }

      setIsDialogOpen(false);
      resetForm();
      refreshTasks();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || "",
      projectId: task.projectId || "none",
      estimatedHours: task.estimatedHours?.toString() || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      reminderDate: task.reminderDate ? new Date(task.reminderDate).toISOString().split("T")[0] : "",
      reminderTime: task.reminderTime || "",
      soundEnabled: task.soundEnabled !== undefined ? task.soundEnabled : true,
      isShared: task.isShared || false,
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      complexity: task.complexity || "MOYEN",
      trainingLevel: task.trainingLevel || undefined,
      masteryLevel: task.masteryLevel || undefined,
      understandingLevel: task.understandingLevel || undefined,
      hrTimesheetId: task.hrTimesheetId || "none",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer la tâche",
      description: "Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteTask({ id });
          if (result?.data) {
            toast.success("Tâche supprimée");
            refreshTasks();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Fonction de suppression directe pour le calendrier
  const handleDirectDelete = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer la tâche",
      description: "Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteTask({ id });
          if (result?.data) {
            toast.success("Tâche supprimée");
            refreshTasks();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleToggleActive = async (task: any) => {
    try {
      const result = await updateTask({
        id: task.id,
        isActive: !task.isActive,
      });

      if (result?.data) {
        toast.success(task.isActive ? "Tâche désactivée" : "Tâche activée");
        refreshTasks();
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      projectId: "none",
      estimatedHours: "",
      dueDate: "",
      reminderDate: "",
      reminderTime: "",
      soundEnabled: true,
      isShared: false,
      status: "TODO",
      priority: "MEDIUM",
      complexity: "MOYEN",
      trainingLevel: undefined,
      masteryLevel: undefined,
      understandingLevel: undefined,
      hrTimesheetId: "none",
    });
    setSelectedUsers([]);
    setEditingTask(null);
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTasks.size === 0) return;

    const confirmed = await showConfirmation({
      title: "Supprimer les tâches sélectionnées",
      description: `Êtes-vous sûr de vouloir supprimer ${selectedTasks.size} tâche(s) ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const deletePromises = Array.from(selectedTasks).map(id => deleteTask({ id }));
          await Promise.all(deletePromises);
          toast.success(`${selectedTasks.size} tâche(s) supprimée(s)`);
          setSelectedTasks(new Set());
          refreshTasks();
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };


  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Gérer le clic sur une tâche dans le calendrier
  const handleCalendarEventClick = (task: any) => {
    handleEdit(task);
  };

  // Gérer le drag & drop dans le calendrier
  const handleCalendarEventDrop = async (taskId: string, newDate: Date) => {
    const result = await updateTask({
      id: taskId,
      dueDate: newDate,
    });

    if (result?.data) {
      toast.success("Date d'échéance mise à jour !");
      refreshTasks();
    } else {
      toast.error("Erreur lors de la mise à jour");
      throw new Error("Update failed");
    }
  };

  // Gérer le double-clic sur un créneau vide
  const handleCalendarSlotDoubleClick = (date: Date) => {
    setFormData({
      ...formData,
      dueDate: date.toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  // Gérer le changement de statut (Kanban)
  const handleStatusChange = async (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED") => {
    const result = await updateTask({
      id: taskId,
      status: newStatus,
    });

    if (result?.data) {
      toast.success("Statut mis à jour !");
      refreshTasks();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Trier les tâches par projet puis par nom
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const projectA = a.Project?.name || "Sans projet";
    const projectB = b.Project?.name || "Sans projet";
    if (projectA !== projectB) {
      return projectA.localeCompare(projectB);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tâches</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez les tâches de vos projets
          </p>
        </div>
        <div className="flex gap-2 relative z-20">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary flex-1 sm:flex-initial text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nouvelle tâche</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{editingTask ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingTask ? "Modifiez les informations de la tâche" : "Créez une nouvelle tâche pour votre projet"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" className="text-xs sm:text-sm">Détails</TabsTrigger>
                <TabsTrigger value="comments" disabled={!editingTask} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Commentaires</span>
                  <span className="sm:hidden">💬</span>
                  {editingTask && editingTask._count?.TaskComment > 0 && <span className="ml-1">({editingTask._count.TaskComment})</span>}
                </TabsTrigger>
                <TabsTrigger value="activity" disabled={!editingTask} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Historique</span>
                  <span className="sm:hidden">📜</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTask && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="project">Projet</Label>
                    <Select
                      value={formData.projectId}
                        onValueChange={(value) => {
                          setFormData({ ...formData, projectId: value });
                          loadAvailableUsers(value);
                        }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun projet</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hrTimesheet">Feuille de temps RH (optionnel)</Label>
                    <Select
                      value={formData.hrTimesheetId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, hrTimesheetId: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lier à une feuille de temps..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune feuille de temps</SelectItem>
                        {availableTimesheets.length > 0 ? (
                          availableTimesheets.map((timesheet) => (
                            <SelectItem key={timesheet.id} value={timesheet.id}>
                              📅 Semaine du {new Date(timesheet.weekStartDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              {" au "}{new Date(timesheet.weekEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              {" "}({timesheet.status === "DRAFT" ? "Brouillon" : "En attente"})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>Aucune feuille de temps disponible</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      💡 Liez cette tâche à une feuille de temps RH pour suivre votre activité
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nom de la tâche *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Développement API REST"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de la tâche..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="Sélectionnez le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">À faire</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="REVIEW">Revue</SelectItem>
                      <SelectItem value="DONE">Terminé</SelectItem>
                      <SelectItem value="BLOCKED">Bloqué</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-xs sm:text-sm">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="Sélectionnez la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Basse</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours" className="text-xs sm:text-sm">Estimation (heures)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="Ex: 40"
                  className="text-sm"
                />
              </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-xs sm:text-sm">Date d'échéance</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderDate" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Date de rappel
                  </Label>
                  <Input
                    id="reminderDate"
                    type="date"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reminderTime" className="text-xs sm:text-sm">Heure du rappel</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      required={!!formData.reminderDate}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="soundEnabled" className="flex items-center gap-2 text-xs sm:text-sm">
                      {formData.soundEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />}
                      Notification sonore
                    </Label>
                    <div className="flex items-center h-10 px-3 border rounded-md">
                      <Checkbox
                        id="soundEnabled"
                        checked={formData.soundEnabled}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, soundEnabled: checked as boolean })
                        }
                      />
                      <label htmlFor="soundEnabled" className="ml-2 text-xs sm:text-sm cursor-pointer">
                        {formData.soundEnabled ? "Activé" : "Désactivé"}
                      </label>
                    </div>
                  </div>
                </div>

                {formData.reminderDate && formData.reminderTime && (
                  <p className="text-xs text-muted-foreground">
                    Vous serez notifié le {new Date(formData.reminderDate).toLocaleDateString('fr-FR')} à {formData.reminderTime}
                    {formData.soundEnabled && " avec un son de notification"}
                  </p>
                )}

                <div className="space-y-2 border-t pt-4">
                  <TaskComplexitySelector
                    value={formData.complexity as any}
                    onValueChange={(value) =>
                      setFormData({ ...formData, complexity: value })
                    }
                  />
                </div>

                {!editingTask && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isShared"
                        checked={formData.isShared}
                        onCheckedChange={(checked) => {
                          const isChecked = checked as boolean;
                          setFormData({ ...formData, isShared: isChecked });
                          if (isChecked && availableUsers.length === 0) {
                            loadAvailableUsers(formData.projectId === "none" ? undefined : formData.projectId);
                          } else if (!isChecked) {
                            // Reset availableUsers et selectedUsers quand on décoche
                            setAvailableUsers([]);
                            setSelectedUsers([]);
                          }
                        }}
                      />
                      <Label htmlFor="isShared" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        Partager cette tâche avec d'autres utilisateurs
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Partager avec :</Label>
                      <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                        {availableUsers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aucun utilisateur disponible pour le partage
                          </p>
                        ) : (
                          availableUsers.map((user) => (
                            <div
                              key={user.id}
                              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                                selectedUsers.includes(user.id) ? "bg-accent" : ""
                              }`}
                            >
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback>
                                  {user.name.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <Badge variant="outline">{user.role}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                      {selectedUsers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedUsers.length} utilisateur(s) sélectionné(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : editingTask ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            {editingTask && session?.user && (
              <TaskComments 
                taskId={editingTask.id} 
                currentUserId={session.user.id}
              />
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {editingTask && (
              <TaskActivityTimeline taskId={editingTask.id} />
            )}
          </TabsContent>
        </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Vues des tâches */}
      {showCalendar && (
        <Card className="space-y-4 overflow-hidden">
          <CardContent className="pt-6">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full min-w-0">
              <div className="mb-4 -mx-6 px-6">
                <Navbar18
                  navigationLinks={[
                    { href: "#table", label: "Tableau", active: viewMode === "table" },
                    { href: "#list", label: "Liste", active: viewMode === "list" },
                    { href: "#calendar", label: "Calendrier", active: viewMode === "calendar" },
                    { href: "#kanban", label: "Kanban", active: viewMode === "kanban" },
                    { href: "#gantt", label: "Gantt", active: viewMode === "gantt" },
                  ] as Navbar18NavItem[]}
                  onNavItemClick={(href) => {
                    const mode = href.replace("#", "") as ViewMode;
                    setViewMode(mode);
                  }}
                  className="border-b border-border/40 px-0 h-auto"
                />
              </div>

              {/* Vue Calendrier */}
              <TabsContent value="calendar" className="mt-4 min-w-0">
                <div className="w-full overflow-x-auto -mx-6 px-6">
                  <TaskCalendar
                    tasks={filteredTasks}
                    onEventClick={handleCalendarEventClick}
                    onEventDrop={handleCalendarEventDrop}
                    onDayDoubleClick={handleCalendarSlotDoubleClick}
                    onEventDelete={handleDirectDelete}
                    onEventToggle={handleToggleActive}
                  />
                </div>
                {/* Légende - uniquement pour la vue calendrier */}
                <div className="border-t mt-4 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">Légende</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-600 flex-shrink-0 border-2 border-red-800" />
                      <span className="font-semibold">🇬🇦 Jour férié (Gabon)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500 flex-shrink-0" />
                      <span>Urgent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-500 flex-shrink-0" />
                      <span>Priorité haute</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-500 flex-shrink-0" />
                      <span>Priorité moyenne</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500 flex-shrink-0" />
                      <span>Priorité basse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-gray-400 flex-shrink-0" />
                      <span>Terminé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span>Tâche partagée</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3 flex-shrink-0" />
                      <span>Rappel activé</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Vue Kanban */}
              <TabsContent value="kanban" className="mt-4 min-w-0">
                <div className="w-full overflow-x-auto -mx-6 px-6">
                  <TaskKanban
                    tasks={filteredTasks}
                    onEventClick={handleCalendarEventClick}
                    onStatusChange={handleStatusChange}
                    onEventDelete={handleDirectDelete}
                    onEventToggle={handleToggleActive}
                  />
                </div>
              </TabsContent>

              {/* Vue Gantt */}
              <TabsContent value="gantt" className="mt-4 min-w-0">
                <div className="w-full overflow-auto -mx-6 px-6">
                  <TaskGantt
                    tasks={filteredTasks}
                    onEventClick={handleCalendarEventClick}
                    onEventDrop={handleCalendarEventDrop}
                    onEventDelete={handleDirectDelete}
                    onEventToggle={handleToggleActive}
                    onAddItem={handleCalendarSlotDoubleClick}
                  />
                </div>
              </TabsContent>

              {/* Vue Tableau */}
              <TabsContent value="table" className="mt-4">
                <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground text-center">
                          {searchQuery ? "Aucune tâche trouvée pour votre recherche" : "Aucune tâche trouvée"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                          {searchQuery ? "Essayez avec d'autres mots-clés" : "Créez votre première tâche pour commencer"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Actif</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Projet</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Échéance</TableHead>
                            <TableHead>Estimation</TableHead>
                            <TableHead>Membres</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedTasks.map((task: any) => (
                            <ContextMenu key={task.id}>
                              <ContextMenuTrigger asChild>
                                <TableRow className={selectedTasks.has(task.id) ? "bg-muted/50" : ""}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedTasks.has(task.id)}
                                      onCheckedChange={() => handleSelectTask(task.id)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleToggleActive(task)}
                                    >
                                      {task.isActive ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium ${!task.isActive && "line-through text-muted-foreground"}`}>
                                        {task.name}
                                      </span>
                                      {!task.isActive && (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                          Inactive
                                        </span>
                                      )}
                                      {task.isShared && (
                                        <Users className="h-4 w-4 text-blue-600" aria-label="Tâche partagée" />
                                      )}
                                      {task.reminderDate && (
                                        <Bell className="h-4 w-4 text-amber-600" aria-label="Rappel activé" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                          <TaskStatusBadge status={task.status} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskStatus({ id: task.id, status: "TODO" });
                                          if (result?.data) {
                                            toast.success("Statut mis à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          À faire
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskStatus({ id: task.id, status: "IN_PROGRESS" });
                                          if (result?.data) {
                                            toast.success("Statut mis à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          En cours
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskStatus({ id: task.id, status: "REVIEW" });
                                          if (result?.data) {
                                            toast.success("Statut mis à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          Revue
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskStatus({ id: task.id, status: "DONE" });
                                          if (result?.data) {
                                            toast.success("Tâche terminée !");
                                            refreshTasks();
                                          }
                                        }}>
                                          Terminé
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskStatus({ id: task.id, status: "BLOCKED" });
                                          if (result?.data) {
                                            toast.success("Statut mis à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          Bloqué
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                          <TaskPriorityBadge priority={task.priority} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Changer la priorité</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskPriority({ id: task.id, priority: "LOW" });
                                          if (result?.data) {
                                            toast.success("Priorité mise à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          Basse
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskPriority({ id: task.id, priority: "MEDIUM" });
                                          if (result?.data) {
                                            toast.success("Priorité mise à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          Moyenne
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskPriority({ id: task.id, priority: "HIGH" });
                                          if (result?.data) {
                                            toast.success("Priorité mise à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          Haute
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          const result = await updateTaskPriority({ id: task.id, priority: "URGENT" });
                                          if (result?.data) {
                                            toast.success("Priorité mise à jour");
                                            refreshTasks();
                                          }
                                        }}>
                                          Urgent
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor: task.Project?.color || '#6b7280'
                                        }}
                                      />
                                      <span>{task.Project?.name || "Sans projet"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground truncate block">
                                      {task.description || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {task.dueDate ? (
                                      <span className="text-sm">
                                        {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {task.estimatedHours ? `${task.estimatedHours}h` : "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {task.TaskMember && task.TaskMember.length > 0 ? (
                                      <div className="flex -space-x-2">
                                        {task.TaskMember.slice(0, 3).map((member: any) => (
                                          <Avatar key={member.User.id} className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-background">
                                            <AvatarImage src={member.User.avatar || undefined} />
                                            <AvatarFallback className="text-xs">
                                              {member.User.name.split(" ").map((n: string) => n[0]).join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                        ))}
                                        {task.TaskMember.length > 3 && (
                                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground">
                                              +{task.TaskMember.length - 3}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(task)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(task.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => handleEdit(task)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleToggleActive(task)}>
                                  {task.isActive ? (
                                    <>
                                      <Circle className="h-4 w-4 mr-2" />
                                      Désactiver
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Activer
                                    </>
                                  )}
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Vue Liste */}
              <TabsContent value="list" className="mt-4">
                <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground text-center">
                          {searchQuery ? "Aucune tâche trouvée pour votre recherche" : "Aucune tâche trouvée"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                          {searchQuery ? "Essayez avec d'autres mots-clés" : "Créez votre première tâche pour commencer"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                                  onCheckedChange={handleSelectAll}
                                />
                              </TableHead>
                              <TableHead>Actif</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Priorité</TableHead>
                              <TableHead>Projet</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Échéance</TableHead>
                              <TableHead>Estimation</TableHead>
                              <TableHead>Membres</TableHead>
                              <TableHead className="w-20">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedTasks.map((task: any) => (
                              <ContextMenu key={task.id}>
                                <ContextMenuTrigger asChild>
                                  <TableRow className={selectedTasks.has(task.id) ? "bg-muted/50" : ""}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedTasks.has(task.id)}
                                        onCheckedChange={() => handleSelectTask(task.id)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleToggleActive(task)}
                                      >
                                        {task.isActive ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <Circle className="h-5 w-5 text-muted-foreground" />
                                        )}
                                      </Button>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className={`font-medium ${!task.isActive && "line-through text-muted-foreground"}`}>
                                          {task.name}
                                        </span>
                                        {!task.isActive && (
                                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                            Inactive
                                          </span>
                                        )}
                                        {task.isShared && (
                                          <Users className="h-4 w-4 text-blue-600" aria-label="Tâche partagée" />
                                        )}
                                        {task.reminderDate && (
                                          <Bell className="h-4 w-4 text-amber-600" aria-label="Rappel activé" />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                            <TaskStatusBadge status={task.status} />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskStatus({ id: task.id, status: "TODO" });
                                            if (result?.data) {
                                              toast.success("Statut mis à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            À faire
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskStatus({ id: task.id, status: "IN_PROGRESS" });
                                            if (result?.data) {
                                              toast.success("Statut mis à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            En cours
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskStatus({ id: task.id, status: "REVIEW" });
                                            if (result?.data) {
                                              toast.success("Statut mis à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            Revue
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskStatus({ id: task.id, status: "DONE" });
                                            if (result?.data) {
                                              toast.success("Tâche terminée !");
                                              refreshTasks();
                                            }
                                          }}>
                                            Terminé
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskStatus({ id: task.id, status: "BLOCKED" });
                                            if (result?.data) {
                                              toast.success("Statut mis à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            Bloqué
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                            <TaskPriorityBadge priority={task.priority} />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          <DropdownMenuLabel>Changer la priorité</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskPriority({ id: task.id, priority: "LOW" });
                                            if (result?.data) {
                                              toast.success("Priorité mise à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            Basse
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskPriority({ id: task.id, priority: "MEDIUM" });
                                            if (result?.data) {
                                              toast.success("Priorité mise à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            Moyenne
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskPriority({ id: task.id, priority: "HIGH" });
                                            if (result?.data) {
                                              toast.success("Priorité mise à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            Haute
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            const result = await updateTaskPriority({ id: task.id, priority: "URGENT" });
                                            if (result?.data) {
                                              toast.success("Priorité mise à jour");
                                              refreshTasks();
                                            }
                                          }}>
                                            Urgent
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor: task.Project?.color || '#6b7280'
                                          }}
                                        />
                                        <span>{task.Project?.name || "Sans projet"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm text-muted-foreground truncate block">
                                        {task.description || "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {task.dueDate ? (
                                        <span className="text-sm">
                                          {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">
                                        {task.estimatedHours ? `${task.estimatedHours}h` : "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {task.TaskMember && task.TaskMember.length > 0 ? (
                                        <div className="flex -space-x-2">
                                          {task.TaskMember.slice(0, 3).map((member: any) => (
                                            <Avatar key={member.User.id} className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-background">
                                              <AvatarImage src={member.User.avatar || undefined} />
                                              <AvatarFallback className="text-xs">
                                                {member.User.name.split(" ").map((n: string) => n[0]).join("")}
                                              </AvatarFallback>
                                            </Avatar>
                                          ))}
                                          {task.TaskMember.length > 3 && (
                                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                              <span className="text-xs text-muted-foreground">
                                                +{task.TaskMember.length - 3}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(task)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(task.id)}
                                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => handleEdit(task)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => handleToggleActive(task)}>
                                    {task.isActive ? (
                                      <>
                                        <Circle className="h-4 w-4 mr-2" />
                                        Désactiver
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activer
                                      </>
                                    )}
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {sortedTasks.map((task: any) => (
                          <Card key={task.id} className="p-3 sm:p-4">
                            <div className="space-y-3">
                              {/* Header: Name + Badges */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Checkbox
                                      checked={selectedTasks.has(task.id)}
                                      onCheckedChange={() => handleSelectTask(task.id)}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleToggleActive(task)}
                                    >
                                      {task.isActive ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                  <h3 className={`font-medium text-sm ${!task.isActive && "line-through text-muted-foreground"}`}>
                                    {task.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    {task.isShared && <Users className="h-3 w-3 text-blue-600" />}
                                    {task.reminderDate && <Bell className="h-3 w-3 text-amber-600" />}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(task)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Status & Priority */}
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                      <TaskStatusBadge status={task.status} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskStatus({ id: task.id, status: "TODO" });
                                      if (result?.data) { toast.success("Statut mis à jour"); refreshTasks(); }
                                    }}>À faire</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskStatus({ id: task.id, status: "IN_PROGRESS" });
                                      if (result?.data) { toast.success("Statut mis à jour"); refreshTasks(); }
                                    }}>En cours</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskStatus({ id: task.id, status: "REVIEW" });
                                      if (result?.data) { toast.success("Statut mis à jour"); refreshTasks(); }
                                    }}>Revue</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskStatus({ id: task.id, status: "DONE" });
                                      if (result?.data) { toast.success("Tâche terminée !"); refreshTasks(); }
                                    }}>Terminé</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskStatus({ id: task.id, status: "BLOCKED" });
                                      if (result?.data) { toast.success("Statut mis à jour"); refreshTasks(); }
                                    }}>Bloqué</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                      <TaskPriorityBadge priority={task.priority} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Changer la priorité</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskPriority({ id: task.id, priority: "LOW" });
                                      if (result?.data) { toast.success("Priorité mise à jour"); refreshTasks(); }
                                    }}>Basse</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskPriority({ id: task.id, priority: "MEDIUM" });
                                      if (result?.data) { toast.success("Priorité mise à jour"); refreshTasks(); }
                                    }}>Moyenne</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskPriority({ id: task.id, priority: "HIGH" });
                                      if (result?.data) { toast.success("Priorité mise à jour"); refreshTasks(); }
                                    }}>Haute</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      const result = await updateTaskPriority({ id: task.id, priority: "URGENT" });
                                      if (result?.data) { toast.success("Priorité mise à jour"); refreshTasks(); }
                                    }}>Urgent</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Project */}
                              <div className="flex items-center gap-2 text-xs">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: task.Project?.color || '#6b7280' }}
                                />
                                <span className="truncate">{task.Project?.name || "Sans projet"}</span>
                              </div>

                              {/* Description */}
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                              )}

                              {/* Info row */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                {task.dueDate && (
                                  <div>
                                    <span className="text-muted-foreground">Échéance: </span>
                                    <span>{new Date(task.dueDate).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}</span>
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div>
                                    <span className="text-muted-foreground">Estimation: </span>
                                    <span>{task.estimatedHours}h</span>
                                  </div>
                                )}
                                {task.TaskMember && task.TaskMember.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Membres: </span>
                                    <div className="flex -space-x-1">
                                      {task.TaskMember.slice(0, 2).map((member: any) => (
                                        <Avatar key={member.User.id} className="h-5 w-5 sm:h-6 sm:w-6 border border-background">
                                          <AvatarImage src={member.User.avatar || undefined} />
                                          <AvatarFallback className="text-[8px]">
                                            {member.User.name.split(" ").map((n: string) => n[0]).join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {task.TaskMember.length > 2 && (
                                        <span className="text-[10px]">+{task.TaskMember.length - 2}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      <ConfirmationDialog />
    </div>
  );
}
