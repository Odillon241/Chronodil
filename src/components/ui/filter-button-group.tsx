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
}: FilterButtonGroupProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <ButtonGroup className="flex-1">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Bouton de filtre avec popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filter-select">Filtrer par</Label>
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
                  onClick={() => {
                    onSearchChange("")
                    onFilterChange("")
                    if (onDateChange) {
                      onDateChange("", "")
                    }
                    setIsFilterOpen(false)
                  }}
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
