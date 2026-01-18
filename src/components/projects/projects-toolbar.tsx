"use client";

import { Button } from "@/components/ui/button";
import { Grid3x3, List } from "lucide-react";
import { FilterButtonGroup } from "@/components/ui/filter-button-group";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectsToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    dateRange: { from?: Date; to?: Date } | undefined;
    onDateRangeChange: (range: { from?: Date; to?: Date } | undefined) => void;
    statusOptions: { id: string; label: string; count?: number }[];
    viewMode: "list" | "grid";
    onViewModeChange: (mode: "list" | "grid") => void;
}

export function ProjectsToolbar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    statusOptions,
    viewMode,
    onViewModeChange,
}: ProjectsToolbarProps) {
    return (
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            {/* Filtres de statut (Tabs minimalistes) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {statusOptions.map((option) => (
                    <Button
                        key={option.id}
                        variant={statusFilter === option.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onStatusChange(option.id)}
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
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("grid")}
                    className="h-7 px-2"
                    title="Vue Grille"
                >
                    <Grid3x3 className="h-4 w-4" />
                </Button>
            </div>

            {/* Barre de recherche et Date via FilterButtonGroup */}
            <FilterButtonGroup
                searchValue={searchQuery}
                onSearchChange={onSearchChange}
                placeholder="Rechercher un projet..."
                startDate={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                endDate={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined}
                onDateChange={(start, end) => {
                    onDateRangeChange({
                        from: start ? new Date(start) : undefined,
                        to: end ? new Date(end) : undefined
                    });
                }}
            />
        </div>
    );
}
