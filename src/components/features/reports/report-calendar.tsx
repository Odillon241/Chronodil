'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Report } from '@/types/report.types'

interface ReportCalendarProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

const getTypeColor = (type: string | null) => {
  const colors: Record<string, string> = {
    WEEKLY: 'bg-green-500',
    MONTHLY: 'bg-purple-500',
    INDIVIDUAL: 'bg-orange-500',
  }
  return colors[type || ''] || 'bg-blue-500'
}

export function ReportCalendar({ reports, onReportClick }: ReportCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Jours de la semaine (commence par lundi)
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Calculer le décalage pour commencer la grille au bon jour
  const startDay = getDay(monthStart)
  const offset = startDay === 0 ? 6 : startDay - 1 // Lundi = 0

  // Grouper les rapports par date
  const reportsByDate = useMemo(() => {
    const map = new Map<string, Report[]>()
    reports.forEach((report) => {
      const dateKey = format(new Date(report.createdAt), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, report])
    })
    return map
  }, [reports])

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
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
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {/* Cellules vides pour le décalage */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-24" />
            ))}

            {/* Jours du mois */}
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayReports = reportsByDate.get(dateKey) || []
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'h-24 border rounded-md p-1 overflow-hidden',
                    isToday && 'border-primary bg-primary/5',
                    !isSameMonth(day, currentMonth) && 'opacity-50',
                  )}
                >
                  <div className={cn('text-sm font-medium mb-1', isToday && 'text-primary')}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16">
                    {dayReports.slice(0, 3).map((report) => (
                      <Tooltip key={report.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onReportClick(report)}
                            className={cn(
                              'w-full text-left text-xs px-1 py-0.5 rounded truncate text-white',
                              getTypeColor(report.reportType),
                            )}
                          >
                            {report.title}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">{report.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.period || 'Pas de période'}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {report.format.toUpperCase()}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayReports.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayReports.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TooltipProvider>

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Légende :</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-xs">Hebdomadaire</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-xs">Mensuel</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-xs">Individuel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
