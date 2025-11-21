"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Filter, Edit2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Activity {
  id: string;
  activityType: string;
  activityName: string;
  description?: string;
  periodicity: string;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  status: string;
  ActivityCatalog?: {
    id?: string;
    name: string;
    category: string;
  } | null;
}

interface HRTimesheetActivitiesTableProps {
  activities: Activity[];
  onDelete?: (id: string) => void;
  onEdit?: (activity: Activity) => void;
  showActions?: boolean;
}

const getPeriodicityLabel = (periodicity: string) => {
  const labels: Record<string, string> = {
    DAILY: "Quotidien",
    WEEKLY: "Hebdomadaire",
    MONTHLY: "Mensuel",
    PUNCTUAL: "Ponctuel",
    WEEKLY_MONTHLY: "Hebdo/Mensuel",
  };
  return labels[periodicity] || periodicity;
};

const getActivityTypeBadge = (type: string) => {
  return (
    <Badge variant={type === "OPERATIONAL" ? "default" : "secondary"}>
      {type === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
    </Badge>
  );
};

export function HRTimesheetActivitiesTable({
  activities,
  onDelete,
  onEdit,
  showActions = false,
}: HRTimesheetActivitiesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPeriodicity, setFilterPeriodicity] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtrage des activités
  let filteredDisplayActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Recherche par nom ou description
      const matchesSearch =
        searchQuery === "" ||
        activity.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.description &&
          activity.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtre par catégorie
      const category = activity.ActivityCatalog?.category || "Autres";
      const matchesCategory =
        filterCategory === "all" || category === filterCategory;

      // Filtre par type
      const matchesType =
        filterType === "all" || activity.activityType === filterType;

      // Filtre par statut
      const matchesStatus =
        filterStatus === "all" || activity.status === filterStatus;

      // Filtre par périodicité
      const matchesPeriodicity =
        filterPeriodicity === "all" || activity.periodicity === filterPeriodicity;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesStatus &&
        matchesPeriodicity
      );
    });
  }, [activities, searchQuery, filterCategory, filterType, filterStatus, filterPeriodicity]);

  // Tri des activités
  if (sortField) {
    filteredDisplayActivities = [...filteredDisplayActivities].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "category":
          aValue = (a.ActivityCatalog?.category || "Autres").toLowerCase();
          bValue = (b.ActivityCatalog?.category || "Autres").toLowerCase();
          break;
        case "activityName":
          aValue = a.activityName.toLowerCase();
          bValue = b.activityName.toLowerCase();
          break;
        case "type":
          aValue = a.activityType;
          bValue = b.activityType;
          break;
        case "periodicity":
          aValue = a.periodicity;
          bValue = b.periodicity;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "totalHours":
          aValue = a.totalHours;
          bValue = b.totalHours;
          break;
        case "startDate":
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Récupérer les catégories uniques pour le filtre
  const uniqueCategories = useMemo(() => {
    return Array.from(
      new Set(
        activities.map((a) => a.ActivityCatalog?.category || "Autres")
      )
    ).sort();
  }, [activities]);

  const hasActiveFilters =
    searchQuery ||
    filterCategory !== "all" ||
    filterType !== "all" ||
    filterStatus !== "all" ||
    filterPeriodicity !== "all";

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <p className="text-muted-foreground">Aucune activité enregistrée</p>
      </div>
    );
  }

  return (
    <>
      {/* Barre de recherche et filtres */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Input
              placeholder="Rechercher une activité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Bouton de filtre */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="OPERATIONAL">Opérationnel</SelectItem>
                      <SelectItem value="REPORTING">Reporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Périodicité</Label>
                  <Select value={filterPeriodicity} onValueChange={setFilterPeriodicity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les périodicités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les périodicités</SelectItem>
                      <SelectItem value="DAILY">Quotidien</SelectItem>
                      <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                      <SelectItem value="MONTHLY">Mensuel</SelectItem>
                      <SelectItem value="PUNCTUAL">Ponctuel</SelectItem>
                      <SelectItem value="WEEKLY_MONTHLY">Hebdo/Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterCategory("all");
                        setFilterType("all");
                        setFilterStatus("all");
                        setFilterPeriodicity("all");
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">
              {filteredDisplayActivities.length} résultat{filteredDisplayActivities.length > 1 ? "s" : ""} sur {activities.length}
            </span>
          </div>
        )}
      </div>

      {/* Tableau */}
      {filteredDisplayActivities.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">Aucune activité ne correspond aux filtres</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent -ml-3">
                        Catégorie
                        {sortField === "category" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-2 h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort("category")}>
                        Trier par catégorie
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent -ml-3">
                        Nom de l'activité
                        {sortField === "activityName" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-2 h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort("activityName")}>
                        Trier par nom
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent -ml-3">
                        Type
                        {sortField === "type" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-2 h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort("type")}>
                        Trier par type
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="min-w-[120px] hidden md:table-cell">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent -ml-3">
                        Périodicité
                        {sortField === "periodicity" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-2 h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort("periodicity")}>
                        Trier par périodicité
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="min-w-[100px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent -ml-3">
                        Statut
                        {sortField === "status" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-2 h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort("status")}>
                        Trier par statut
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="min-w-[140px] hidden md:table-cell">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent -ml-3">
                        Période
                        {sortField === "startDate" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-2 h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort("startDate")}>
                        Trier par date
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="min-w-[100px] text-center">
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent">
                          Heures
                          {sortField === "totalHours" ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="ml-2 h-3 w-3" />
                            ) : (
                              <ArrowDown className="ml-2 h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem onClick={() => handleSort("totalHours")}>
                          Trier par heures
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                {showActions && (
                  <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisplayActivities.map((activity) => (
                <ContextMenu key={activity.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow>
                      <TableCell className="font-medium">
                        {activity.ActivityCatalog?.category || "Autres"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{activity.activityName}</p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {activity.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground md:hidden">
                            {format(new Date(activity.startDate), "dd/MM/yyyy", { locale: fr })}
                            {" → "}
                            {format(new Date(activity.endDate), "dd/MM/yyyy", { locale: fr })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActivityTypeBadge(activity.activityType)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {getPeriodicityLabel(activity.periodicity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.status === "COMPLETED" ? "default" : "secondary"}>
                          {activity.status === "COMPLETED" ? "Terminé" : "En cours"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                        {format(new Date(activity.startDate), "dd/MM/yyyy", { locale: fr })}
                        {" → "}
                        {format(new Date(activity.endDate), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">
                          {activity.totalHours.toFixed(1)}h
                        </span>
                      </TableCell>
                      {showActions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(activity)}
                                className="text-primary hover:text-primary"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(activity.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  </ContextMenuTrigger>
                  {showActions && (
                    <ContextMenuContent>
                      {onEdit && (
                        <ContextMenuItem onClick={() => onEdit(activity)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Éditer l'activité
                        </ContextMenuItem>
                      )}
                      {onDelete && (
                        <>
                          {onEdit && <ContextMenuSeparator />}
                          <ContextMenuItem
                            onClick={() => onDelete(activity.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer l'activité
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  )}
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

