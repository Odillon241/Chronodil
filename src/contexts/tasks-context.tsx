"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { getMyTasks, getAllTasks } from "@/actions/task.actions";

export type Task = any; // Type à définir selon votre schéma Prisma

export type ViewMode = "table" | "calendar" | "kanban" | "gantt";

export interface TasksContextType {
  // Données
  userTasks: Task[]; // Tâches de l'utilisateur connecté (pour tableau et kanban)
  allTasks: Task[]; // Toutes les tâches (pour calendrier et gantt)
  filteredTasks: Task[];
  isLoading: boolean;
  
  // Filtres
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  selectedProject: string;
  userFilter: "my" | "all"; // Filtre utilisateur pour tableau et kanban
  
  // Vue
  viewMode: ViewMode;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setPriorityFilter: (filter: string) => void;
  setSelectedProject: (projectId: string) => void;
  setUserFilter: (filter: "my" | "all") => void;
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
  const [userTasks, setUserTasks] = useState<Task[]>([]); // Tâches de l'utilisateur
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Toutes les tâches
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId);
  const [userFilter, setUserFilter] = useState<"my" | "all">("my"); // Par défaut, afficher mes tâches
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Fonction pour charger les tâches
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Charger les tâches de l'utilisateur (pour tableau et kanban)
      const userTasksResult = await getMyTasks({
        projectId: selectedProject === "all" ? undefined : selectedProject || undefined,
      });
      
      // Charger toutes les tâches (pour calendrier et gantt)
      const allTasksResult = await getAllTasks({
        projectId: selectedProject === "all" ? undefined : selectedProject || undefined,
      });

      if (userTasksResult?.data) {
        setUserTasks(userTasksResult.data);
      } else {
        toast.error(userTasksResult?.serverError || "Erreur lors du chargement des tâches utilisateur");
      }

      if (allTasksResult?.data) {
        setAllTasks(allTasksResult.data);
      } else {
        toast.error(allTasksResult?.serverError || "Erreur lors du chargement de toutes les tâches");
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

  // Filtrer les tâches en temps réel selon la vue
  useEffect(() => {
    // Pour tableau et kanban : utiliser userFilter pour choisir entre userTasks et allTasks
    // Pour calendrier et gantt : toujours utiliser allTasks
    let sourceTasks: Task[];
    if (viewMode === "table" || viewMode === "kanban") {
      sourceTasks = userFilter === "my" ? userTasks : allTasks;
    } else {
      sourceTasks = allTasks;
    }
    let filtered = [...sourceTasks];

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
  }, [searchQuery, userTasks, allTasks, statusFilter, priorityFilter, viewMode, userFilter]);

  const value: TasksContextType = {
    userTasks,
    allTasks,
    filteredTasks,
    isLoading,
    searchQuery,
    statusFilter,
    priorityFilter,
    selectedProject,
    userFilter,
    viewMode,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setSelectedProject,
    setUserFilter,
    setViewMode,
    loadTasks,
    refreshTasks,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

