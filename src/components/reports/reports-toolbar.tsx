'use client'

import { List, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterButtonGroup } from '@/components/ui/filter-button-group'
import { cn } from '@/lib/utils'

export type ReportViewMode = 'list' | 'calendar'

interface StatusOption {
  id: string
  label: string
  value: string
  count?: number
}

interface ReportsToolbarProps {
  // Recherche
  searchQuery: string
  onSearchChange: (value: string) => void

  // Filtres de type
  typeFilter: string
  onTypeChange: (value: string) => void
  typeOptions: StatusOption[]

  // Filtres supplémentaires
  formatFilter: string
  onFormatChange: (value: string) => void

  // Vue
  viewMode: ReportViewMode
  onViewModeChange: (value: ReportViewMode) => void
}

export function ReportsToolbar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  typeOptions,
  formatFilter,
  onFormatChange,
  viewMode,
  onViewModeChange,
}: ReportsToolbarProps) {
  const formatOptions = [
    { id: 'all', label: 'Tous les formats', value: 'all' },
    { id: 'pdf', label: 'PDF', value: 'pdf' },
    { id: 'word', label: 'Word', value: 'word' },
    { id: 'excel', label: 'Excel', value: 'excel' },
  ]

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      {/* Tabs de type (Style minimaliste) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {typeOptions.map((option) => (
          <Button
            key={option.id}
            variant={typeFilter === option.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTypeChange(option.value)}
            className={cn(
              'rounded-full h-8 px-3 text-xs font-medium transition-all',
              typeFilter === option.id
                ? ''
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'ml-2 py-0.5 px-1.5 rounded-full text-[10px]',
                  typeFilter === option.id ? 'bg-primary-foreground/20' : 'bg-muted-foreground/10',
                )}
              >
                {option.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* View Switcher */}
      <div className="flex items-center border rounded-lg p-1 bg-muted/20 gap-1">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="h-7 px-2"
          title="Vue Liste"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('calendar')}
          className="h-7 px-2"
          title="Vue Calendrier"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </div>

      {/* Recherche et Filtres */}
      <FilterButtonGroup
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="Rechercher..."
        firstFilterLabel="Format"
        filterOptions={formatOptions}
        selectedFilter={formatFilter}
        onFilterChange={onFormatChange}
      />
    </div>
  )
}
