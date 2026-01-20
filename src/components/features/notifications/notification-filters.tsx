"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Filter } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationFiltersProps {
  resultCount: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Tous types" },
  { value: "info", label: "Info" },
  { value: "success", label: "Succès" },
  { value: "warning", label: "Alerte" },
  { value: "error", label: "Erreur" },
];

export function NotificationFilters({ resultCount }: NotificationFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "all");
  const [filterType, setFilterType] = useState(searchParams.get("type") || "all");

  const updateSearchParams = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all") {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`);
    },
    [pathname, router, searchParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      // Debounce the search update
      const timeoutId = setTimeout(() => {
        updateSearchParams({ search: value, status: filterStatus, type: filterType });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filterStatus, filterType, updateSearchParams]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      if (!value) return;
      setFilterStatus(value);
      updateSearchParams({ search: searchQuery, status: value, type: filterType });
    },
    [searchQuery, filterType, updateSearchParams]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      if (!value) return;
      setFilterType(value);
      updateSearchParams({ search: searchQuery, status: filterStatus, type: value });
    },
    [searchQuery, filterStatus, updateSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterType("all");
    router.push(pathname);
  }, [pathname, router]);

  const hasActiveFilters = searchQuery || filterStatus !== "all" || filterType !== "all";

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les notifications..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 bg-background"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Statut:</span>
          <ToggleGroup
            type="single"
            value={filterStatus}
            onValueChange={handleStatusChange}
            className="bg-muted/50 p-0.5 rounded-lg"
          >
            {STATUS_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                size="sm"
                className={cn(
                  "text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm",
                  "rounded-md transition-all"
                )}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Type Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Type:</span>
          <ToggleGroup
            type="single"
            value={filterType}
            onValueChange={handleTypeChange}
            className="bg-muted/50 p-0.5 rounded-lg"
          >
            {TYPE_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                size="sm"
                className={cn(
                  "text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm",
                  "rounded-md transition-all"
                )}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            Effacer les filtres
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-xs text-muted-foreground">
          {resultCount} notification{resultCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
