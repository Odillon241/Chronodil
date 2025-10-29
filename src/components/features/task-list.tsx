"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Edit, Trash2, Circle, CheckCircle, Bell, Users, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Task, STATUS_COLORS } from "./task-types";

interface TaskListProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}

const TASK_STATUSES = [
  { id: "TODO", name: "À faire", color: STATUS_COLORS.TODO },
  { id: "IN_PROGRESS", name: "En cours", color: STATUS_COLORS.IN_PROGRESS },
  { id: "REVIEW", name: "En revue", color: "#8B5CF6" },
  { id: "DONE", name: "Terminé", color: STATUS_COLORS.DONE },
  { id: "BLOCKED", name: "Bloqué", color: "#EF4444" },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-500";
    case "HIGH":
      return "bg-orange-500";
    case "MEDIUM":
      return "bg-yellow-500";
    case "LOW":
      return "bg-green-500";
    default:
      return "bg-blue-500";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "Urgent";
    case "HIGH":
      return "Haute";
    case "MEDIUM":
      return "Moyenne";
    case "LOW":
      return "Basse";
    default:
      return priority;
  }
};

function TaskItem({ task, onEventClick, onEventDelete, onEventToggle }: {
  task: Task;
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => onEventClick(task)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
            !task.isActive && "opacity-60"
          )}
        >
          {/* Indicateur de priorité */}
          <div
            className={cn("h-2 w-2 rounded-full flex-shrink-0", getPriorityColor(task.priority))}
          />

          {/* Nom de la tâche */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{task.name}</p>
            {task.Project && (
              <p className="text-xs text-muted-foreground truncate">{task.Project.name}</p>
            )}
          </div>

          {/* Badges et infos */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>{format(new Date(task.dueDate), "d MMM", { locale: fr })}</span>
              </div>
            )}

            {task.estimatedHours && (
              <Badge variant="outline" className="text-xs">
                {task.estimatedHours}h
              </Badge>
            )}

            <Badge variant="secondary" className="text-xs">
              {getPriorityLabel(task.priority)}
            </Badge>

            <div className="flex items-center gap-1">
              {task.isShared && <Users className="h-3 w-3 text-muted-foreground" />}
              {task.reminderDate && <Bell className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
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

export function TaskList({
  tasks,
  onEventClick,
  onEventDelete,
  onEventToggle,
}: TaskListProps) {
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {TASK_STATUSES.map(status => {
        const statusTasks = tasksByStatus.get(status.id) || [];

        return (
          <div key={status.id} className="space-y-3">
            {/* En-tête du groupe */}
            <div className="flex items-center gap-3 sticky top-0 bg-background py-2 z-10">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <h3 className="font-semibold text-sm">{status.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {statusTasks.length}
              </Badge>
            </div>

            {/* Liste des tâches */}
            <div className="space-y-2 pl-4">
              {statusTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune tâche</p>
              ) : (
                statusTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEventClick={onEventClick}
                    onEventDelete={onEventDelete}
                    onEventToggle={onEventToggle}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
