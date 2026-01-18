"use client";

import { List, CalendarDays, ChartGantt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusTabOption } from "@/components/ui/status-tabs";
import { FilterButtonGroup } from "@/components/ui/filter-button-group";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "calendar" | "kanban" | "gantt";

interface TasksToolbarProps {
  // Recherche
  searchQuery: string;
  onSearchChange: (value: string) => void;

  // Filtres
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  userFilter: "my" | "all";
  onUserFilterChange: (value: "my" | "all") => void;
  startDateFilter?: string;
  onStartDateChange: (value?: string) => void;
  endDateFilter?: string;
  onEndDateChange: (value?: string) => void;

  // Options de statut
  statusOptions: StatusTabOption[];

  // Vue
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}

export function TasksToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  userFilter,
  onUserFilterChange,
  startDateFilter,
  onStartDateChange,
  endDateFilter,
  onEndDateChange,
  statusOptions,
  viewMode,
  onViewModeChange,
}: TasksToolbarProps) {

  const userOptions = [
    { id: "my", label: "Mes tâches", value: "my" },
    { id: "all", label: "Toutes les tâches", value: "all" },
  ];

  const priorityOptions = [
    { id: "all", label: "Toutes les priorités", value: "all" },
    { id: "LOW", label: "Basse", value: "LOW" },
    { id: "MEDIUM", label: "Moyenne", value: "MEDIUM" },
    { id: "HIGH", label: "Haute", value: "HIGH" },
    { id: "URGENT", label: "Urgente", value: "URGENT" },
  ];

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      {/* Filtres de statut (Tabs minimalistes - Style HR) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {statusOptions.map((option) => (
          <Button
            key={option.id}
            variant={statusFilter === option.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "rounded-full h-8 px-3 text-xs font-medium transition-all",
              statusFilter === option.id
                ? ""
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn(
                "ml-2 py-0.5 px-1.5 rounded-full text-[10px]",
                statusFilter === option.id ? "bg-primary-foreground/20" : "bg-muted-foreground/10"
              )}>
                {option.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* View Switcher */}
      <div className="flex items-center border rounded-lg p-1 bg-muted/20 gap-1">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("list")}
          className="h-7 px-2"
          title="Vue Liste"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "calendar" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("calendar")}
          className="h-7 px-2"
          title="Vue Calendrier"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "gantt" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("gantt")}
          className="h-7 px-2"
          title="Vue Gantt"
        >
          <ChartGantt className="h-4 w-4" />
        </Button>
      </div>

      {/* Barre de recherche et Filtres avec FilterButtonGroup */}
      <FilterButtonGroup
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="Rechercher..."

        // Premier Filtre: Utilisateur
        firstFilterLabel="Utilisateur"
        filterOptions={userOptions}
        selectedFilter={userFilter}
        onFilterChange={(val) => onUserFilterChange(val as "my" | "all")}

        // Second Filtre: Priorité
        secondFilterLabel="Priorité"
        secondFilterOptions={priorityOptions}
        selectedSecondFilter={priorityFilter}
        onSecondFilterChange={onPriorityChange}

        // Filtre Date
        startDate={startDateFilter}
        endDate={endDateFilter}
        onDateChange={(start, end) => {
          onStartDateChange(start || undefined);
          onEndDateChange(end || undefined);
        }}
      />
    </div>
  );
}
