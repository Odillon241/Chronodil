'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Search,
  X,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  FileText,
  FileType,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

import type { ReportFormat, ReportType, ReportTemplate, ReportUser } from '@/types/report.types'

// Types
export interface ReportFilters {
  search: string
  types: ReportType[]
  formats: ReportFormat[]
  startDate?: Date
  endDate?: Date
  templateId?: string
  createdById?: string
}

interface ReportFiltersPanelProps {
  filters: ReportFilters
  onChange: (filters: ReportFilters) => void
  templates?: ReportTemplate[]
  users?: ReportUser[]
  isAdmin?: boolean
  className?: string
}

// Constants
const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'INDIVIDUAL', label: 'Individuel' },
]

const REPORT_FORMATS: { value: ReportFormat; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'word', label: 'Word' },
  { value: 'excel', label: 'Excel' },
]

// Component
export function ReportFiltersPanel({
  filters,
  onChange,
  templates = [],
  className,
}: ReportFiltersPanelProps) {
  // Calculate active filters count (excluding search)
  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (filters.types.length > 0) count++
    if (filters.formats.length > 0) count++
    if (filters.startDate || filters.endDate) count++
    if (filters.templateId) count++
    return count
  }, [filters])

  // Handlers
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value })
  }

  const handleTypeToggle = (type: ReportType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type]
    onChange({ ...filters, types: newTypes })
  }

  const handleFormatToggle = (format: ReportFormat) => {
    const newFormats = filters.formats.includes(format)
      ? filters.formats.filter((f) => f !== format)
      : [...filters.formats, format]
    onChange({ ...filters, formats: newFormats })
  }

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    onChange({ ...filters, startDate: start, endDate: end })
  }

  const handleClearAll = () => {
    onChange({
      search: '',
      types: [],
      formats: [],
      startDate: undefined,
      endDate: undefined,
      templateId: undefined,
      createdById: undefined,
    })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearchChange('')}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-9 gap-2', filters.types.length > 0 && 'border-primary')}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Type</span>
            {filters.types.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {filters.types.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <div className="space-y-2">
            {REPORT_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.types.includes(type.value)}
                  onCheckedChange={() => handleTypeToggle(type.value)}
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
          {filters.types.length > 0 && (
            <>
              <Separator className="my-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...filters, types: [] })}
                className="w-full h-8 text-xs"
              >
                Effacer
              </Button>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Format Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-9 gap-2', filters.formats.length > 0 && 'border-primary')}
          >
            <FileType className="h-4 w-4" />
            <span className="hidden sm:inline">Format</span>
            {filters.formats.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {filters.formats.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-3" align="start">
          <div className="space-y-2">
            {REPORT_FORMATS.map((format) => (
              <label key={format.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.formats.includes(format.value)}
                  onCheckedChange={() => handleFormatToggle(format.value)}
                />
                <span className="text-sm">{format.label}</span>
              </label>
            ))}
          </div>
          {filters.formats.length > 0 && (
            <>
              <Separator className="my-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...filters, formats: [] })}
                className="w-full h-8 text-xs"
              >
                Effacer
              </Button>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-9 gap-2', (filters.startDate || filters.endDate) && 'border-primary')}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {filters.startDate || filters.endDate
                ? filters.startDate && filters.endDate
                  ? `${format(filters.startDate, 'dd/MM')} - ${format(filters.endDate, 'dd/MM')}`
                  : filters.startDate
                    ? `Depuis ${format(filters.startDate, 'dd/MM')}`
                    : `Jusqu'au ${format(filters.endDate!, 'dd/MM')}`
                : 'Période'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: filters.startDate,
              to: filters.endDate,
            }}
            onSelect={(range) => handleDateRangeChange(range?.from, range?.to)}
            numberOfMonths={1}
            locale={fr}
          />
          {(filters.startDate || filters.endDate) && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateRangeChange(undefined, undefined)}
                className="w-full h-8 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Effacer
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Template Filter (if templates exist) */}
      {templates.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn('h-9 gap-2', filters.templateId && 'border-primary')}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">
                {filters.templateId
                  ? templates.find((t) => t.id === filters.templateId)?.name || 'Modèle'
                  : 'Modèle'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-1">
              <label
                className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted"
                onClick={() => onChange({ ...filters, templateId: undefined })}
              >
                <span className={cn('text-sm', !filters.templateId && 'font-medium')}>
                  Tous les modèles
                </span>
              </label>
              {templates.map((template) => (
                <label
                  key={template.id}
                  className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted"
                  onClick={() => onChange({ ...filters, templateId: template.id })}
                >
                  <span
                    className={cn('text-sm', filters.templateId === template.id && 'font-medium')}
                  >
                    {template.name}
                  </span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Effacer</span>
        </Button>
      )}
    </div>
  )
}
