"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  GanttProvider,
  GanttTimeline,
  GanttHeader,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  GanttMarker,
  GanttCreateMarkerTrigger,
  type GanttFeature,
  type GanttStatus,
  type GanttMarkerProps,
} from "@/components/ui/shadcn-io/gantt";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Circle, CheckCircle, Eye, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, STATUS_COLORS } from "./task-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskGanttProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDrop?: (taskId: string, newDate: Date) => Promise<void>;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  onAddItem?: (date: Date) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

const TASK_STATUSES: Record<string, GanttStatus> = {
  TODO: { id: "TODO", name: "À faire", color: STATUS_COLORS.TODO },
  IN_PROGRESS: { id: "IN_PROGRESS", name: "En cours", color: STATUS_COLORS.IN_PROGRESS },
  REVIEW: { id: "REVIEW", name: "En revue", color: "#8B5CF6" },
  DONE: { id: "DONE", name: "Terminé", color: STATUS_COLORS.DONE },
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
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
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

export function TaskGantt({
  tasks,
  onEventClick,
  onEventDrop,
  onEventDelete,
  onEventToggle,
  onAddItem,
  currentUserId,
  currentUserRole,
}: TaskGanttProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  // Valeurs par défaut : zoom 200% et plage quotidienne
  const [ganttZoom, setGanttZoom] = useState(200);
  const [ganttRange, setGanttRange] = useState<'daily' | 'monthly' | 'quarterly'>('daily');

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

  // Scroller le Gantt vers la date du jour (Today) au chargement pour centrer la vue
  useEffect(() => {
    if (ganttRef.current) {
      // Attendre que le Gantt soit complètement rendu avec plusieurs tentatives
      const attemptScroll = (attempt: number = 0) => {
        if (attempt > 5) return; // Maximum 5 tentatives
        
        const ganttContainer = ganttRef.current?.querySelector('.gantt') as HTMLElement;
        if (!ganttContainer) {
          setTimeout(() => attemptScroll(attempt + 1), 200);
          return;
        }

        // Chercher l'élément "Today" dans le DOM
        const allElements = ganttRef.current?.querySelectorAll('*');
        let todayContainerElement: HTMLElement | null = null;

        if (!allElements) {
          return;
        }
        
        for (const el of allElements) {
          // Chercher l'élément qui contient exactement le texte "Today"
          if (el.textContent?.trim() === 'Today' || el.textContent?.includes('Today')) {
            // Trouver l'élément parent qui a le transform (c'est le conteneur positionné)
            let parent = el.parentElement;
            while (parent && parent !== ganttRef.current) {
              const style = window.getComputedStyle(parent);
              // Le conteneur de Today a un transform avec translateX et position absolute
              if (style.transform && style.transform !== 'none' && style.position === 'absolute') {
                todayContainerElement = parent as HTMLElement;
                break;
              }
              parent = parent.parentElement;
            }
            if (todayContainerElement) break;
          }
        }
        
        if (todayContainerElement) {
          // Extraire la position translateX depuis le transform CSS
          const computedStyle = window.getComputedStyle(todayContainerElement);
          const transform = computedStyle.transform;
          
          if (transform && transform !== 'none') {
            try {
              const matrix = new DOMMatrix(transform);
              const translateX = matrix.m41; // m41 correspond à translateX
              
              // Centrer la vue sur "Today" : positionner Today au milieu de la zone visible
              // en tenant compte de la largeur de la sidebar et de la largeur de la fenêtre
              const sidebarWidth = 200; // Largeur approximative de la sidebar
              const viewportWidth = ganttContainer.clientWidth - sidebarWidth;
              const scrollPosition = Math.max(0, translateX - sidebarWidth - (viewportWidth / 2));
              
              ganttContainer.scrollTo({
                left: scrollPosition,
                behavior: attempt === 0 ? 'smooth' : 'auto', // Smooth seulement au premier essai
              });
            } catch (error) {
              // Fallback si DOMMatrix n'est pas supporté
              if (attempt === 0) {
                console.warn('Impossible de calculer la position de Today:', error);
              }
              setTimeout(() => attemptScroll(attempt + 1), 200);
            }
          } else {
            setTimeout(() => attemptScroll(attempt + 1), 200);
          }
        } else {
          setTimeout(() => attemptScroll(attempt + 1), 200);
        }
      };

      // Démarrer le scroll après un court délai initial
      const timeoutId = setTimeout(() => attemptScroll(0), 500);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [ganttRange, ganttZoom, ganttFeatures.length]); // Re-scroll si les features changent ou le zoom/range change

  // Raccourcis clavier pour le zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + "+" ou Ctrl + "=" pour zoomer
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setGanttZoom((prev) => Math.min(400, prev + 25));
      }
      // Ctrl + "-" pour dézoomer
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setGanttZoom((prev) => Math.max(50, prev - 25));
      }
      // Ctrl + "0" pour réinitialiser
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setGanttZoom(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={ganttRef} className="flex flex-col h-[600px] w-full">
      {/* Contrôles Gantt */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Sélecteur de plage */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Plage:</Label>
            <Select value={ganttRange} onValueChange={(value: 'daily' | 'monthly' | 'quarterly') => setGanttRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contrôles de zoom */}
          <div className="flex items-center gap-4 pl-4 border-l">
            <Label className="text-sm font-medium">Zoom:</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGanttZoom(Math.max(50, ganttZoom - 25))}
                disabled={ganttZoom <= 50}
                title="Ctrl + -"
              >
                -
              </Button>
              <span className="text-sm font-medium w-16 text-center">{ganttZoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGanttZoom(Math.min(400, ganttZoom + 25))}
                disabled={ganttZoom >= 400}
                title="Ctrl + +"
              >
                +
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGanttZoom(100)}
              title="Ctrl + 0"
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground hidden sm:block">
          Raccourcis: <kbd className="px-1.5 py-0.5 rounded border bg-background">Ctrl +</kbd> / <kbd className="px-1.5 py-0.5 rounded border bg-background">Ctrl -</kbd> / <kbd className="px-1.5 py-0.5 rounded border bg-background">Ctrl 0</kbd>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <GanttProvider range={ganttRange} zoom={ganttZoom} onAddItem={onAddItem}>
        <GanttSidebar>
          {ganttFeatures.length === 0 ? (
            <GanttSidebarGroup name="Aucune tâche">
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune tâche avec date d'échéance
              </div>
            </GanttSidebarGroup>
          ) : (
            Array.from(featuresByLane.entries()).map(([lane, features]) => (
              <GanttSidebarGroup key={lane} name={lane}>
                {features.map((feature) => (
                  <GanttSidebarItem
                    key={feature.id}
                    feature={feature}
                    onSelectItem={handleSelectItem}
                  />
                ))}
              </GanttSidebarGroup>
            ))
          )}
        </GanttSidebar>

        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {ganttFeatures.length === 0 ? (
              <GanttFeatureListGroup>
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Aucune tâche à afficher
                </div>
              </GanttFeatureListGroup>
            ) : (
              Array.from(featuresByLane.entries()).map(([lane, features]) => (
                <GanttFeatureListGroup key={lane}>
                  {features.map((feature) => {
                    const task = tasksMap.get(feature.id);
                    if (!task) return null;

                    return (
                      <ContextMenu key={feature.id}>
                        <ContextMenuTrigger asChild>
                          <div className="flex w-full" data-feature-id={feature.id}>
                            <button
                              onClick={() => handleSelectItem(feature.id)}
                              type="button"
                              className="w-full"
                            >
                              <GanttFeatureItem
                                {...feature}
                                onMove={handleMove}
                              >
                                {/* Bulle d'indicateur de statut */}
                                <div
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full mr-2",
                                    task?.status === "DONE"
                                      ? "bg-green-500"
                                      : task?.status === "IN_PROGRESS"
                                      ? "bg-blue-500 animate-pulse"
                                      : "bg-gray-400"
                                  )}
                                  title={
                                    task?.status === "DONE"
                                      ? "Terminé"
                                      : task?.status === "IN_PROGRESS"
                                      ? "En cours"
                                      : "À faire"
                                  }
                                />
                                <p className="flex-1 truncate text-xs">
                                  {feature.name}
                                </p>
                                {(() => {
                                  const creator = (task as any).Creator || (task as any).User_Task_createdByToUser;
                                  if (!creator) return null;
                                  
                                  const initials = creator.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase() || "?";
                                  
                                  const color = getAvatarColor(creator.id, creator.name);
                                  
                                  return (
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarImage src={creator.avatar || undefined} alt={creator.name} />
                                      <AvatarFallback className={cn(
                                        "text-[10px] font-medium leading-none flex items-center justify-center",
                                        color.bg,
                                        color.text
                                      )}>
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })()}
                              </GanttFeatureItem>
                            </button>
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
                                  <ContextMenuItem
                                    onClick={() => handleSelectItem(feature.id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </ContextMenuItem>
                                )}
                                {canModify && onEventToggle && (
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
                                {canModify && onEventDelete && (
                                  <>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem
                                      onClick={() => handleDelete(feature.id)}
                                      className="text-destructive"
                                    >
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
                  })}
                </GanttFeatureListGroup>
              ))
            )}
          </GanttFeatureList>
          <GanttToday />
        </GanttTimeline>
      </GanttProvider>
      </div>
    </div>
  );
}
