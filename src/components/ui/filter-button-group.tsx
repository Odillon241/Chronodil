"use client"

import { useState } from "react"
import { Filter, Calendar, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface FilterOption {
  id: string
  label: string
  value: string
}

interface FilterButtonGroupProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filterOptions: FilterOption[]
  selectedFilter: string
  onFilterChange: (value: string) => void
  startDate?: string
  endDate?: string
  onDateChange?: (startDate: string, endDate: string) => void
  placeholder?: string
  className?: string
  // Support pour un deuxième filtre (optionnel)
  secondFilterOptions?: FilterOption[]
  selectedSecondFilter?: string
  onSecondFilterChange?: (value: string) => void
  firstFilterLabel?: string
  secondFilterLabel?: string
}

export function FilterButtonGroup({
  searchValue,
  onSearchChange,
  filterOptions,
  selectedFilter,
  onFilterChange,
  startDate,
  endDate,
  onDateChange,
  placeholder = "Rechercher...",
  className,
  secondFilterOptions,
  selectedSecondFilter,
  onSecondFilterChange,
  firstFilterLabel = "Filtrer par",
  secondFilterLabel = "Action",
}: FilterButtonGroupProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Calculer le nombre de filtres actifs
  const activeFiltersCount = [
    selectedFilter && selectedFilter !== "all" && selectedFilter !== "",
    selectedSecondFilter && selectedSecondFilter !== "all" && selectedSecondFilter !== "",
    startDate,
    endDate,
  ].filter(Boolean).length

  const handleClear = () => {
    onSearchChange("")
    onFilterChange("all")
    if (onSecondFilterChange) {
      onSecondFilterChange("all")
    }
    if (onDateChange) {
      onDateChange("", "")
    }
    setIsFilterOpen(false)
  }

  const hasActiveFilters = activeFiltersCount > 0 || searchValue.length > 0

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-2", className)}>
      {/* Barre de recherche avec icône */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 h-9 bg-background"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Bouton de filtre avec popover */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-medium">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtres</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleClear}>
                  Tout effacer
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="filter-select" className="text-xs font-medium text-muted-foreground">{firstFilterLabel}</Label>
                <Select value={selectedFilter} onValueChange={onFilterChange}>
                  <SelectTrigger className="h-9 focus:ring-muted focus:border-muted-foreground/30">
                    <SelectValue placeholder="Sélectionner un filtre" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.id} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deuxième filtre si fourni */}
              {secondFilterOptions && onSecondFilterChange && (
                <div className="space-y-1.5">
                  <Label htmlFor="second-filter-select" className="text-xs font-medium text-muted-foreground">{secondFilterLabel}</Label>
                  <Select value={selectedSecondFilter || "all"} onValueChange={onSecondFilterChange}>
                    <SelectTrigger className="h-9 focus:ring-muted focus:border-muted-foreground/30">
                      <SelectValue placeholder="Toutes les actions" />
                    </SelectTrigger>
                    <SelectContent>
                      {secondFilterOptions.map((option) => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtres de date si fournis */}
              {onDateChange && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Période</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                        Début
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate || ""}
                          onChange={(e) => onDateChange(e.target.value, endDate || "")}
                          className="pl-8 h-9 text-xs focus-visible:ring-muted focus-visible:border-muted-foreground/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                        Fin
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate || ""}
                          onChange={(e) => onDateChange(startDate || "", e.target.value)}
                          className="pl-8 h-9 text-xs focus-visible:ring-muted focus-visible:border-muted-foreground/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-4 font-normal"
                onClick={() => setIsFilterOpen(false)}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
