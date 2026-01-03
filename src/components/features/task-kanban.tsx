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
import { Task, STATUS_COLORS } from "./task-types";

interface TaskKanbanProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED") => Promise<void>;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
}

const TASK_STATUSES = [
  { id: "TODO", name: "À faire", color: STATUS_COLORS.TODO },
  { id: "IN_PROGRESS", name: "En cours", color: STATUS_COLORS.IN_PROGRESS },
  { id: "REVIEW", name: "En revue", color: "#8B5CF6" },
  { id: "DONE", name: "Terminé", color: STATUS_COLORS.DONE },
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

// Palette de couleurs pour les avatars
const AVATAR_COLORS = [
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-green-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-yellow-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
];

// Générer une couleur cohérente basée sur l'ID ou le nom de l'utilisateur
const getAvatarColor = (userId: string | undefined, userName: string | undefined) => {
  const identifier = userId || userName || "default";
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

function DraggableTaskCard({ task, onEventClick, onEventDelete, onEventToggle, currentUserId, currentUserRole }: {
  task: Task;
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
}) {
  const isCreator = task.Creator?.id === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";
  const canModify = isCreator || isAdmin;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  // Construire la liste des avatars à afficher (créateur + membres assignés)
  const avatarsToDisplay = useMemo(() => {
    const avatars: Array<{ id: string; name: string; avatar?: string; isCreator: boolean }> = [];

    // Ajouter le créateur en premier
    if (task.Creator) {
      avatars.push({
        id: task.Creator.id,
        name: task.Creator.name,
        avatar: task.Creator.avatar,
        isCreator: true,
      });
    }

    // Ajouter les membres assignés (sans dupliquer le créateur)
    if (task.TaskMember) {
      task.TaskMember.forEach((member) => {
        if (member.User.id !== task.Creator?.id) {
          avatars.push({
            id: member.User.id,
            name: member.User.name,
            avatar: member.User.avatar,
            isCreator: false,
          });
        }
      });
    }

    return avatars;
  }, [task.Creator, task.TaskMember]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            "p-3 cursor-pointer transition-all",
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

            {/* Afficher les avatars du créateur et des membres assignés */}
            {avatarsToDisplay.length > 0 && (
              <div className="flex items-center gap-1 pt-1 border-t">
                <div className="flex -space-x-2">
                  {avatarsToDisplay.slice(0, 3).map((person) => {
                    const initials = person.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "?";
                    const color = getAvatarColor(person.id, person.name);

                    return (
                      <Avatar
                        key={person.id}
                        className="h-6 w-6 border-2 border-background"
                        title={`${person.name}${person.isCreator ? " (Créateur)" : ""}`}
                      >
                        <AvatarImage src={person.avatar || undefined} alt={person.name} />
                        <AvatarFallback className={cn(
                          "text-[10px] font-medium",
                          color.bg,
                          color.text
                        )}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {avatarsToDisplay.length > 3 && (
                    <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                      <span className="text-[10px] font-medium">+{avatarsToDisplay.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
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
      </ContextMenuContent>
    </ContextMenu>
  );
}

function DroppableColumn({ status, tasks, onEventClick, onEventDelete, onEventToggle, currentUserId, currentUserRole }: {
  status: typeof TASK_STATUSES[number];
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { status: status.id },
  });

  return (
    <div className="flex flex-col w-full sm:w-[300px] md:w-[320px] lg:w-[350px] shrink-0">
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
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
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
  currentUserId,
  currentUserRole,
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
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <Card className="p-3 opacity-90">
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
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
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
            <Card className="p-3 opacity-90">
              <h4 className="font-medium text-sm">{activeTask.name}</h4>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
