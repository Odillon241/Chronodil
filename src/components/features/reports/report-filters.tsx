'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Search, X, CalendarIcon, List, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ReportFilters as ReportFiltersType, ReportViewMode } from '@/types/report.types'

interface ReportFiltersProps {
  filters: ReportFiltersType
  onFiltersChange: (filters: ReportFiltersType) => void
  viewMode: ReportViewMode
  onViewModeChange: (mode: ReportViewMode) => void
}

export function ReportFilters({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: filters.startDate,
    to: filters.endDate,
  })

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value as ReportFiltersType['type'],
    })
  }

  const handleFormatChange = (value: string) => {
    onFiltersChange({
      ...filters,
      format: value as ReportFiltersType['format'],
    })
  }

  const handlePeriodChange = (value: string) => {
    const newFilters = {
      ...filters,
      period: value as ReportFiltersType['period'],
    }

    if (value !== 'custom') {
      newFilters.startDate = undefined
      newFilters.endDate = undefined
      setDateRange({ from: undefined, to: undefined })
    }

    onFiltersChange(newFilters)
  }

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange({ from: range.from, to: range.to })
    if (range.from && range.to) {
      onFiltersChange({
        ...filters,
        period: 'custom',
        startDate: range.from,
        endDate: range.to,
      })
    }
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      format: 'all',
      period: 'all',
      startDate: undefined,
      endDate: undefined,
    })
    setDateRange({ from: undefined, to: undefined })
  }

  const hasActiveFilters =
    filters.search || filters.type !== 'all' || filters.format !== 'all' || filters.period !== 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un rapport..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Vue mode toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('calendar')}
            className="h-8"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Type de rapport */}
        <Select value={filters.type ?? 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
            <SelectItem value="MONTHLY">Mensuel</SelectItem>
            <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
          </SelectContent>
        </Select>

        {/* Format */}
        <Select value={filters.format} onValueChange={handleFormatChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous formats</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="word">Word</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
          </SelectContent>
        </Select>

        {/* Période */}
        <Select value={filters.period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes périodes</SelectItem>
            <SelectItem value="thisMonth">Ce mois</SelectItem>
            <SelectItem value="thisYear">Cette année</SelectItem>
            <SelectItem value="custom">Personnalisée</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range picker (si période custom) */}
        {filters.period === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yy', { locale: fr })} -{' '}
                      {format(dateRange.to, 'dd/MM/yy', { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', { locale: fr })
                  )
                ) : (
                  'Sélectionner dates'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => handleDateRangeChange({ from: range?.from, to: range?.to })}
                locale={fr}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer filtres
          </Button>
        )}
      </div>
    </div>
  )
}

export function ReportFiltersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
        <div className="w-20 h-10 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="w-[160px] h-10 bg-muted animate-pulse rounded-md" />
        <div className="w-[140px] h-10 bg-muted animate-pulse rounded-md" />
        <div className="w-[150px] h-10 bg-muted animate-pulse rounded-md" />
      </div>
    </div>
  )
}
