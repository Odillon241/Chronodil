"use client";

import React, { useMemo, useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Edit, Trash2, Circle, CheckCircle, Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

interface TaskKanbanProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED") => Promise<void>;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}

const TASK_STATUSES = [
  { id: "TODO", name: "À faire", color: "#6B7280" },
  { id: "IN_PROGRESS", name: "En cours", color: "#F59E0B" },
  { id: "REVIEW", name: "En revue", color: "#8B5CF6" },
  { id: "DONE", name: "Terminé", color: "#10B981" },
  { id: "BLOCKED", name: "Bloqué", color: "#EF4444" },
] as const;

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "LOW":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
};

function DraggableTaskCard({ task, onEventClick, onEventDelete, onEventToggle }: {
  task: Task;
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            "p-3 cursor-pointer hover:shadow-md transition-all",
            isDragging && "opacity-50"
          )}
          onClick={() => onEventClick(task)}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm flex-1">{task.name}</h4>
              <div className="flex items-center gap-1">
                {task.isShared && <Users className="h-3 w-3 text-muted-foreground" />}
                {task.reminderDate && <Bell className="h-3 w-3 text-muted-foreground" />}
              </div>
            </div>

            {task.Project && (
              <p className="text-xs text-muted-foreground">{task.Project.name}</p>
            )}

            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>

              {task.dueDate && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(task.dueDate), "d MMM", { locale: fr })}
                </span>
              )}
            </div>

            {task.estimatedHours && (
              <div className="text-xs text-muted-foreground">
                ⏱️ {task.estimatedHours}h
              </div>
            )}
          </div>
        </Card>
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

function DroppableColumn({ status, tasks, onEventClick, onEventDelete, onEventToggle }: {
  status: typeof TASK_STATUSES[number];
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { status: status.id },
  });

  return (
    <div className="flex flex-col w-full sm:w-[300px] md:w-[320px] lg:w-[350px] flex-shrink-0">
      <div
        className="bg-background pb-2 sm:pb-3 mb-2 sm:mb-3 border-b"
        style={{ borderColor: status.color }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {status.name}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 min-h-[200px] p-2 rounded-lg transition-colors",
          isOver && "bg-muted/50"
        )}
      >
        {tasks.map((task) => (
          <DraggableTaskCard
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

export function TaskKanban({
  tasks,
  onEventClick,
  onStatusChange,
  onEventDelete,
  onEventToggle,
}: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Détecter la taille d'écran pour basculer entre vue Kanban et vue mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 640); // sm breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Grouper les tâches par statut
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    TASK_STATUSES.forEach(status => {
      grouped.set(status.id, []);
    });

    tasks.forEach(task => {
      const statusTasks = grouped.get(task.status) || [];
      statusTasks.push(task);
      grouped.set(task.status, statusTasks);
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
      const newStatus = over.data.current?.status as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";

      if (newStatus && task.status !== newStatus) {
        onStatusChange(task.id, newStatus);
      }
    }

    setActiveTask(null);
  };

  // Vue mobile avec colonnes empilées
  if (isMobileView) {
    return (
      <div className="space-y-4">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {TASK_STATUSES.map(status => (
              <div key={status.id} className="w-full">
                <DroppableColumn
                  status={status}
                  tasks={tasksByStatus.get(status.id) || []}
                  onEventClick={onEventClick}
                  onEventDelete={onEventDelete}
                  onEventToggle={onEventToggle}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <Card className="p-3 shadow-lg opacity-90">
                <h4 className="font-medium text-sm">{activeTask.name}</h4>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }

  // Vue desktop avec scroll horizontal
  return (
    <div className="space-y-4">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Conteneur avec scroll horizontal optimisé */}
        <div className="relative">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto overscroll-contain pb-4 px-2 sm:px-4 md:px-6 kanban-scrollbar">
            {TASK_STATUSES.map(status => (
              <DroppableColumn
                key={status.id}
                status={status}
                tasks={tasksByStatus.get(status.id) || []}
                onEventClick={onEventClick}
                onEventDelete={onEventDelete}
                onEventToggle={onEventToggle}
              />
            ))}
          </div>
          
          {/* Indicateur de scroll sur mobile */}
          <div className="md:hidden flex justify-center mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>←</span>
              <span>Faites défiler pour voir toutes les colonnes</span>
              <span>→</span>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <Card className="p-3 shadow-lg opacity-90">
              <h4 className="font-medium text-sm">{activeTask.name}</h4>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
