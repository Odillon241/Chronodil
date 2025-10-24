"use client";

import { useMemo } from "react";
import {
  GanttProvider,
  GanttTimeline,
  GanttHeader,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttToday,
  type GanttFeature,
  type GanttStatus,
} from "@/components/ui/shadcn-io/gantt";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Circle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TaskGanttProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDrop?: (taskId: string, newDate: Date) => Promise<void>;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  onAddItem?: (date: Date) => void;
}

const TASK_STATUSES: Record<string, GanttStatus> = {
  TODO: { id: "TODO", name: "À faire", color: "#6B7280" },
  IN_PROGRESS: { id: "IN_PROGRESS", name: "En cours", color: "#F59E0B" },
  REVIEW: { id: "REVIEW", name: "En revue", color: "#8B5CF6" },
  DONE: { id: "DONE", name: "Terminé", color: "#10B981" },
  BLOCKED: { id: "BLOCKED", name: "Bloqué", color: "#EF4444" },
};

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

export function TaskGantt({
  tasks,
  onEventClick,
  onEventDrop,
  onEventDelete,
  onEventToggle,
  onAddItem,
}: TaskGanttProps) {
  // Créer une Map des tâches pour accès rapide
  const tasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  // Convertir les tâches en features Gantt
  const ganttFeatures = useMemo<GanttFeature[]>(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const startAt = task.dueDate ? new Date(task.dueDate) : new Date();
        const endAt = task.estimatedHours
          ? new Date(startAt.getTime() + task.estimatedHours * 60 * 60 * 1000)
          : new Date(startAt.getTime() + 24 * 60 * 60 * 1000); // Par défaut 1 jour

        return {
          id: task.id,
          name: task.name,
          startAt,
          endAt,
          status: TASK_STATUSES[task.status] || TASK_STATUSES.TODO,
          lane: task.Project?.name, // Grouper par projet
        };
      });
  }, [tasks]);

  // Grouper les features par lane (projet)
  const featuresByLane = useMemo(() => {
    const grouped = new Map<string, GanttFeature[]>();

    ganttFeatures.forEach((feature) => {
      const lane = feature.lane || "Sans projet";
      if (!grouped.has(lane)) {
        grouped.set(lane, []);
      }
      grouped.get(lane)!.push(feature);
    });

    return grouped;
  }, [ganttFeatures]);

  const handleMove = async (
    id: string,
    startAt: Date,
    endAt: Date | null
  ) => {
    if (onEventDrop) {
      await onEventDrop(id, startAt);
    }
  };

  const handleSelectItem = (id: string) => {
    const task = tasksMap.get(id);
    if (task) {
      onEventClick(task);
    }
  };

  const handleDelete = async (id: string) => {
    if (onEventDelete) {
      await onEventDelete(id);
    }
  };

  const handleToggle = async (id: string) => {
    const task = tasksMap.get(id);
    if (task && onEventToggle) {
      await onEventToggle(task);
    }
  };

  if (ganttFeatures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Aucune tâche avec date d'échéance pour afficher le Gantt
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full">
      <GanttProvider range="monthly" zoom={100} onAddItem={onAddItem}>
        <GanttSidebar>
          {Array.from(featuresByLane.entries()).map(([lane, features]) => (
            <GanttSidebarGroup key={lane} name={lane}>
              {features.map((feature) => (
                <GanttSidebarItem
                  key={feature.id}
                  feature={feature}
                  onSelectItem={handleSelectItem}
                />
              ))}
            </GanttSidebarGroup>
          ))}
        </GanttSidebar>

        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {Array.from(featuresByLane.entries()).map(([lane, features]) => (
              <GanttFeatureListGroup key={lane}>
                <GanttFeatureRow
                  features={features}
                  onMove={handleMove}
                >
                  {(feature) => {
                    const task = tasksMap.get(feature.id);
                    if (!task) return null;

                    return (
                      <ContextMenu>
                        <ContextMenuTrigger className="flex-1 w-full">
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: feature.status.color }}
                            />
                            <p className="flex-1 truncate font-medium">
                              {feature.name}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1 py-0",
                                  getPriorityColor(task.priority)
                                )}
                              >
                                {getPriorityLabel(task.priority)}
                              </Badge>
                              {task.estimatedHours && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 flex items-center gap-0.5"
                                >
                                  <Clock className="h-2.5 w-2.5" />
                                  {task.estimatedHours}h
                                </Badge>
                              )}
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => handleSelectItem(feature.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </ContextMenuItem>
                          {onEventToggle && (
                            <ContextMenuItem
                              onClick={() => handleToggle(feature.id)}
                            >
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
                            <ContextMenuItem
                              onClick={() => handleDelete(feature.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </ContextMenuItem>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  }}
                </GanttFeatureRow>
              </GanttFeatureListGroup>
            ))}
          </GanttFeatureList>
          <GanttToday />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}
