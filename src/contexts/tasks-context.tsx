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
  startDateFilter: string | undefined;
  endDateFilter: string | undefined;

  // Vue
  viewMode: ViewMode;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setPriorityFilter: (filter: string) => void;
  setSelectedProject: (projectId: string) => void;
  setUserFilter: (filter: "my" | "all") => void;
  setStartDateFilter: (date: string | undefined) => void;
  setEndDateFilter: (date: string | undefined) => void;
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
  const [isLoading, setIsLoading] = useState(true); // Initialiser à true pour afficher le loader au démarrage
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId);
  const [userFilter, setUserFilter] = useState<"my" | "all">("my"); // Par défaut, afficher mes tâches
  const [startDateFilter, setStartDateFilter] = useState<string | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Fonction pour charger les tâches (optimisée : charge uniquement ce qui est nécessaire)
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Charger les tâches selon la vue active pour optimiser les performances
      // Pour tableau et kanban : charger uniquement userTasks
      // Pour calendrier et gantt : charger uniquement allTasks
      
      const needsUserTasks = viewMode === "table" || viewMode === "kanban";
      const needsAllTasks = viewMode === "calendar" || viewMode === "gantt";

      const promises: Promise<any>[] = [];

      // Charger userTasks si nécessaire pour la vue active
      if (needsUserTasks) {
        promises.push(
          getMyTasks({
            projectId: selectedProject === "all" ? undefined : selectedProject || undefined,
          }).then((result) => {
            if (result?.data) {
              setUserTasks(result.data);
            } else {
              toast.error(result?.serverError || "Erreur lors du chargement des tâches utilisateur");
            }
          }).catch((error) => {
            console.error("Erreur lors du chargement des tâches utilisateur:", error);
            toast.error("Erreur lors du chargement des tâches utilisateur");
          })
        );
      }

      // Charger allTasks si nécessaire pour la vue active
      if (needsAllTasks) {
        promises.push(
          getAllTasks({
            projectId: selectedProject === "all" ? undefined : selectedProject || undefined,
          }).then((result) => {
            if (result?.data) {
              setAllTasks(result.data);
            } else {
              toast.error(result?.serverError || "Erreur lors du chargement de toutes les tâches");
            }
          }).catch((error) => {
            console.error("Erreur lors du chargement de toutes les tâches:", error);
            toast.error("Erreur lors du chargement de toutes les tâches");
          })
        );
      }

      // Si aucune vue ne nécessite de chargement, on a déjà les données
      if (promises.length === 0) {
        setIsLoading(false);
        return;
      }

      await Promise.allSettled(promises);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, viewMode]);

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

    // Filtre par date de début
    if (startDateFilter) {
      const startDate = new Date(startDateFilter);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= startDate;
      });
    }

    // Filtre par date de fin
    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate <= endDate;
      });
    }

    setFilteredTasks(filtered);
  }, [searchQuery, userTasks, allTasks, statusFilter, priorityFilter, startDateFilter, endDateFilter, viewMode, userFilter]);

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
    loadTasks,
    refreshTasks,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

