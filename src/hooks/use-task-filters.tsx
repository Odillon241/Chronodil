import { useLocalStorage } from "./use-local-storage";

export interface TaskFilters {
  status: string;
  priority: string;
  projectId: string;
  search: string;
  assignedToMe: boolean;
  createdByMe: boolean;
}

const defaultFilters: TaskFilters = {
  status: "all",
  priority: "all",
  projectId: "all",
  search: "",
  assignedToMe: false,
  createdByMe: false,
};

export function useTaskFilters() {
  const [filters, setFilters] = useLocalStorage<TaskFilters>("task-filters", defaultFilters);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const updateFilter = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = () => {
    return (
      filters.status !== "all" ||
      filters.priority !== "all" ||
      filters.projectId !== "all" ||
      filters.search !== "" ||
      filters.assignedToMe ||
      filters.createdByMe
    );
  };

  return {
    filters,
    setFilters,
    resetFilters,
    updateFilter,
    hasActiveFilters: hasActiveFilters(),
  };
}
