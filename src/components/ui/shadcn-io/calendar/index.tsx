'use client'

import {
  addMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  getISODay,
  isSameDay,
  startOfMonth,
  subMonths,
  isToday,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import { createContext, useContext, useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Événements et jours fériés du Gabon
interface GabonEvent {
  date: string
  name: string
  type: 'holiday' | 'celebration' | 'cultural' | 'religious'
  emoji: string
}

const GABON_EVENTS: GabonEvent[] = [
  // Jours fériés officiels
  { date: '01-01', name: 'Nouvel An', type: 'holiday', emoji: '🎉' },
  { date: '03-12', name: 'Fête de la Rénovation', type: 'holiday', emoji: '🇬🇦' },
  { date: '04-17', name: 'Journée des Femmes Gabonaises', type: 'holiday', emoji: '👩' },
  { date: '05-01', name: 'Fête du Travail', type: 'holiday', emoji: '⚒️' },
  { date: '08-15', name: 'Assomption', type: 'religious', emoji: '✝️' },
  { date: '08-16', name: 'Indépendance du Gabon (Jour 1)', type: 'holiday', emoji: '🇬🇦' },
  { date: '08-17', name: 'Indépendance du Gabon (Jour 2)', type: 'holiday', emoji: '🇬🇦' },
  { date: '11-01', name: 'Toussaint', type: 'religious', emoji: '🕯️' },
  { date: '12-25', name: 'Noël', type: 'religious', emoji: '🎄' },

  // Événements culturels et célébrations
  { date: '02-14', name: 'Saint-Valentin', type: 'celebration', emoji: '💝' },
  { date: '03-08', name: 'Journée Internationale des Femmes', type: 'celebration', emoji: '👩‍🦰' },
  { date: '03-21', name: 'Journée Internationale des Forêts', type: 'cultural', emoji: '🌳' },
  { date: '04-22', name: 'Jour de la Terre', type: 'cultural', emoji: '🌍' },
  { date: '05-25', name: "Journée de l'Afrique", type: 'cultural', emoji: '🌍' },
  { date: '06-01', name: "Journée Internationale de l'Enfance", type: 'celebration', emoji: '👶' },
  { date: '06-05', name: "Journée Mondiale de l'Environnement", type: 'cultural', emoji: '♻️' },
  { date: '06-21', name: 'Fête de la Musique', type: 'celebration', emoji: '🎵' },
  { date: '07-14', name: 'Fête Nationale Française', type: 'celebration', emoji: '🇫🇷' },
  { date: '09-01', name: 'Rentrée Scolaire', type: 'cultural', emoji: '🎒' },
  { date: '10-24', name: 'Journée des Nations Unies', type: 'cultural', emoji: '🌐' },
  { date: '10-31', name: 'Halloween', type: 'celebration', emoji: '🎃' },
  { date: '11-11', name: 'Armistice 1918', type: 'cultural', emoji: '🕊️' },
  { date: '12-10', name: "Journée des Droits de l'Homme", type: 'cultural', emoji: '⚖️' },
  { date: '12-24', name: 'Veille de Noël', type: 'celebration', emoji: '🎅' },
  { date: '12-31', name: 'Saint-Sylvestre', type: 'celebration', emoji: '🎊' },
]

const getEvent = (date: Date): GabonEvent | null => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${month}-${day}`

  return GABON_EVENTS.find((e) => e.date === dateStr) || null
}

const getEventBgColor = (event: GabonEvent | null): string => {
  if (!event) return ''
  switch (event.type) {
    case 'holiday':
      return 'bg-red-50 dark:bg-red-950/20'
    case 'religious':
      return 'bg-purple-50 dark:bg-purple-950/20'
    case 'celebration':
      return 'bg-pink-50 dark:bg-pink-950/20'
    case 'cultural':
      return 'bg-amber-50 dark:bg-amber-950/20'
    default:
      return ''
  }
}

const getEventBadgeVariant = (
  event: GabonEvent | null,
): 'default' | 'destructive' | 'outline' | 'secondary' => {
  if (!event) return 'default'
  switch (event.type) {
    case 'holiday':
      return 'destructive'
    case 'religious':
      return 'secondary'
    case 'celebration':
      return 'outline'
    case 'cultural':
      return 'secondary'
    default:
      return 'default'
  }
}

export type CalendarFeature = {
  id: string
  name: string
  startAt: Date
  endAt: Date
  status: {
    color: string
    backgroundColor?: string
  }
}

type CalendarContextValue = {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  features: CalendarFeature[]
}

const CalendarContext = createContext<CalendarContextValue>({
  currentDate: new Date(),
  setCurrentDate: () => {},
  features: [],
})

export type CalendarProviderProps = {
  children: ReactNode
  className?: string
}

export const CalendarProvider: FC<CalendarProviderProps> = ({ children, className }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        features: [],
      }}
    >
      <div className={cn('flex h-full w-full flex-col overflow-auto bg-background', className)}>
        {children}
      </div>
    </CalendarContext.Provider>
  )
}

export type CalendarDateProps = {
  children: ReactNode
  className?: string
}

export const CalendarDate: FC<CalendarDateProps> = ({ children, className }) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 border-border/50 border-b p-4',
      className,
    )}
  >
    {children}
  </div>
)

export type CalendarDatePickerProps = {
  children: ReactNode
  className?: string
}

export const CalendarDatePicker: FC<CalendarDatePickerProps> = ({ children, className }) => (
  <div className={cn('flex items-center gap-2', className)}>{children}</div>
)

export type CalendarMonthPickerProps = {
  className?: string
}

export const CalendarMonthPicker: FC<CalendarMonthPickerProps> = ({ className }) => {
  const { currentDate, setCurrentDate } = useContext(CalendarContext)

  const handleValueChange = (value: string) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(parseInt(value, 10))
    setCurrentDate(newDate)
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return (
    <Select onValueChange={handleValueChange} value={currentDate.getMonth().toString()}>
      <SelectTrigger className={cn('w-[140px]', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((month, index) => (
          <SelectItem key={month} value={index.toString()}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type CalendarYearPickerProps = {
  start: number
  end: number
  className?: string
}

export const CalendarYearPicker: FC<CalendarYearPickerProps> = ({ start, end, className }) => {
  const { currentDate, setCurrentDate } = useContext(CalendarContext)

  const handleValueChange = (value: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(value, 10))
    setCurrentDate(newDate)
  }

  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <Select onValueChange={handleValueChange} value={currentDate.getFullYear().toString()}>
      <SelectTrigger className={cn('w-[100px]', className)}>
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
  )
}

export type CalendarDatePaginationProps = {
  className?: string
}

export const CalendarDatePagination: FC<CalendarDatePaginationProps> = ({ className }) => {
  const { currentDate, setCurrentDate } = useContext(CalendarContext)

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button onClick={handlePrevMonth} size="icon" type="button" variant="ghost">
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Button onClick={handleNextMonth} size="icon" type="button" variant="ghost">
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export type CalendarHeaderProps = {
  className?: string
}

export const CalendarHeader: FC<CalendarHeaderProps> = ({ className }) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className={cn('grid grid-cols-7 border-border/50 border-b bg-muted/50', className)}>
      {weekDays.map((day) => (
        <div className="p-2 text-center font-medium text-muted-foreground text-xs" key={day}>
          {day}
        </div>
      ))}
    </div>
  )
}

export type CalendarBodyProps = {
  features: CalendarFeature[]
  onFeatureClick?: (feature: CalendarFeature) => void
  className?: string
}

export const CalendarBody: FC<CalendarBodyProps> = ({ features, onFeatureClick, className }) => {
  const { currentDate } = useContext(CalendarContext)
  const id = useId()

  // Build calendar grid data
  const { calendarDays: _calendarDays, calendarWeeks } = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = getDaysInMonth(currentDate)
    const startDayOfWeek = getISODay(monthStart)

    const days: Array<{
      date: Date
      isCurrentMonth: boolean
    }> = []

    // Add previous month days to fill the first week
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const prevDate = new Date(monthStart)
      prevDate.setDate(prevDate.getDate() - i)
      days.push({
        date: prevDate,
        isCurrentMonth: false,
      })
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      days.push({
        date,
        isCurrentMonth: true,
      })
    }

    // Add next month days to fill the last week
    const remainingDays = 7 - (days.length % 7)
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(monthEnd)
        nextDate.setDate(nextDate.getDate() + i)
        days.push({
          date: nextDate,
          isCurrentMonth: false,
        })
      }
    }

    // Group days into weeks
    const weeks: Array<typeof days> = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return { calendarDays: days, calendarWeeks: weeks }
  }, [currentDate])

  // Calculate feature bars with positioning
  type FeatureBar = {
    feature: CalendarFeature
    rowIndex: number
    colStart: number // 0-6 within the week
    colSpan: number
    lane: number
    isStart: boolean
    isEnd: boolean
  }

  const featureBarsByRow = useMemo(() => {
    const barsByRow: Map<number, FeatureBar[]> = new Map()

    // For each feature, calculate which rows (weeks) it spans
    features.forEach((feature) => {
      const featureStart = new Date(feature.startAt)
      featureStart.setHours(0, 0, 0, 0)
      const featureEnd = new Date(feature.endAt)
      featureEnd.setHours(23, 59, 59, 999)

      calendarWeeks.forEach((week, rowIndex) => {
        const weekStart = new Date(week[0].date)
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(week[6].date)
        weekEnd.setHours(23, 59, 59, 999)

        // Check if feature overlaps this week
        if (featureStart <= weekEnd && featureEnd >= weekStart) {
          // Calculate colStart and colSpan within this week
          let colStart = 0
          if (featureStart > weekStart) {
            // Feature starts mid-week
            for (let i = 0; i < 7; i++) {
              const dayDate = new Date(week[i].date)
              dayDate.setHours(0, 0, 0, 0)
              if (isSameDay(dayDate, featureStart) || dayDate > featureStart) {
                colStart = i
                break
              }
            }
          }

          let colEnd = 6
          if (featureEnd < weekEnd) {
            // Feature ends mid-week
            for (let i = 6; i >= 0; i--) {
              const dayDate = new Date(week[i].date)
              dayDate.setHours(23, 59, 59, 999)
              if (isSameDay(dayDate, featureEnd) || dayDate < featureEnd) {
                colEnd = i
                break
              }
            }
          }

          const colSpan = colEnd - colStart + 1
          const isStart = featureStart >= weekStart && featureStart <= weekEnd
          const isEnd = featureEnd >= weekStart && featureEnd <= weekEnd

          const bar: FeatureBar = {
            feature,
            rowIndex,
            colStart,
            colSpan,
            lane: 0, // Will be calculated
            isStart,
            isEnd,
          }

          if (!barsByRow.has(rowIndex)) {
            barsByRow.set(rowIndex, [])
          }
          barsByRow.get(rowIndex)!.push(bar)
        }
      })
    })

    // Calculate lanes for each row to avoid overlaps
    barsByRow.forEach((bars) => {
      // Sort bars by colStart for consistent lane assignment
      bars.sort((a, b) => a.colStart - b.colStart || a.colSpan - b.colSpan)

      // Track which lanes are occupied at each column
      const laneOccupancy: Map<number, Set<number>> = new Map()

      bars.forEach((bar) => {
        // Find the first available lane for this bar
        let lane = 0
        let laneFound = false

        while (!laneFound) {
          laneFound = true
          for (let col = bar.colStart; col < bar.colStart + bar.colSpan; col++) {
            const occupied = laneOccupancy.get(col) || new Set()
            if (occupied.has(lane)) {
              laneFound = false
              lane++
              break
            }
          }
        }

        bar.lane = lane

        // Mark this lane as occupied for all columns this bar spans
        for (let col = bar.colStart; col < bar.colStart + bar.colSpan; col++) {
          if (!laneOccupancy.has(col)) {
            laneOccupancy.set(col, new Set())
          }
          laneOccupancy.get(col)!.add(lane)
        }
      })
    })

    return barsByRow
  }, [features, calendarWeeks])

  // Calculate max lanes per row for height allocation
  const maxLanesPerRow = useMemo(() => {
    const result: Map<number, number> = new Map()
    featureBarsByRow.forEach((bars, rowIndex) => {
      const maxLane = Math.max(...bars.map((b) => b.lane), -1) + 1
      result.set(rowIndex, maxLane)
    })
    return result
  }, [featureBarsByRow])

  return (
    <div className={cn('flex flex-col flex-1', className)}>
      {calendarWeeks.map((week, rowIndex) => {
        const rowBars = featureBarsByRow.get(rowIndex) || []
        const maxLanes = maxLanesPerRow.get(rowIndex) || 0
        // Minimum 2 lanes (56px) pour uniformité, même sans features
        const barsHeight = Math.max(maxLanes, 2) * 28

        return (
          <div key={`${id}-row-${rowIndex}`} className="flex flex-col flex-1">
            {/* Day cells grid - header area with date numbers */}
            <div className="grid grid-cols-7">
              {week.map((day, colIndex) => {
                const event = getEvent(day.date)
                const isTodayDate = isToday(day.date)

                return (
                  <div
                    className={cn(
                      'min-h-[48px] border-border/50 border-r p-2',
                      // !day.isCurrentMonth && 'bg-muted/20',
                      getEventBgColor(event),
                      isTodayDate && 'ring-2 ring-inset ring-primary',
                    )}
                    key={`${id}-${rowIndex}-${colIndex}`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'text-sm',
                          !day.isCurrentMonth && 'text-muted-foreground',
                          isTodayDate &&
                            'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold',
                        )}
                      >
                        {format(day.date, 'd')}
                      </div>
                      {event && (
                        <span className="text-sm" title={event.name}>
                          {event.emoji}
                        </span>
                      )}
                    </div>
                    {event && (
                      <Badge
                        variant={getEventBadgeVariant(event)}
                        className="text-[9px] mt-1 w-full justify-center px-1 py-0 h-auto leading-tight truncate"
                        title={`${event.name} - ${event.type}`}
                      >
                        {event.name}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Feature bars layer - always shown with minimum height for uniformity */}
            <div
              className="relative grid grid-cols-7 border-border/50 border-b"
              style={{ minHeight: `${barsHeight + 8}px` }}
            >
              {/* Background columns for visual consistency */}
              {week.map((day, colIndex) => (
                <div
                  key={`${id}-bg-${rowIndex}-${colIndex}`}
                  className={cn(
                    'border-border/50 border-r h-full',
                    // !day.isCurrentMonth && 'bg-muted/20'
                  )}
                />
              ))}
              {/* Feature bars positioned absolutely */}
              {rowBars.map((bar) => {
                const leftPercent = (bar.colStart / 7) * 100
                const widthPercent = (bar.colSpan / 7) * 100

                return (
                  <div
                    key={`${bar.feature.id}-${rowIndex}`}
                    className={cn(
                      'absolute cursor-pointer truncate px-3 py-1.5 text-xs font-semibold hover:opacity-90 flex items-center justify-center text-center transition-all',
                      bar.isStart && bar.isEnd && 'rounded-md',
                      bar.isStart && !bar.isEnd && 'rounded-l-md',
                      !bar.isStart && bar.isEnd && 'rounded-r-md',
                      !bar.isStart && !bar.isEnd && 'rounded-none',
                    )}
                    style={{
                      left: `calc(${leftPercent}% + 4px)`,
                      width: `calc(${widthPercent}% - 8px)`,
                      top: `${bar.lane * 28 + 4}px`,
                      height: '24px',
                      backgroundColor:
                        bar.feature.status.backgroundColor || bar.feature.status.color,
                      color: bar.feature.status.backgroundColor ? bar.feature.status.color : '#fff',
                      border: `1px solid ${bar.feature.status.color}40`, // 25% opacity border
                    }}
                    onClick={() => onFeatureClick?.(bar.feature)}
                    title={bar.feature.name}
                  >
                    {/* Animated Bubble */}
                    <span className="relative flex h-2 w-2 mr-2">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: bar.feature.status.color }}
                      ></span>
                      <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: bar.feature.status.color }}
                      ></span>
                    </span>
                    {bar.feature.name}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type CalendarItemProps = {
  feature: CalendarFeature
  className?: string
  onClick?: () => void
}

export const CalendarItem: FC<CalendarItemProps> = ({ feature, className, onClick }) => (
  <div
    className={cn('cursor-pointer truncate rounded px-2 py-1 text-xs hover:opacity-80', className)}
    onClick={onClick}
    style={{
      backgroundColor: feature.status.color,
    }}
    title={feature.name}
  >
    {feature.name}
  </div>
)
