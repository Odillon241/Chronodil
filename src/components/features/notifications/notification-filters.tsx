"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/features/search-bar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface NotificationFiltersProps {
  resultCount: number;
}

export function NotificationFilters({ resultCount }: NotificationFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "all");
  const [filterType, setFilterType] = useState(searchParams.get("type") || "all");

  const hasActiveFilters = filterStatus !== "all" || filterType !== "all";
  const activeFiltersCount = (filterStatus !== "all" ? 1 : 0) + (filterType !== "all" ? 1 : 0);

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
      updateSearchParams({ search: value, status: filterStatus, type: filterType });
    },
    [filterStatus, filterType, updateSearchParams]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setFilterStatus(value);
      updateSearchParams({ search: searchQuery, status: value, type: filterType });
    },
    [searchQuery, filterType, updateSearchParams]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setFilterType(value);
      updateSearchParams({ search: searchQuery, status: filterStatus, type: value });
    },
    [searchQuery, filterStatus, updateSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setFilterStatus("all");
    setFilterType("all");
    setIsFilterOpen(false);
    updateSearchParams({ search: searchQuery, status: "all", type: "all" });
  }, [searchQuery, updateSearchParams]);

  return (
    <div className="flex items-center gap-4">
      <SearchBar
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Rechercher dans les notifications..."
        className="w-full sm:w-auto flex-1"
      />

      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 relative">
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Filtres</Label>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={handleClearFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Effacer
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">Statut</Label>
              <Select value={filterStatus} onValueChange={handleStatusChange}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filterType} onValueChange={handleTypeChange}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {searchQuery && (
        <p className="text-sm text-muted-foreground hidden sm:block">
          {resultCount} résultat{resultCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
