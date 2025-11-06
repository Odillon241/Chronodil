"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { getMyTasks } from "@/actions/task.actions";

export type Task = any; // Type à définir selon votre schéma Prisma

export type ViewMode = "table" | "calendar" | "kanban" | "gantt" | "list";

export interface TasksContextType {
  // Données
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  
  // Filtres
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  selectedProject: string;
  
  // Vue
  viewMode: ViewMode;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setPriorityFilter: (filter: string) => void;
  setSelectedProject: (projectId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  loadTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | null>(null);

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}

interface TasksProviderProps {
  children: ReactNode;
  initialProjectId?: string;
}

export function TasksProvider({ children, initialProjectId = "" }: TasksProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Fonction pour charger les tâches
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMyTasks({
        projectId: selectedProject === "all" ? undefined : selectedProject || undefined,
      });
      if (result?.data) {
        setTasks(result.data);
      } else {
        toast.error(result?.serverError || "Erreur lors du chargement des tâches");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  // Fonction pour rafraîchir les tâches (alias de loadTasks)
  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // Charger les tâches au montage et quand le projet sélectionné change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filtrer les tâches en temps réel
  useEffect(() => {
    let filtered = [...tasks];

    // Filtre par recherche
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.Project?.name.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Filtre par priorité
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [searchQuery, tasks, statusFilter, priorityFilter]);

  const value: TasksContextType = {
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
    loadTasks,
    refreshTasks,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

