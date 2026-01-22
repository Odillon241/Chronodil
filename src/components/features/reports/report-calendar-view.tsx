'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  setMonth,
  setYear,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileSpreadsheet,
  FileType,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Report } from '@/types/report.types'

interface ReportCalendarViewProps {
  reports: Report[]
  onReportClick: (report: Report) => void
  onReportEdit?: (report: Report) => void
  onReportDelete?: (report: Report) => void
  className?: string
}

// Helper: Get type color
const getTypeColor = (type: string | null) => {
  const colors: Record<string, string> = {
    WEEKLY: 'bg-green-500 hover:bg-green-600',
    MONTHLY: 'bg-purple-500 hover:bg-purple-600',
    INDIVIDUAL: 'bg-orange-500 hover:bg-orange-600',
  }
  return colors[type || ''] || 'bg-blue-500 hover:bg-blue-600'
}

// Helper: Get type badge variant
const getTypeBadgeVariant = (type: string | null) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    WEEKLY: 'default',
    MONTHLY: 'secondary',
    INDIVIDUAL: 'outline',
  }
  return variants[type || ''] || 'default'
}

// Helper: Get format icon
const getFormatIcon = (format: string) => {
  const icons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-3 w-3" />,
    word: <FileType className="h-3 w-3" />,
    excel: <FileSpreadsheet className="h-3 w-3" />,
  }
  return icons[format] || <FileText className="h-3 w-3" />
}

// Helper: Get format label
const getFormatLabel = (format: string) => {
  const labels: Record<string, string> = {
    pdf: 'PDF',
    word: 'Word',
    excel: 'Excel',
  }
  return labels[format] || format.toUpperCase()
}

// Desktop Calendar View Component
function DesktopCalendarView({
  reports,
  currentMonth,
  onMonthChange,
  onReportClick,
  onReportEdit,
  onReportDelete,
}: {
  reports: Report[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onReportClick: (report: Report) => void
  onReportEdit?: (report: Report) => void
  onReportDelete?: (report: Report) => void
}) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Group reports by date
  const reportsByDate = useMemo(() => {
    const map = new Map<string, Report[]>()
    reports.forEach((report) => {
      const dateKey = format(new Date(report.createdAt), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, report])
    })
    return map
  }, [reports])

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear())

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(currentMonth, parseInt(month))
    setSelectedMonth(parseInt(month))
    onMonthChange(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = setYear(currentMonth, parseInt(year))
    setSelectedYear(parseInt(year))
    onMonthChange(newDate)
  }

  const prevMonth = () => onMonthChange(subMonths(currentMonth, 1))
  const nextMonth = () => onMonthChange(addMonths(currentMonth, 1))
  const goToToday = () => onMonthChange(new Date())

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
  const months = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ]

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayReports = reportsByDate.get(dateKey) || []
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <Popover key={dateKey}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'min-h-[120px] border rounded-lg p-2 transition-all hover:border-primary/50 hover:shadow-sm',
                    isToday && 'border-primary bg-primary/5',
                    !isCurrentMonth && 'opacity-40 bg-muted/30',
                    dayReports.length > 0 && 'cursor-pointer',
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={cn(
                        'text-sm font-medium mb-1 text-right',
                        isToday && 'text-primary font-bold',
                      )}
                    >
                      {format(day, 'd')}
                    </div>

                    {dayReports.length > 0 && (
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayReports.slice(0, 2).map((report) => (
                          <div
                            key={report.id}
                            className={cn(
                              'text-xs px-1.5 py-1 rounded text-white truncate flex items-center gap-1',
                              getTypeColor(report.reportType),
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onReportClick(report)
                            }}
                          >
                            {getFormatIcon(report.format)}
                            <span className="truncate">{report.title}</span>
                          </div>
                        ))}

                        {dayReports.length > 2 && (
                          <div className="text-xs text-muted-foreground font-medium text-center">
                            +{dayReports.length - 2} autre{dayReports.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {dayReports.length > 0 && (
                      <Badge variant="secondary" className="mt-auto text-xs w-fit mx-auto">
                        {dayReports.length}
                      </Badge>
                    )}
                  </div>
                </button>
              </PopoverTrigger>

              {dayReports.length > 0 && (
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b bg-muted/50">
                    <h4 className="font-semibold text-sm">
                      {format(day, 'EEEE d MMMM yyyy', { locale: fr })}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {dayReports.length} rapport{dayReports.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {dayReports.map((report, idx) => (
                      <div
                        key={report.id}
                        className={cn(
                          'p-3 hover:bg-muted/50 transition-colors',
                          idx !== dayReports.length - 1 && 'border-b',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={cn(
                                  'h-2 w-2 rounded-full',
                                  getTypeColor(report.reportType).split(' ')[0],
                                )}
                              />
                              <h5 className="font-medium text-sm truncate">{report.title}</h5>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <Badge
                                variant={getTypeBadgeVariant(report.reportType)}
                                className="text-xs"
                              >
                                {report.reportType || 'N/A'}
                              </Badge>

                              <Badge variant="outline" className="text-xs">
                                {getFormatLabel(report.format)}
                              </Badge>

                              {report.period && (
                                <span className="text-xs text-muted-foreground">
                                  {report.period}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground mt-1">
                              Par {report.User.name || report.User.email}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onReportClick(report)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </DropdownMenuItem>

                              {onReportEdit && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onReportEdit(report)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                </>
                              )}

                              {onReportDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => onReportDelete(report)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
        <span className="text-sm font-medium text-muted-foreground">Légende :</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-xs">Hebdomadaire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <span className="text-xs">Mensuel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-xs">Individuel</span>
        </div>
      </div>
    </div>
  )
}

// Mobile List View Component
function MobileListView({
  reports,
  onReportClick,
  onReportEdit,
  onReportDelete,
}: {
  reports: Report[]
  onReportClick: (report: Report) => void
  onReportEdit?: (report: Report) => void
  onReportDelete?: (report: Report) => void
}) {
  // Group reports by date
  const reportsByDate = useMemo(() => {
    const map = new Map<string, Report[]>()
    reports.forEach((report) => {
      const dateKey = format(new Date(report.createdAt), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, report])
    })

    // Convert to array and sort by date (newest first)
    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 20) // Limit to 20 most recent days
  }, [reports])

  if (reportsByDate.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun rapport à afficher</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reportsByDate.map(([dateKey, dayReports]) => {
        const date = new Date(dateKey)
        const isToday = isSameDay(date, new Date())

        return (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
              <h3 className={cn('text-sm font-semibold', isToday && 'text-primary')}>
                {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {dayReports.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {dayReports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onReportClick(report)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              getTypeColor(report.reportType).split(' ')[0],
                            )}
                          />
                          <h4 className="font-medium text-sm truncate">{report.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={getTypeBadgeVariant(report.reportType)}
                            className="text-xs"
                          >
                            {report.reportType || 'N/A'}
                          </Badge>

                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            {getFormatIcon(report.format)}
                            {getFormatLabel(report.format)}
                          </Badge>

                          {report.period && (
                            <span className="text-xs text-muted-foreground">{report.period}</span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onReportClick(report)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>

                          {onReportEdit && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onReportEdit(report)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                            </>
                          )}

                          {onReportDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onReportDelete(report)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Main Component
export function ReportCalendarView({
  reports,
  onReportClick,
  onReportEdit,
  onReportDelete,
  className,
}: ReportCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isMobile ? 'Liste des rapports' : 'Calendrier des rapports'}
          </h2>
        </div>
      </CardHeader>

      <CardContent>
        {isMobile ? (
          <MobileListView
            reports={reports}
            onReportClick={onReportClick}
            onReportEdit={onReportEdit}
            onReportDelete={onReportDelete}
          />
        ) : (
          <DesktopCalendarView
            reports={reports}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onReportClick={onReportClick}
            onReportEdit={onReportEdit}
            onReportDelete={onReportDelete}
          />
        )}
      </CardContent>
    </Card>
  )
}
