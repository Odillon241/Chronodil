"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, List, CalendarDays, ChartGantt } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SearchWithFilters } from "@/components/ui/search-with-filters";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HRTimesheetToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    dateRange: { from?: Date; to?: Date } | undefined;
    onDateRangeChange: (range: { from?: Date; to?: Date } | undefined) => void;
    statusOptions: { id: string; label: string; count?: number }[];
    viewMode: "list" | "calendar" | "gantt";
    onViewModeChange: (mode: "list" | "calendar" | "gantt") => void;
}

export function HRTimesheetToolbar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    statusOptions,
    viewMode,
    onViewModeChange,
}: HRTimesheetToolbarProps) {
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

            {/* Barre de recherche et Date */}
            <SearchWithFilters
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Rechercher..."
                variant="simple"
                trailingContent={
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                size="sm"
                                className={cn(
                                    "h-9 justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y", { locale: fr })} -{" "}
                                            {format(dateRange.to, "LLL dd, y", { locale: fr })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y", { locale: fr })
                                    )
                                ) : (
                                    <span>Dates</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange as any}
                                onSelect={(range: any) => onDateRangeChange(range)}
                                numberOfMonths={2}
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                }
            />
        </div>
    );
}
