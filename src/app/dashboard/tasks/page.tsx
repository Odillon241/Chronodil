"use client";

import { useState, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Components
import { TasksHeader } from "@/components/tasks/tasks-header";
import { TasksToolbar } from "@/components/tasks/tasks-toolbar";
import { TasksList } from "@/components/tasks/tasks-list";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";

// Hooks
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { useTaskReminders } from "@/hooks/use-task-reminders";
import { useRealtimeTasksOptimized } from "@/hooks/use-realtime-tasks.optimized";
import { useTasks } from "@/contexts/tasks-context";
import type { StatusTabOption } from "@/components/ui/status-tabs";

// Actions
import {
  deleteTask,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
} from "@/actions/task.actions";

// Lazy load des composants lourds
const TaskCalendar = dynamic(
  () => import("@/components/features/task-calendar").then(mod => ({ default: mod.TaskCalendar })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    ),
    ssr: false,
  }
);



const TaskGantt = dynamic(
  () => import("@/components/features/task-gantt").then(mod => ({ default: mod.TaskGantt })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    ),
    ssr: false,
  }
);

export default function TasksPage() {
  const { data: session } = useSession() as any;
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // Contexte des tâches
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

  // État local
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Activer les rappels de tâches
  useTaskReminders({ tasks: userTasks });

  // Écouter les changements en temps réel
  useRealtimeTasksOptimized({
    userId: session?.user?.id || "",
    enabled: !!session?.user?.id,
  });

  // Calculer les options de statut pour les tabs
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

  // Gestionnaires d'événements
  const handleNewTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await showConfirmation({
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
          } else {
            toast.error("Erreur lors de la suppression");
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
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED") => {
    try {
      const result = await updateTaskStatus({ id: taskId, status: newStatus });
      if (result?.data) {
        toast.success("Statut mis à jour");
        refreshTasks();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => {
    try {
      const result = await updateTaskPriority({ id: taskId, priority: newPriority });
      if (result?.data) {
        toast.success("Priorité mise à jour");
        refreshTasks();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
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

  // Gestionnaires pour le calendrier
  const handleCalendarEventClick = (task: any) => {
    handleEdit(task);
  };

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

  const handleCalendarSlotDoubleClick = (date: Date) => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex-1 space-y-6">
      <TasksHeader onNewTask={handleNewTask} />



      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        userFilter={userFilter}
        onUserFilterChange={setUserFilter}
        startDateFilter={startDateFilter}
        onStartDateChange={setStartDateFilter}
        endDateFilter={endDateFilter}
        onEndDateChange={setEndDateFilter}
        statusOptions={statusTabOptions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
          <Spinner className="h-8 w-8 text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            Chargement des tâches...
          </p>
        </div>
      ) : (
        <>
          {viewMode === "list" && (
            <TasksList
              tasks={filteredTasks}
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
              selectedTasks={selectedTasks}
              onSelectTask={handleSelectTask}
              onSelectAll={handleSelectAll}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
            />
          )}

          {viewMode === "calendar" && (
            <TaskCalendar
              tasks={filteredTasks}
              onEventClick={handleCalendarEventClick}
              onEventDrop={handleCalendarEventDrop}
              onDayDoubleClick={handleCalendarSlotDoubleClick}
              onEventDelete={handleDelete}
              onEventToggle={handleToggleActive}
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
            />
          )}



          {viewMode === "gantt" && (
            <TaskGantt
              tasks={filteredTasks}
              onEventClick={handleCalendarEventClick}
              onEventDrop={handleCalendarEventDrop}
              onEventDelete={handleDelete}
              onEventToggle={handleToggleActive}
              onAddItem={handleCalendarSlotDoubleClick}
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
            />
          )}
        </>
      )}

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTask={editingTask}
        currentUserId={session?.user?.id}
        onSuccess={refreshTasks}
      />

      <ConfirmationDialog />
    </div>
  );
}
