"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, addYears, subYears, setMonth, setYear } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, Users, Edit, Trash2, Circle, CheckCircle, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Task } from "./task-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskCalendarProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDrop: (taskId: string, newDate: Date) => Promise<void>;
  onDayDoubleClick: (date: Date) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
}

// Événements et jours fériés du Gabon
interface GabonEvent {
  date: string;
  name: string;
  type: 'holiday' | 'celebration' | 'cultural' | 'religious';
  emoji: string;
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
  { date: '05-25', name: 'Journée de l\'Afrique', type: 'cultural', emoji: '🌍' },
  { date: '06-01', name: 'Journée Internationale de l\'Enfance', type: 'celebration', emoji: '👶' },
  { date: '06-05', name: 'Journée Mondiale de l\'Environnement', type: 'cultural', emoji: '♻️' },
  { date: '06-21', name: 'Fête de la Musique', type: 'celebration', emoji: '🎵' },
  { date: '07-14', name: 'Fête Nationale Française', type: 'celebration', emoji: '🇫🇷' },
  { date: '09-01', name: 'Rentrée Scolaire', type: 'cultural', emoji: '🎒' },
  { date: '10-24', name: 'Journée des Nations Unies', type: 'cultural', emoji: '🌐' },
  { date: '10-31', name: 'Halloween', type: 'celebration', emoji: '🎃' },
  { date: '11-11', name: 'Armistice 1918', type: 'cultural', emoji: '🕊️' },
  { date: '12-10', name: 'Journée des Droits de l\'Homme', type: 'cultural', emoji: '⚖️' },
  { date: '12-24', name: 'Veille de Noël', type: 'celebration', emoji: '🎅' },
  { date: '12-31', name: 'Saint-Sylvestre', type: 'celebration', emoji: '🎊' },
];

const getEvent = (date: Date): GabonEvent | null => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;

  return GABON_EVENTS.find(e => e.date === dateStr) || null;
};

const isHoliday = (date: Date): { isHoliday: boolean; name?: string; type?: string; emoji?: string } => {
  const event = getEvent(date);
  return {
    isHoliday: event?.type === 'holiday',
    name: event?.name,
    type: event?.type,
    emoji: event?.emoji,
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
function DraggableTask({ task, onEventClick, onEventDelete, onEventToggle, currentUserId, currentUserRole, currentDate }: {
  task: Task;
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
  currentDate: Date;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const priorityColor = getPriorityColor(task.priority);
  const isCompleted = task.status === "DONE";

  // Déterminer si c'est le premier jour, un jour intermédiaire ou le dernier jour
  const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
  const startDate = task.estimatedHours && task.estimatedHours > 0
    ? new Date(dueDate.getTime() - task.estimatedHours * 60 * 60 * 1000)
    : dueDate;

  const currentDateNorm = new Date(currentDate);
  currentDateNorm.setHours(0, 0, 0, 0);
  const startDateNorm = new Date(startDate);
  startDateNorm.setHours(0, 0, 0, 0);
  const dueDateNorm = new Date(dueDate);
  dueDateNorm.setHours(0, 0, 0, 0);

  const isFirstDay = currentDateNorm.getTime() === startDateNorm.getTime();
  const isLastDay = currentDateNorm.getTime() === dueDateNorm.getTime();
  const isMiddleDay = !isFirstDay && !isLastDay;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            "group relative px-2 py-1 mb-1 text-xs cursor-pointer transition-all",
            priorityColor,
            isCompleted && "opacity-60 line-through",
            isDragging && "opacity-50",
            // Arrondir les coins selon la position dans la période
            isFirstDay && "rounded-l border-l-4",
            isLastDay && "rounded-r border-r-4",
            isMiddleDay && "border-l-0 border-r-0",
            // Ajouter un indicateur visuel pour les jours intermédiaires
            isMiddleDay && "border-t-2 border-b-2"
          )}
          onClick={() => onEventClick(task)}
        >
          <div className="flex items-center gap-1.5 text-white">
            <span className="font-medium truncate flex-1">{task.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              {task.isShared && <Users className="h-3 w-3" />}
              {task.reminderDate && <Bell className="h-3 w-3" />}
              {/* Afficher le créateur et les membres assignés */}
              <div className="flex -space-x-1.5">
                {task.Creator && (
                  <Avatar
                    className="h-4 w-4 border border-white/30"
                    title={`${task.Creator.name} (Créateur)`}
                  >
                    <AvatarImage src={task.Creator.avatar || undefined} />
                    <AvatarFallback className="text-[8px] bg-white/20 text-white">
                      {task.Creator.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                {/* Afficher les membres assignés (max 2 membres supplémentaires) */}
                {task.TaskMember?.filter((member) => member.User.id !== task.Creator?.id).slice(0, 2).map((member) => (
                  <Avatar
                    key={member.id}
                    className="h-4 w-4 border border-white/30"
                    title={member.User.name}
                  >
                    <AvatarImage src={member.User.avatar || undefined} />
                    <AvatarFallback className="text-[8px] bg-white/20 text-white">
                      {member.User.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {/* Indicateur "+N" si plus de 2 membres */}
                {task.TaskMember && task.TaskMember.filter((m) => m.User.id !== task.Creator?.id).length > 2 && (
                  <div className="h-4 w-4 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">
                      +{task.TaskMember.filter((m) => m.User.id !== task.Creator?.id).length - 2}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {task.Project && (
            <div className="text-white/90 text-[10px] truncate mt-0.5">
              {task.Project.name}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {(() => {
          const isCreator = task.Creator?.id === currentUserId;
          const isAdmin = currentUserRole === "ADMIN";
          const canModify = isCreator || isAdmin;
          
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
                  <ContextMenuItem onClick={() => onEventDelete(task.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </ContextMenuItem>
                </>
              )}
            </>
          );
        })()}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Composant pour un jour droppable
function DroppableDay({ date, tasks, isCurrentMonth, onEventClick, onDayDoubleClick, onEventDelete, onEventToggle, currentUserId, currentUserRole }: {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  onEventClick: (task: Task) => void;
  onDayDoubleClick: (date: Date) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  });

  const eventInfo = isHoliday(date);
  const isTodayDate = isToday(date);
  const event = getEvent(date);

  // Limiter l'affichage à 3 tâches maximum (comme shadcn roadmap)
  const MAX_VISIBLE_TASKS = event ? 2 : 3; // Moins d'espace si événement
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
  const remainingCount = Math.max(0, tasks.length - MAX_VISIBLE_TASKS);

  // Couleurs selon le type d'événement
  const getEventBgColor = () => {
    if (!event) return "";
    switch (event.type) {
      case 'holiday':
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
      case 'religious':
        return "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900";
      case 'celebration':
        return "bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900";
      case 'cultural':
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";
      default:
        return "";
    }
  };

  const getEventBadgeVariant = (): "default" | "destructive" | "outline" | "secondary" => {
    if (!event) return "default";
    switch (event.type) {
      case 'holiday':
        return "destructive";
      case 'religious':
        return "secondary";
      case 'celebration':
        return "outline";
      case 'cultural':
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onDayDoubleClick(date)}
      className={cn(
        "min-h-[100px] sm:min-h-[120px] border-r border-b p-1 sm:p-2 transition-colors",
        !isCurrentMonth && "bg-muted/30",
        isOver && "bg-primary/10 border-primary",
        getEventBgColor(),
        isTodayDate && "ring-2 ring-primary ring-inset"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "text-sm font-medium",
          !isCurrentMonth && "text-muted-foreground",
          isTodayDate && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
        )}>
          {format(date, 'd', { locale: fr })}
        </span>
        {event && (
          <span className="text-base" title={event.name}>
            {event.emoji}
          </span>
        )}
      </div>

      {event && (
        <Badge
          variant={getEventBadgeVariant()}
          className="text-[9px] sm:text-[10px] mb-1 w-full justify-center px-1 py-0 h-auto leading-tight"
          title={`${event.name} - ${event.type}`}
        >
          <span className="truncate">{event.name}</span>
        </Badge>
      )}

      <div className="space-y-1">
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
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-auto py-1 px-2 text-[10px] hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onDayDoubleClick(date);
            }}
          >
            +{remainingCount} autre{remainingCount > 1 ? 's' : ''}
          </Button>
        )}
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
  currentUserId,
  currentUserRole,
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
  // Les tâches avec estimatedHours s'affichent sur plusieurs jours consécutifs
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);

        // Calculer la date de début en fonction des heures estimées
        let startDate: Date;
        if (task.estimatedHours && task.estimatedHours > 0) {
          // Si estimatedHours existe, calculer startDate = dueDate - estimatedHours
          const durationMs = task.estimatedHours * 60 * 60 * 1000;
          startDate = new Date(dueDate.getTime() - durationMs);
        } else {
          // Par défaut, afficher sur 1 jour uniquement
          startDate = dueDate;
        }

        // Générer toutes les dates entre startDate et dueDate
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0); // Normaliser à minuit
        const endDate = new Date(dueDate);
        endDate.setHours(0, 0, 0, 0); // Normaliser à minuit

        // Limiter à 60 jours maximum pour éviter les boucles infinies
        let dayCount = 0;
        const maxDays = 60;

        while (currentDate <= endDate && dayCount < maxDays) {
          const dayKey = format(currentDate, 'yyyy-MM-dd');

          if (!grouped.has(dayKey)) {
            grouped.set(dayKey, []);
          }
          grouped.get(dayKey)!.push(task);

          // Avancer d'un jour
          currentDate.setDate(currentDate.getDate() + 1);
          dayCount++;
        }
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

  // Générer les années (5 ans avant et après l'année courante)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Mois en français
  const months = [
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
  ];

  const handleMonthChange = (monthValue: string) => {
    const newMonth = parseInt(monthValue);
    setCurrentMonth(prev => setMonth(prev, newMonth));
  };

  const handleYearChange = (yearValue: string) => {
    const newYear = parseInt(yearValue);
    setCurrentMonth(prev => setYear(prev, newYear));
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec navigation améliorée */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5" />
          <div className="flex items-center gap-2">
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Aujourd'hui
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => subYears(prev, 1))}
              title="Année précédente"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              title="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              title="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => addYears(prev, 1))}
              title="Année suivante"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Légende des événements */}
      <div className="flex flex-wrap items-center gap-3 text-xs border rounded-lg p-3 bg-muted/30">
        <span className="font-medium text-muted-foreground">Légende:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700"></div>
          <span>Jours fériés 🇬🇦</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-200 dark:bg-purple-900 border border-purple-400 dark:border-purple-700"></div>
          <span>Fêtes religieuses ✝️</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pink-200 dark:bg-pink-900 border border-pink-400 dark:border-pink-700"></div>
          <span>Célébrations 💝</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-900 border border-amber-400 dark:border-amber-700"></div>
          <span>Événements culturels 🌍</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900 border-2 border-primary"></div>
          <span>Aujourd'hui</span>
        </div>
      </div>

      {/* Calendrier */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="border rounded-lg overflow-x-auto bg-card">
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
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
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
