"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, Users, Edit, Trash2, Circle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";

interface Task {
  id: string;
  name: string;
  description?: string;
  dueDate?: string | Date;
  estimatedHours?: number;
  status: string;
  priority: string;
  isShared?: boolean;
  isActive?: boolean;
  reminderDate?: string | Date;
  Project?: {
    name: string;
    color: string;
  };
}

interface TaskCalendarProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDrop: (taskId: string, newDate: Date) => Promise<void>;
  onDayDoubleClick: (date: Date) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}

// Jours fériés du Gabon
const GABON_HOLIDAYS = [
  { date: '01-01', name: 'Nouvel An' },
  { date: '03-12', name: 'Fête de la Rénovation' },
  { date: '04-17', name: 'Fête des Femmes' },
  { date: '05-01', name: 'Fête du Travail' },
  { date: '05-25', name: 'Pentecôte' },
  { date: '08-15', name: 'Assomption' },
  { date: '08-16', name: 'Fête de l\'Indépendance (jour 1)' },
  { date: '08-17', name: 'Fête de l\'Indépendance (jour 2)' },
  { date: '11-01', name: 'Toussaint' },
  { date: '12-25', name: 'Noël' },
];

const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;

  const holiday = GABON_HOLIDAYS.find(h => h.date === dateStr);
  return {
    isHoliday: !!holiday,
    name: holiday?.name
  };
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-500 border-red-600";
    case "HIGH":
      return "bg-orange-500 border-orange-600";
    case "MEDIUM":
      return "bg-yellow-500 border-yellow-600";
    case "LOW":
      return "bg-green-500 border-green-600";
    default:
      return "bg-blue-500 border-blue-600";
  }
};

// Composant pour une tâche draggable
function DraggableTask({ task, onEventClick, onEventDelete, onEventToggle }: {
  task: Task;
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const priorityColor = getPriorityColor(task.priority);
  const isCompleted = task.status === "DONE";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            "group relative px-2 py-1 mb-1 rounded border-l-4 text-xs cursor-pointer transition-all hover:shadow-sm",
            priorityColor,
            isCompleted && "opacity-60 line-through",
            isDragging && "opacity-50"
          )}
          onClick={() => onEventClick(task)}
        >
          <div className="flex items-center gap-1 text-white">
            <span className="font-medium truncate flex-1">{task.name}</span>
            {task.isShared && <Users className="h-3 w-3 flex-shrink-0" />}
            {task.reminderDate && <Bell className="h-3 w-3 flex-shrink-0" />}
          </div>
          {task.Project && (
            <div className="text-white/90 text-[10px] truncate mt-0.5">
              {task.Project.name}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEventClick(task)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </ContextMenuItem>
        {onEventToggle && (
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
        <ContextMenuSeparator />
        {onEventDelete && (
          <ContextMenuItem onClick={() => onEventDelete(task.id)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Composant pour un jour droppable
function DroppableDay({ date, tasks, isCurrentMonth, onEventClick, onDayDoubleClick, onEventDelete, onEventToggle }: {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  onEventClick: (task: Task) => void;
  onDayDoubleClick: (date: Date) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  });

  const holiday = isHoliday(date);
  const isTodayDate = isToday(date);

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onDayDoubleClick(date)}
      className={cn(
        "min-h-[100px] sm:min-h-[120px] border-r border-b p-1 sm:p-2 transition-colors",
        !isCurrentMonth && "bg-muted/30",
        isOver && "bg-primary/10 border-primary",
        holiday.isHoliday && "bg-red-50 dark:bg-red-950/20",
        isTodayDate && "bg-blue-50 dark:bg-blue-950/30"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-sm font-medium",
          !isCurrentMonth && "text-muted-foreground",
          isTodayDate && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
        )}>
          {format(date, 'd', { locale: fr })}
        </span>
        {holiday.isHoliday && (
          <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
            🇬🇦
          </span>
        )}
      </div>

      {holiday.isHoliday && (
        <Badge variant="destructive" className="text-[10px] mb-1 w-full justify-center">
          {holiday.name}
        </Badge>
      )}

      <div className="space-y-1">
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onEventClick={onEventClick}
            onEventDelete={onEventDelete}
            onEventToggle={onEventToggle}
          />
        ))}
      </div>
    </div>
  );
}

export function TaskCalendar({
  tasks,
  onEventClick,
  onEventDrop,
  onDayDoubleClick,
  onEventDelete,
  onEventToggle,
}: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Calculer les jours du mois avec padding
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Grouper les tâches par jour
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach(task => {
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const dayKey = format(date, 'yyyy-MM-dd');

        if (!grouped.has(dayKey)) {
          grouped.set(dayKey, []);
        }
        grouped.get(dayKey)!.push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.data.current?.task) {
      const task = active.data.current.task;
      const newDate = over.data.current?.date;

      if (newDate) {
        onEventDrop(task.id, newDate);
      }
    }

    setActiveTask(null);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-4">
      {/* En-tête avec navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-xl sm:text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-[640px]">
            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7 bg-muted/50">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-semibold border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDay.get(dayKey) || [];

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
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeTask && (
            <Card className={cn("p-2 text-xs cursor-grabbing", getPriorityColor(activeTask.priority))}>
              <div className="text-white font-medium">{activeTask.name}</div>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
