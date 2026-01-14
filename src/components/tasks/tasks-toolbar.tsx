"use client";

import { Calendar as CalendarIcon, List, CalendarDays, ChartGantt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchWithFilters, FilterSection, FilterField } from "@/components/ui/search-with-filters";
import { StatusTabOption } from "@/components/ui/status-tabs";
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

  // Extra filters logic for the popover (keeping existing logic but in new layout)
  const hasActiveFilters =
    priorityFilter !== "all" ||
    userFilter !== "my" ||
    !!startDateFilter ||
    !!endDateFilter;

  const resetFilters = () => {
    onPriorityChange("all");
    onUserFilterChange("my");
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

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
      <div className="flex items-center border rounded-lg p-1 bg-muted/20">
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

      {/* Barre de recherche et Filtres avancés */}
      <SearchWithFilters
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Rechercher..."
        variant="with-filter-button"
        hasActiveFilters={hasActiveFilters}
        filterContent={
          <FilterSection>
            <FilterField label="Utilisateur">
              <Select value={userFilter} onValueChange={(value) => onUserFilterChange(value as "my" | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my">Mes tâches</SelectItem>
                  <SelectItem value="all">Toutes les tâches</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Priorité">
              <Select value={priorityFilter} onValueChange={onPriorityChange}>
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
            </FilterField>

            <div className="grid grid-cols-2 gap-2">
              <FilterField label="Début">
                <Input
                  id="start-date"
                  type="date"
                  value={startDateFilter || ""}
                  onChange={(e) => onStartDateChange(e.target.value || undefined)}
                  className="text-xs h-8"
                />
              </FilterField>
              <FilterField label="Fin">
                <Input
                  id="end-date"
                  type="date"
                  value={endDateFilter || ""}
                  onChange={(e) => onEndDateChange(e.target.value || undefined)}
                  className="text-xs h-8"
                />
              </FilterField>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </FilterSection>
        }
      />
    </div>
  );
}
