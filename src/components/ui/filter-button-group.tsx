"use client"

import { useState } from "react"
import { Search, Filter, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  const handleClear = () => {
    onSearchChange("")
    onFilterChange("")
    if (onSecondFilterChange && selectedSecondFilter) {
      onSecondFilterChange("all")
    }
    if (onDateChange) {
      onDateChange("", "")
    }
    setIsFilterOpen(false)
  }

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <ButtonGroup className="w-auto border border-input rounded-md">
        {/* Champ de recherche */}
        <div className="relative w-auto max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 w-full border-0"
          />
        </div>

        {/* Bouton de filtre avec popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 ml-2 border-0">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filter-select">{firstFilterLabel}</Label>
                <Select value={selectedFilter} onValueChange={onFilterChange}>
                  <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="second-filter-select">Action</Label>
                  <Select value={selectedSecondFilter || "all"} onValueChange={onSecondFilterChange}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Période</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="start-date" className="text-xs">
                        Date de début
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate || ""}
                          onChange={(e) => onDateChange(e.target.value, endDate || "")}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date" className="text-xs">
                        Date de fin
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate || ""}
                          onChange={(e) => onDateChange(startDate || "", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  Effacer
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </ButtonGroup>
    </div>
  )
}
