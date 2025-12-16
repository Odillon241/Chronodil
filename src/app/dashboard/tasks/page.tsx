"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Plus, Edit, Trash2, CheckCircle, Circle, FolderOpen, Check, Calendar, Bell, Users, X, Volume2, VolumeX, MoreVertical, Filter } from "lucide-react";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { createTask, updateTask, deleteTask, getMyTasks, getAvailableUsersForSharing, updateTaskStatus, updateTaskPriority } from "@/actions/task.actions";
import { getMyProjects } from "@/actions/project.actions";
import { getAvailableHRTimesheetsForTask, getActivityCatalog, getActivityCategories } from "@/actions/hr-timesheet.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { isSameDay } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { useTaskReminders } from "@/hooks/use-task-reminders";
import { TaskStatusBadge } from "@/components/features/task-status-badge";
import { TaskPriorityBadge } from "@/components/features/task-priority-badge";
import { StatusTabs, type StatusTabOption } from "@/components/ui/status-tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Lazy loading des composants d'onglets (chargés uniquement quand l'onglet est ouvert)
const TaskComments = dynamic(() => import("@/components/features/task-comments").then(mod => ({ default: mod.TaskComments })), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Spinner className="h-6 w-6 text-primary" />
    </div>
  ),
  ssr: false,
});

const TaskActivityTimeline = dynamic(() => import("@/components/features/task-activity-timeline").then(mod => ({ default: mod.TaskActivityTimeline })), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Spinner className="h-6 w-6 text-primary" />
    </div>
  ),
  ssr: false,
});
import { useSession } from "@/lib/auth-client";
import type { Session } from "@/lib/auth";
import { TaskRoadmap } from "@/components/features/task-roadmap";
import { useRealtimeTasksOptimized } from "@/hooks/use-realtime-tasks.optimized";
import dynamic from "next/dynamic";

// Lazy loading des composants lourds pour améliorer les performances
const TaskKanban = dynamic(() => import("@/components/features/task-kanban").then(mod => ({ default: mod.TaskKanban })), {
  loading: () => (
    <div className="flex items-center justify-center py-12 min-h-[400px]">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  ),
  ssr: false,
});

const TaskGantt = dynamic(() => import("@/components/features/task-gantt").then(mod => ({ default: mod.TaskGantt })), {
  loading: () => (
    <div className="flex items-center justify-center py-12 min-h-[400px]">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  ),
  ssr: false,
});

const TaskCalendar = dynamic(() => import("@/components/features/task-calendar").then(mod => ({ default: mod.TaskCalendar })), {
  loading: () => (
    <div className="flex items-center justify-center py-12 min-h-[400px]">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  ),
  ssr: false,
});
import { useTasks, type ViewMode } from "@/contexts/tasks-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

// Messages de chargement rotatifs
const loadingMessages = [
  "Chargement des tâches...",
  "Veuillez patienter, chargement en cours...",
  "Cela ne prendra que quelques secondes...",
  "Merci de votre patience, chargement des données...",
  "Presque terminé, veuillez patienter...",
  "Récupération de vos tâches en cours...",
  "Chargement, merci d'attendre...",
  "Traitement des données, veuillez patienter...",
];

export default function TasksPage() {
  const { data: session } = useSession() as { data: Session | null };
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  
  // Utiliser le contexte pour les tâches
  const {
    userTasks,
    allTasks,
    filteredTasks,
    isLoading,
    searchQuery,
    statusFilter,
    priorityFilter,
    selectedProject,
    userFilter,
    startDateFilter,
    endDateFilter,
    viewMode,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setSelectedProject,
    setUserFilter,
    setStartDateFilter,
    setEndDateFilter,
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
  const [catalog, setCatalog] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Faire tourner les messages pendant le chargement
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // Changer de message toutes les 2 secondes

    return () => clearInterval(interval);
  }, [isLoading]);

  // Activer les rappels de tâches (utiliser userTasks pour les rappels)
  useTaskReminders({ tasks: userTasks });

  // Écouter les changements en temps réel sur les tâches
  // ⚡ OPTIMISÉ: Filtrage côté serveur + synchronisation automatique React Query
  useRealtimeTasksOptimized({
    userId: session?.user?.id || "",
    enabled: !!session?.user?.id,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "no-project",
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
    hrTimesheetId: "no-timesheet",
    activityType: "OPERATIONAL",
    activityName: "",
    periodicity: "WEEKLY",
  });

  // Charger les données nécessaires au montage (en parallèle mais avec gestion d'erreur)
  useEffect(() => {
    // Charger uniquement les données nécessaires pour le formulaire
    // Ces données ne sont nécessaires que quand le dialog est ouvert
    const loadInitialData = async () => {
      try {
        // Charger en parallèle mais ne pas bloquer le rendu
        await Promise.allSettled([
          loadProjects(),
          loadAvailableTimesheets(),
          loadActivityCatalog(),
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des données initiales:", error);
      }
    };
    
    loadInitialData();
  }, []);

  const loadActivityCatalog = useCallback(async () => {
    try {
      const [catalogResult, categoriesResult] = await Promise.all([
        getActivityCatalog({}),
        getActivityCategories(),
      ]);
      if (catalogResult?.data) {
        setCatalog(catalogResult.data);
      }
      if (categoriesResult?.data) {
        setCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du catalogue d'activités:", error);
    }
  }, []);

  // Déterminer le type à partir de la catégorie
  const getTypeFromCategory = (category: string): "OPERATIONAL" | "REPORTING" => {
    return category === "Reporting" ? "REPORTING" : "OPERATIONAL";
  };

  // Filtrer les activités du catalogue selon la catégorie (mémoïsé)
  const filteredCatalogActivities = useMemo(() => {
    return selectedCategory
      ? catalog.filter((item: any) => item.category === selectedCategory)
      : [];
  }, [selectedCategory, catalog]);

  const loadProjects = useCallback(async () => {
    try {
      const result = await getMyProjects({});
      if (result?.data) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    }
  }, []);

  const loadAvailableTimesheets = useCallback(async () => {
    try {
      const result = await getAvailableHRTimesheetsForTask();
      if (result?.data) {
        setAvailableTimesheets(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des timesheets:", error);
    }
  }, []);


  const loadAvailableUsers = useCallback(async (projectId?: string) => {
    try {
      const result = await getAvailableUsersForSharing({
        projectId: projectId === "no-project" ? undefined : projectId,
      });
      if (result?.data) {
        setAvailableUsers(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  }, []);

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
          projectId: formData.projectId === "no-project" ? undefined : formData.projectId || undefined,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
          reminderTime: formData.reminderTime || undefined,
          soundEnabled: formData.soundEnabled,
          isShared: formData.isShared,
          sharedWith: formData.isShared ? selectedUsers : undefined,
          status: formData.status as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED",
          priority: formData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          complexity: formData.complexity as "FAIBLE" | "MOYEN" | "LEV_",
          trainingLevel: formData.trainingLevel,
          masteryLevel: formData.masteryLevel,
          understandingLevel: formData.understandingLevel,
          hrTimesheetId: formData.hrTimesheetId === "no-timesheet" ? undefined : formData.hrTimesheetId || undefined,
          activityType: formData.activityType || undefined,
          activityName: formData.activityName || undefined,
          periodicity: formData.periodicity || undefined,
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
      projectId: task.projectId || "no-project",
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
      activityType: task.activityType || "OPERATIONAL",
      activityName: task.activityName || "",
      periodicity: task.periodicity || "WEEKLY",
      hrTimesheetId: task.hrTimesheetId || "no-timesheet",
    });

    // Initialiser la catégorie et l'activité depuis le catalogue
    if (task.activityName && catalog.length > 0) {
      const catalogItem = catalog.find((item: any) => item.name === task.activityName);
      if (catalogItem) {
        setSelectedCategory(catalogItem.category);
        setSelectedCatalogId(catalogItem.id);
      } else {
        setSelectedCategory("");
        setSelectedCatalogId("");
      }
    } else {
      setSelectedCategory("");
      setSelectedCatalogId("");
    }

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
      projectId: "no-project",
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
      hrTimesheetId: "no-timesheet",
      activityType: "OPERATIONAL",
      activityName: "",
      periodicity: "WEEKLY",
    });
    setSelectedUsers([]);
    setEditingTask(null);
    setSelectedCategory("");
    setSelectedCatalogId("");
  };

  // Gérer la sélection d'activité du catalogue
  const handleCatalogItemSelect = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const catalogItem = catalog.find((c: any) => c.id === catalogId);
    if (catalogItem) {
      // Auto-remplir les champs
      setFormData({
        ...formData,
        activityName: catalogItem.name,
        activityType: getTypeFromCategory(catalogItem.category),
      });
      if (catalogItem.defaultPeriodicity) {
        setFormData((prev) => ({
          ...prev,
          periodicity: catalogItem.defaultPeriodicity,
        }));
      }
    }
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

  // Trier les tâches par projet puis par nom (mémoïsé pour éviter les recalculs)
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const projectA = a.Project?.name || "Sans projet";
      const projectB = b.Project?.name || "Sans projet";
      if (projectA !== projectB) {
        return projectA.localeCompare(projectB);
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredTasks]);

  // Calculer les compteurs de statut pour les onglets
  const statusTabOptions = useMemo<StatusTabOption[]>(() => {
    const tasksToCount = userFilter === "my" ? userTasks : allTasks;
    const counts = {
      all: tasksToCount.length,
      TODO: tasksToCount.filter(t => t.status === "TODO").length,
      IN_PROGRESS: tasksToCount.filter(t => t.status === "IN_PROGRESS").length,
      REVIEW: tasksToCount.filter(t => t.status === "REVIEW").length,
      DONE: tasksToCount.filter(t => t.status === "DONE").length,
      BLOCKED: tasksToCount.filter(t => t.status === "BLOCKED").length,
    };

    return [
      { id: "all", label: "Tous", value: "all", count: counts.all },
      { id: "TODO", label: "À faire", value: "TODO", count: counts.TODO },
      { id: "IN_PROGRESS", label: "En cours", value: "IN_PROGRESS", count: counts.IN_PROGRESS },
      { id: "REVIEW", label: "En revue", value: "REVIEW", count: counts.REVIEW },
      { id: "DONE", label: "Terminé", value: "DONE", count: counts.DONE },
      { id: "BLOCKED", label: "Bloqué", value: "BLOCKED", count: counts.BLOCKED },
    ];
  }, [userTasks, allTasks, userFilter]);

  // Options pour les onglets de vue
  const viewTabOptions = useMemo<StatusTabOption[]>(() => {
    const tasksToCount = userFilter === "my" ? userTasks : allTasks;
    return [
      { id: "table", label: "Tableau", value: "table", count: tasksToCount.length },
      { id: "calendar", label: "Calendrier", value: "calendar", count: tasksToCount.length },
      { id: "kanban", label: "Kanban", value: "kanban", count: tasksToCount.length },
      { id: "gantt", label: "Gantt", value: "gantt", count: tasksToCount.length },
    ];
  }, [userTasks, allTasks, userFilter]);

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
                        <SelectItem value="no-project">Aucun projet</SelectItem>
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
                        <SelectItem value="no-timesheet">Aucune feuille de temps</SelectItem>
                        {availableTimesheets.map((timesheet) => (
                          <SelectItem key={timesheet.id} value={timesheet.id}>
                            📅 Semaine du {new Date(timesheet.weekStartDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            {" au "}{new Date(timesheet.weekEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {" "}({timesheet.status === "DRAFT" ? "Brouillon" : "En attente"})
                          </SelectItem>
                        ))}
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

              {/* Nouveaux champs pour intégration avec activités RH */}
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Informations activité RH (optionnel)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs sm:text-sm">Catégorie</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value);
                        setSelectedCatalogId("");
                        // Déterminer automatiquement le type OPERATIONAL/REPORTING
                        const activityType = getTypeFromCategory(value);
                        setFormData({
                          ...formData,
                          activityType,
                          activityName: "",
                        });
                      }}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
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
                    <Label htmlFor="activityName" className="text-xs sm:text-sm">Nom de l'activité</Label>
                    <Select
                      value={selectedCatalogId}
                      onValueChange={handleCatalogItemSelect}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder={selectedCategory ? "Sélectionner une activité" : "Sélectionnez d'abord une catégorie"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredCatalogActivities.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodicity" className="text-xs sm:text-sm">Périodicité</Label>
                    <Select
                      value={formData.periodicity}
                      onValueChange={(value) => setFormData({ ...formData, periodicity: value })}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Périodicité" />
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
                </div>

                {/* Afficher le type auto-sélectionné */}
                {selectedCatalogId && (
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Type d'activité (auto)</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={formData.activityType === "OPERATIONAL" ? "default" : "secondary"} className="text-xs">
                        {formData.activityType === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Basé sur la catégorie sélectionnée
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />

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
                            loadAvailableUsers(formData.projectId === "no-project" ? undefined : formData.projectId);
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
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Enregistrement...
                    </span>
                  ) : editingTask ? "Mettre à jour" : "Créer"}
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

      <Separator />

      {/* Vues des tâches */}
      {showCalendar && (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full min-w-0">
              <div className="mb-4 -mx-6 px-6">
                <StatusTabs
                  options={viewTabOptions}
                  selectedValue={viewMode}
                  onValueChange={(value) => {
                    if (value === "table" || value === "calendar" || value === "kanban" || value === "gantt") {
                      setViewMode(value);
                    }
                  }}
                />
              </div>

              {/* Loader de chargement */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                  <Spinner className="h-8 w-8 text-primary mb-4" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {loadingMessages[loadingMessageIndex]}
                  </p>
                </div>
              ) : (
                <>
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
                    currentUserId={session?.user?.id}
                    currentUserRole={session?.user?.role}
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
                <div className="space-y-4">
                  {/* Barre de recherche et filtre pour le Kanban */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Input
                        type="text"
                        placeholder="Rechercher une tâche..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 relative"
                        >
                          <Filter className="h-4 w-4" />
                          {(statusFilter !== "all" || priorityFilter !== "all" || userFilter !== "my" || startDateFilter || endDateFilter) && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Utilisateur</Label>
                            <Select value={userFilter} onValueChange={(value) => setUserFilter(value as "my" | "all")}>
                              <SelectTrigger>
                                <SelectValue placeholder="Filtrer par utilisateur" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="my">Mes tâches</SelectItem>
                                <SelectItem value="all">Toutes les tâches</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <StatusTabs
                              options={statusTabOptions}
                              selectedValue={statusFilter}
                              onValueChange={setStatusFilter}
                              variant="compact"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Priorité</Label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="Toutes les priorités" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Toutes les priorités</SelectItem>
                                <SelectItem value="LOW">Basse</SelectItem>
                                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                                <SelectItem value="HIGH">Haute</SelectItem>
                                <SelectItem value="URGENT">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <Label htmlFor="start-date-kanban">Date d'échéance - Début</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="start-date-kanban"
                                type="date"
                                value={startDateFilter || ""}
                                onChange={(e) => setStartDateFilter(e.target.value || undefined)}
                                className="text-sm"
                              />
                              {startDateFilter && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setStartDateFilter(undefined)}
                                  className="h-9 w-9 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end-date-kanban">Date d'échéance - Fin</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="end-date-kanban"
                                type="date"
                                value={endDateFilter || ""}
                                onChange={(e) => setEndDateFilter(e.target.value || undefined)}
                                className="text-sm"
                              />
                              {endDateFilter && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEndDateFilter(undefined)}
                                  className="h-9 w-9 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {(statusFilter !== "all" || priorityFilter !== "all" || userFilter !== "my" || startDateFilter || endDateFilter) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setStatusFilter("all");
                                setPriorityFilter("all");
                                setUserFilter("my");
                                setStartDateFilter(undefined);
                                setEndDateFilter(undefined);
                              }}
                            >
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-full overflow-x-auto -mx-6 px-6">
                    <TaskKanban
                      tasks={filteredTasks}
                      onEventClick={handleCalendarEventClick}
                      onStatusChange={handleStatusChange}
                      onEventDelete={handleDirectDelete}
                      onEventToggle={handleToggleActive}
                      currentUserId={session?.user?.id}
                      currentUserRole={session?.user?.role}
                    />
                  </div>
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
                    currentUserId={session?.user?.id}
                    currentUserRole={session?.user?.role}
                  />
                </div>
              </TabsContent>

              {/* Vue Tableau */}
              <TabsContent value="table" className="mt-4">
                <div className="space-y-4">
                  {/* Barre de recherche et filtre pour le tableau */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Input
                        type="text"
                        placeholder="Rechercher une tâche..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 relative"
                        >
                          <Filter className="h-4 w-4" />
                          {(statusFilter !== "all" || priorityFilter !== "all" || userFilter !== "my" || startDateFilter || endDateFilter) && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Utilisateur</Label>
                            <Select value={userFilter} onValueChange={(value) => setUserFilter(value as "my" | "all")}>
                              <SelectTrigger>
                                <SelectValue placeholder="Filtrer par utilisateur" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="my">Mes tâches</SelectItem>
                                <SelectItem value="all">Toutes les tâches</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <StatusTabs
                              options={statusTabOptions}
                              selectedValue={statusFilter}
                              onValueChange={setStatusFilter}
                              variant="compact"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Priorité</Label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="Toutes les priorités" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Toutes les priorités</SelectItem>
                                <SelectItem value="LOW">Basse</SelectItem>
                                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                                <SelectItem value="HIGH">Haute</SelectItem>
                                <SelectItem value="URGENT">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <Label htmlFor="start-date-table">Date d'échéance - Début</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="start-date-table"
                                type="date"
                                value={startDateFilter || ""}
                                onChange={(e) => setStartDateFilter(e.target.value || undefined)}
                                className="text-sm"
                              />
                              {startDateFilter && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setStartDateFilter(undefined)}
                                  className="h-9 w-9 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end-date-table">Date d'échéance - Fin</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="end-date-table"
                                type="date"
                                value={endDateFilter || ""}
                                onChange={(e) => setEndDateFilter(e.target.value || undefined)}
                                className="text-sm"
                              />
                              {endDateFilter && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEndDateFilter(undefined)}
                                  className="h-9 w-9 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {(statusFilter !== "all" || priorityFilter !== "all" || userFilter !== "my" || startDateFilter || endDateFilter) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setStatusFilter("all");
                                setPriorityFilter("all");
                                setUserFilter("my");
                                setStartDateFilter(undefined);
                                setEndDateFilter(undefined);
                              }}
                            >
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

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
                    <div className="hidden lg:block rounded-lg border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b bg-muted/30">
                            <TableHead className="w-12 px-3">
                              <Checkbox
                                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">Nom</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Statut</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Priorité</TableHead>
                            <TableHead className="font-semibold text-foreground">Projet</TableHead>
                            <TableHead className="font-semibold text-foreground">Description</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Échéance</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Estimation</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Membres</TableHead>
                            <TableHead className="w-24 text-center font-semibold text-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedTasks.map((task: any) => (
                            <ContextMenu key={task.id}>
                              <ContextMenuTrigger asChild>
                                <TableRow className={`border-b transition-colors ${selectedTasks.has(task.id) ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                                  <TableCell className="px-3 py-3">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={selectedTasks.has(task.id)}
                                        onCheckedChange={() => handleSelectTask(task.id)}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2 min-w-[200px]">
                                      <span className={`font-medium text-sm ${!task.isActive && "line-through text-muted-foreground"}`}>
                                        {task.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {!task.isActive && (
                                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            Inactive
                                          </span>
                                        )}
                                        {task.isShared && (
                                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-label="Tâche partagée" />
                                        )}
                                        {task.reminderDate && (
                                          <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-label="Rappel activé" />
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    {(() => {
                                      const isCreator = task.User_Task_createdByToUser?.id === session?.user?.id;
                                      const isAdmin = session?.user?.role === "ADMIN";
                                      const canModify = isCreator || isAdmin;
                                      
                                      if (!canModify) {
                                        return (
                                          <div className="flex items-center justify-center">
                                            <TaskStatusBadge status={task.status} />
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div className="flex items-center justify-center">
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
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              À faire
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskStatus({ id: task.id, status: "IN_PROGRESS" });
                                              if (result?.data) {
                                                toast.success("Statut mis à jour");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              En cours
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskStatus({ id: task.id, status: "REVIEW" });
                                              if (result?.data) {
                                                toast.success("Statut mis à jour");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Revue
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskStatus({ id: task.id, status: "DONE" });
                                              if (result?.data) {
                                                toast.success("Tâche terminée !");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Terminé
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskStatus({ id: task.id, status: "BLOCKED" });
                                              if (result?.data) {
                                                toast.success("Statut mis à jour");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Bloqué
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    {(() => {
                                      const isCreator = task.User_Task_createdByToUser?.id === session?.user?.id;
                                      const isAdmin = session?.user?.role === "ADMIN";
                                      const canModify = isCreator || isAdmin;
                                      
                                      if (!canModify) {
                                        return (
                                          <div className="flex items-center justify-center">
                                            <TaskPriorityBadge priority={task.priority} />
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div className="flex items-center justify-center">
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
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Basse
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskPriority({ id: task.id, priority: "MEDIUM" });
                                              if (result?.data) {
                                                toast.success("Priorité mise à jour");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Moyenne
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskPriority({ id: task.id, priority: "HIGH" });
                                              if (result?.data) {
                                                toast.success("Priorité mise à jour");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Haute
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              const result = await updateTaskPriority({ id: task.id, priority: "URGENT" });
                                              if (result?.data) {
                                                toast.success("Priorité mise à jour");
                                                refreshTasks();
                                              } else if (result?.serverError) {
                                                toast.error(result.serverError);
                                              }
                                            }}>
                                              Urgent
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2 min-w-[120px]">
                                      <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                          backgroundColor: task.Project?.color || '#6b7280'
                                        }}
                                      />
                                      <span className="text-sm truncate">{task.Project?.name || "Sans projet"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <span className="text-sm text-muted-foreground truncate block max-w-[200px]" title={task.description || undefined}>
                                      {task.description || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                      {task.dueDate ? (
                                        <span className="text-sm whitespace-nowrap">
                                          {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                      <span className="text-sm whitespace-nowrap">
                                        {task.estimatedHours ? `${task.estimatedHours}h` : <span className="text-muted-foreground">-</span>}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                      {task.TaskMember && task.TaskMember.length > 0 ? (
                                        <div className="flex -space-x-2">
                                          {task.TaskMember.slice(0, 3).map((member: any) => (
                                            <Avatar key={member.User.id} className="h-7 w-7 border-2 border-background hover:z-10 transition-transform hover:scale-110">
                                              <AvatarImage src={member.User.avatar || undefined} />
                                              <AvatarFallback className="text-xs">
                                                {member.User.name.split(" ").map((n: string) => n[0]).join("")}
                                              </AvatarFallback>
                                            </Avatar>
                                          ))}
                                          {task.TaskMember.length > 3 && (
                                            <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center hover:z-10 transition-transform hover:scale-110">
                                              <span className="text-xs text-muted-foreground font-medium">
                                                +{task.TaskMember.length - 3}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    {(() => {
                                      const isCreator = task.User_Task_createdByToUser?.id === session?.user?.id;
                                      const isAdmin = session?.user?.role === "ADMIN";
                                      const canModify = isCreator || isAdmin;
                                      
                                      if (!canModify) return null;
                                      
                                      return (
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEdit(task);
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-accent"
                                            title="Modifier"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDelete(task.id);
                                            }}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                </TableRow>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                {(() => {
                                  const isCreator = task.User_Task_createdByToUser?.id === session?.user?.id;
                                  const isAdmin = session?.user?.role === "ADMIN";
                                  const canModify = isCreator || isAdmin;
                                  
                                  return (
                                    <>
                                      {canModify && (
                                        <ContextMenuItem onClick={() => handleEdit(task)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Modifier
                                        </ContextMenuItem>
                                      )}
                                      {canModify && (
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
                                      )}
                                      {canModify && (
                                        <>
                                          <ContextMenuSeparator />
                                          <ContextMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Supprimer
                                          </ContextMenuItem>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </ContextMenuContent>
                            </ContextMenu>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
                </>
              )}
            </Tabs>
      )}
      <ConfirmationDialog />
    </div>
  );
}

