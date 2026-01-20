'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  setMonth,
  setYear,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Edit, Trash2, Circle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

import { cn } from '@/lib/utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { Task } from './task-types'
import { UserAvatar } from '@/components/ui/user-avatar'

interface TaskCalendarProps {
  tasks: Task[]
  onEventClick: (task: Task) => void
  onEventDrop: (taskId: string, newDate: Date) => Promise<void>
  onDayDoubleClick: (date: Date) => void
  onEventDelete?: (taskId: string) => Promise<void>
  onEventToggle?: (task: Task) => Promise<void>
  currentUserId?: string
  currentUserRole?: string
}

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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-500 hover:bg-red-600'
    case 'HIGH':
      return 'bg-orange-500 hover:bg-orange-600'
    case 'MEDIUM':
      return 'bg-amber-500 hover:bg-amber-600'
    case 'LOW':
      return 'bg-emerald-500 hover:bg-emerald-600'
    default:
      return 'bg-blue-500 hover:bg-blue-600'
  }
}

// Composant pour une tâche draggable
function DraggableTask({
  task,
  onEventClick,
  onEventDelete,
  onEventToggle,
  currentUserId,
  currentUserRole,
  currentDate,
}: {
  task: Task
  onEventClick: (task: Task) => void
  onEventDelete?: (taskId: string) => Promise<void>
  onEventToggle?: (task: Task) => Promise<void>
  currentUserId?: string
  currentUserRole?: string
  currentDate: Date
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const priorityColor = getPriorityColor(task.priority)
  const isCompleted = task.status === 'DONE'

  // Déterminer si c'est le premier jour, un jour intermédiaire ou le dernier jour
  const dueDate = task.dueDate ? new Date(task.dueDate) : new Date()
  const startDate =
    task.estimatedHours && task.estimatedHours > 0
      ? new Date(dueDate.getTime() - task.estimatedHours * 60 * 60 * 1000)
      : dueDate

  const currentDateNorm = new Date(currentDate)
  currentDateNorm.setHours(0, 0, 0, 0)
  const startDateNorm = new Date(startDate)
  startDateNorm.setHours(0, 0, 0, 0)
  const dueDateNorm = new Date(dueDate)
  dueDateNorm.setHours(0, 0, 0, 0)

  const isFirstDay = currentDateNorm.getTime() === startDateNorm.getTime()
  const isLastDay = currentDateNorm.getTime() === dueDateNorm.getTime()

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            'group relative px-2 py-0.5 mb-1 text-xs cursor-pointer transition-all rounded shadow-sm',
            priorityColor,
            isCompleted && 'opacity-60 grayscale',
            isDragging && 'opacity-50 scale-95',
            'mx-0.5 text-white',
          )}
          onClick={() => onEventClick(task)}
        >
          <div className="flex items-center gap-1.5 h-full">
            <span className="font-medium truncate flex-1 leading-tight">{task.name}</span>
            {(isFirstDay || isLastDay) && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-80 scale-90">
                {task.TaskMember?.filter((m) => m.User.id !== task.Creator?.id)
                  .slice(0, 2)
                  .map((member) => (
                    <UserAvatar
                      key={member.id}
                      name={member.User.name}
                      avatar={member.User.avatar}
                      size="xs"
                      className="h-3 w-3 border border-white/20"
                      fallbackClassName="text-[6px] bg-white/20 text-white"
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {(() => {
          const isCreator = task.Creator?.id === currentUserId
          const isAdmin = currentUserRole === 'ADMIN'
          const canModify = isCreator || isAdmin

          return (
            <>
              {canModify && (
                <ContextMenuItem onClick={() => onEventClick(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </ContextMenuItem>
              )}
              {canModify && onEventToggle && (
                <ContextMenuItem onClick={() => onEventToggle(task)}>
                  {task.isActive ? (
                    <>
                      <Circle className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </ContextMenuItem>
              )}
              {canModify && onEventDelete && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onEventDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </ContextMenuItem>
                </>
              )}
            </>
          )
        })()}
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Composant pour un jour droppable
function DroppableDay({
  date,
  tasks,
  isCurrentMonth,
  onEventClick,
  onDayDoubleClick,
  onEventDelete,
  onEventToggle,
  currentUserId,
  currentUserRole,
}: {
  date: Date
  tasks: Task[]
  isCurrentMonth: boolean
  onEventClick: (task: Task) => void
  onDayDoubleClick: (date: Date) => void
  onEventDelete?: (taskId: string) => Promise<void>
  onEventToggle?: (task: Task) => Promise<void>
  currentUserId?: string
  currentUserRole?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  })

  const isTodayDate = isToday(date)
  const event = getEvent(date)

  // Limiter l'affichage à 3 tâches maximum
  const MAX_VISIBLE_TASKS = 3
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS)
  const remainingCount = Math.max(0, tasks.length - MAX_VISIBLE_TASKS)

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onDayDoubleClick(date)}
      className={cn(
        'min-h-[100px] sm:min-h-[120px] border-r border-b p-1 transition-colors relative group',
        !isCurrentMonth && 'bg-muted/10 text-muted-foreground',
        isOver && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
        isTodayDate && 'bg-primary/5',
      )}
    >
      {/* Header du jour */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span
          className={cn(
            'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all',
            isTodayDate
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground group-hover:text-foreground group-hover:bg-muted',
          )}
        >
          {format(date, 'd')}
        </span>
        {event && (
          <div className="flex items-center" title={event.name}>
            <span className="text-sm cursor-help">{event.emoji}</span>
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        {visibleTasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onEventClick={onEventClick}
            onEventDelete={onEventDelete}
            onEventToggle={onEventToggle}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            currentDate={date}
          />
        ))}

        {remainingCount > 0 && (
          <div
            className="text-[10px] text-muted-foreground pl-2 cursor-pointer hover:text-primary transition-colors font-medium py-0.5"
            onClick={(e) => {
              e.stopPropagation()
              onDayDoubleClick(date)
            }}
          >
            +{remainingCount} autres
          </div>
        )}
      </div>
    </div>
  )
}

export function TaskCalendar({
  tasks,
  onEventClick,
  onEventDrop,
  onDayDoubleClick,
  onEventDelete,
  onEventToggle,
  currentUserId,
  currentUserRole,
}: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Calculer les jours du mois avec padding
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Grouper les tâches par jour
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, Task[]>()

    tasks.forEach((task) => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate)

        // Calculer la date de début en fonction des heures estimées
        let startDate: Date
        if (task.estimatedHours && task.estimatedHours > 0) {
          const durationMs = task.estimatedHours * 60 * 60 * 1000
          startDate = new Date(dueDate.getTime() - durationMs)
        } else {
          startDate = dueDate
        }

        const currentDate = new Date(startDate)
        currentDate.setHours(0, 0, 0, 0)
        const endDate = new Date(dueDate)
        endDate.setHours(0, 0, 0, 0)

        let dayCount = 0
        const maxDays = 60

        while (currentDate <= endDate && dayCount < maxDays) {
          const dayKey = format(currentDate, 'yyyy-MM-dd')

          if (!grouped.has(dayKey)) {
            grouped.set(dayKey, [])
          }
          grouped.get(dayKey)!.push(task)

          currentDate.setDate(currentDate.getDate() + 1)
          dayCount++
        }
      }
    })

    return grouped
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.data.current?.task) {
      const task = active.data.current.task
      const newDate = over.data.current?.date

      if (newDate) {
        onEventDrop(task.id, newDate)
      }
    }

    setActiveTask(null)
  }

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  const currentYear = new Date().getFullYear()
  const _years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  const _months = [
    { value: 0, label: 'Janvier' },
    { value: 1, label: 'Février' },
    { value: 2, label: 'Mars' },
    { value: 3, label: 'Avril' },
    { value: 4, label: 'Mai' },
    { value: 5, label: 'Juin' },
    { value: 6, label: 'Juillet' },
    { value: 7, label: 'Août' },
    { value: 8, label: 'Septembre' },
    { value: 9, label: 'Octobre' },
    { value: 10, label: 'Novembre' },
    { value: 11, label: 'Décembre' },
  ]

  const _handleMonthChange = (monthValue: string) => {
    const newMonth = parseInt(monthValue)
    setCurrentMonth((prev) => setMonth(prev, newMonth))
  }

  const _handleYearChange = (yearValue: string) => {
    const newYear = parseInt(yearValue)
    setCurrentMonth((prev) => setYear(prev, newYear))
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec navigation améliorée */}

      {/* Calendrier */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="border rounded-lg overflow-x-auto bg-card shadow-sm">
          <div className="min-w-[700px]">
            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7 bg-muted/30 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 bg-background">
              {calendarDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayTasks = tasksByDay.get(dayKey) || []

                return (
                  <DroppableDay
                    key={dayKey}
                    date={day}
                    tasks={dayTasks}
                    isCurrentMonth={isSameMonth(day, currentMonth)}
                    onEventClick={onEventClick}
                    onDayDoubleClick={onDayDoubleClick}
                    onEventDelete={onEventDelete}
                    onEventToggle={onEventToggle}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeTask && (
            <Card
              className={cn(
                'p-2 text-xs cursor-grabbing opacity-90 shadow-xl scale-105',
                getPriorityColor(activeTask.priority),
              )}
            >
              <div className="text-white font-medium truncate">{activeTask.name}</div>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
