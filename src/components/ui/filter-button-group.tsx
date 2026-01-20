'use client'

import { useState } from 'react'
import { Filter, Calendar, Search, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  label: string
  value: string
}

interface FilterButtonGroupProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filterOptions?: FilterOption[]
  selectedFilter?: string
  onFilterChange?: (value: string) => void
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
  extraFilters?: {
    label: string
    options: FilterOption[]
    selected: string
    onChange: (value: string) => void
  }[]
}

export function FilterButtonGroup({
  searchValue,
  onSearchChange,
  filterOptions = [],
  selectedFilter,
  onFilterChange,
  startDate,
  endDate,
  onDateChange,
  placeholder = 'Rechercher...',
  className,
  secondFilterOptions = [],
  selectedSecondFilter,
  onSecondFilterChange,
  firstFilterLabel = 'Filtrer par',
  secondFilterLabel = 'Action',
  extraFilters = [],
}: FilterButtonGroupProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)

  // Calculer le nombre de filtres actifs (hors dates et recherche)
  const extraFiltersCount = extraFilters.filter(
    (f) => f.selected && f.selected !== 'all' && f.selected !== '',
  ).length
  const activeFiltersCount =
    [
      selectedFilter && selectedFilter !== 'all' && selectedFilter !== '',
      selectedSecondFilter && selectedSecondFilter !== 'all' && selectedSecondFilter !== '',
    ].filter(Boolean).length + extraFiltersCount

  const handleClear = () => {
    if (onFilterChange) onFilterChange('all')
    if (onSecondFilterChange) {
      onSecondFilterChange('all')
    }
    extraFilters.forEach((f) => f.onChange('all'))
    setIsFilterOpen(false)
  }

  const _hasActiveFilters = activeFiltersCount > 0
  const hasFilterOptions =
    filterOptions.length > 0 || secondFilterOptions.length > 0 || extraFilters.length > 0

  return (
    <div className={cn('flex flex-col sm:flex-row items-stretch sm:items-center gap-2', className)}>
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
            onClick={() => onSearchChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Date Picker Button (si onDateChange est fourni) */}
      {onDateChange && (
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-2 shrink-0 justify-start font-normal',
                !startDate && !endDate && 'text-muted-foreground',
              )}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">
                {startDate || endDate ? (
                  <>
                    {startDate ? new Date(startDate).toLocaleDateString() : 'Début'} -{' '}
                    {endDate ? new Date(endDate).toLocaleDateString() : 'Fin'}
                  </>
                ) : (
                  'Pick a date'
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Période</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date" className="text-xs">
                    Date de début
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => onDateChange(e.target.value, endDate || '')}
                    className="h-8"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date" className="text-xs">
                    Date de fin
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => onDateChange(startDate || '', e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => {
                    onDateChange('', '')
                    setIsDateOpen(false)
                  }}
                >
                  Effacer les dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Bouton de filtre avec popover (seulement si des options sont fournies) */}
      {hasFilterOptions && (
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0 border-dashed">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtres</span>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-xs font-medium rounded-sm"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold text-sm">Filtres</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                >
                  Effacer
                  <X className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="p-2 max-h-[300px] overflow-y-auto">
              {/* Filtre 1 (Primary) */}
              {filterOptions.length > 0 && (
                <div className="space-y-1">
                  <h5 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {firstFilterLabel}
                  </h5>
                  {filterOptions.map((option) => (
                    <div
                      key={option.id}
                      className={cn(
                        'flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors',
                        selectedFilter === option.value
                          ? 'bg-accent/50 text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground',
                      )}
                      onClick={() => onFilterChange?.(option.value)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          selectedFilter === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-30',
                        )}
                      >
                        {selectedFilter === option.value && <Check className="h-3 w-3" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Filtre 2 (Secondary) */}
              {secondFilterOptions.length > 0 && onSecondFilterChange && (
                <>
                  {filterOptions.length > 0 && <Separator className="my-2" />}
                  <div className="space-y-1">
                    <h5 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {secondFilterLabel}
                    </h5>
                    {secondFilterOptions.map((option) => (
                      <div
                        key={option.id}
                        className={cn(
                          'flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors',
                          selectedSecondFilter === option.value
                            ? 'bg-accent/50 text-accent-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground',
                        )}
                        onClick={() => onSecondFilterChange(option.value)}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            selectedSecondFilter === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-30',
                          )}
                        >
                          {selectedSecondFilter === option.value && <Check className="h-3 w-3" />}
                        </div>
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Extra Filters */}
              {extraFilters.map((filter, idx) => (
                <div key={idx}>
                  {(filterOptions.length > 0 || secondFilterOptions.length > 0 || idx > 0) && (
                    <Separator className="my-2" />
                  )}
                  <div className="space-y-1">
                    <h5 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {filter.label}
                    </h5>
                    {filter.options.map((option) => (
                      <div
                        key={option.id}
                        className={cn(
                          'flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors',
                          filter.selected === option.value
                            ? 'bg-accent/50 text-accent-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground',
                        )}
                        onClick={() => filter.onChange(option.value)}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            filter.selected === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-30',
                          )}
                        >
                          {filter.selected === option.value && <Check className="h-3 w-3" />}
                        </div>
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
