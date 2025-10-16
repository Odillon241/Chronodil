"use client";

import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaskFilters } from "@/hooks/use-task-filters";

interface TaskFiltersBarProps {
  filters: TaskFilters;
  onFilterChange: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  projects?: Array<{ id: string; name: string; color: string }>;
}

export function TaskFiltersBar({
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  projects = [],
}: TaskFiltersBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtres principaux */}
        <div className="flex flex-wrap gap-2">
          <Select value={filters.status} onValueChange={(value) => onFilterChange("status", value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="TODO">À faire</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="IN_REVIEW">En revue</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(value) => onFilterChange("priority", value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="LOW">Basse</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>

          {projects.length > 0 && (
            <Select value={filters.projectId} onValueChange={(value) => onFilterChange("projectId", value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="truncate">{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Filtres secondaires */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="assigned-to-me"
            checked={filters.assignedToMe}
            onCheckedChange={(checked) => onFilterChange("assignedToMe", checked as boolean)}
          />
          <Label htmlFor="assigned-to-me" className="text-sm font-normal cursor-pointer">
            Assignées à moi
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="created-by-me"
            checked={filters.createdByMe}
            onCheckedChange={(checked) => onFilterChange("createdByMe", checked as boolean)}
          />
          <Label htmlFor="created-by-me" className="text-sm font-normal cursor-pointer">
            Créées par moi
          </Label>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Réinitialiser les filtres
          </Button>
        )}
      </div>

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtres actifs :</span>
          <div className="flex flex-wrap gap-1">
            {filters.status !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Statut: {filters.status}
              </Badge>
            )}
            {filters.priority !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Priorité: {filters.priority}
              </Badge>
            )}
            {filters.projectId !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Projet filtré
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                "{filters.search}"
              </Badge>
            )}
            {filters.assignedToMe && (
              <Badge variant="secondary" className="text-xs">
                Mes tâches
              </Badge>
            )}
            {filters.createdByMe && (
              <Badge variant="secondary" className="text-xs">
                Mes créations
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
