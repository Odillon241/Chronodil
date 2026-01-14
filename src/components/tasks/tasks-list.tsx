"use client";

import { useMemo, useState } from "react";
import { Edit, Trash2, Circle, CheckCircle, Users, Bell, FolderOpen, ArrowUpDown, ArrowUp, ArrowDown, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { TaskStatusBadge } from "@/components/features/task-status-badge";
import { TaskPriorityBadge } from "@/components/features/task-priority-badge";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedHours?: number;
  dueDate?: Date;
  reminderDate?: Date;
  isActive: boolean;
  isShared: boolean;
  Project?: {
    id: string;
    name: string;
    color?: string;
  };
  User_Task_createdByToUser?: {
    id: string;
  };
  TaskMember?: Array<{
    User: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

interface TasksListProps {
  tasks: Task[];
  currentUserId?: string;
  currentUserRole?: string;
  selectedTasks: Set<string>;
  onSelectTask: (taskId: string) => void;
  onSelectAll: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleActive: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
}

type SortField = "name" | "status" | "priority" | "dueDate" | "project";
type SortDirection = "asc" | "desc";

export function TasksList({
  tasks,
  currentUserId,
  currentUserRole,
  selectedTasks,
  onSelectTask,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleActive,
  onStatusChange,
  onPriorityChange,
}: TasksListProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "priority":
          const priorityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case "dueDate":
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case "project":
          aValue = (a.Project?.name || "").toLowerCase();
          bValue = (b.Project?.name || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortDirection]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/10 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center animate-in fade-in-50">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <FolderOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Aucune tâche trouvée</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Vous n'avez aucune tâche pour le moment. Commencez par en créer une nouvelle.
        </p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-12 px-4">
              <Checkbox
                checked={selectedTasks.size === tasks.length && tasks.length > 0}
                onCheckedChange={onSelectAll}
                className="translate-y-[2px]"
              />
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="-ml-3 h-8 font-medium">
                Tâche
                <SortIcon field="name" />
              </Button>
            </TableHead>
            <TableHead className="w-[140px]">
              <Button variant="ghost" size="sm" onClick={() => handleSort("status")} className="-ml-3 h-8 font-medium">
                Statut
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button variant="ghost" size="sm" onClick={() => handleSort("priority")} className="-ml-3 h-8 font-medium">
                Priorité
                <SortIcon field="priority" />
              </Button>
            </TableHead>
            <TableHead className="w-[180px]">
              <Button variant="ghost" size="sm" onClick={() => handleSort("project")} className="-ml-3 h-8 font-medium">
                Projet
                <SortIcon field="project" />
              </Button>
            </TableHead>
            <TableHead className="w-[140px]">
              <Button variant="ghost" size="sm" onClick={() => handleSort("dueDate")} className="-ml-3 h-8 font-medium">
                Échéance
                <SortIcon field="dueDate" />
              </Button>
            </TableHead>
            <TableHead className="w-[120px] text-center font-medium">Membres</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const isCreator = task.User_Task_createdByToUser?.id === currentUserId;
            const isAdmin = currentUserRole === "ADMIN";
            const canModify = isCreator || isAdmin;

            // Date status logic
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
            const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

            return (
              <ContextMenu key={task.id}>
                <ContextMenuTrigger asChild>
                  <TableRow
                    className={cn(
                      "group border-b transition-all hover:bg-muted/30 cursor-pointer",
                      selectedTasks.has(task.id) && "bg-muted/40"
                    )}
                    onClick={(e) => {
                      // Prevent triggering if clicked on checkbox, dropdowns or buttons
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) return;
                      canModify ? onEdit(task) : null;
                    }}
                  >
                    <TableCell className="px-4 py-3">
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={() => onSelectTask(task.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-medium text-sm transition-colors",
                          !task.isActive && "line-through text-muted-foreground",
                          task.status === "DONE" && "text-muted-foreground"
                        )}>
                          {task.name}
                        </span>
                        {task.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[300px] mt-0.5">
                            {task.description}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {!task.isActive && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-sm bg-muted text-muted-foreground bg-gray-100 dark:bg-gray-800">
                              Archivée
                            </span>
                          )}
                          {task.isShared && (
                            <Users className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        {canModify ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-auto p-0 hover:bg-transparent hover:scale-105 transition-transform">
                                <TaskStatusBadge status={task.status} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Statut</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"].map((status) => (
                                <DropdownMenuItem key={status} onClick={() => onStatusChange(task.id, status as any)}>
                                  <TaskStatusBadge status={status as any} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <TaskStatusBadge status={task.status} />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        {canModify ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-auto p-0 hover:bg-transparent hover:scale-105 transition-transform">
                                <TaskPriorityBadge priority={task.priority} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Priorité</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((priority) => (
                                <DropdownMenuItem key={priority} onClick={() => onPriorityChange(task.id, priority as any)}>
                                  <TaskPriorityBadge priority={priority as any} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <TaskPriorityBadge priority={task.priority} />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {task.Project ? (
                          <>
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-inset ring-black/5 dark:ring-white/10"
                              style={{ backgroundColor: task.Project.color || '#94a3b8' }}
                            />
                            <span className="text-sm text-foreground/80 truncate max-w-[140px] font-medium">
                              {task.Project.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sans projet</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      {task.dueDate ? (
                        <div className={cn(
                          "flex items-center gap-1.5 text-sm",
                          task.status !== "DONE" && isOverdue && "text-destructive font-medium",
                          task.status !== "DONE" && isDueToday && "text-amber-600 dark:text-amber-400 font-medium",
                          !isOverdue && !isDueToday && "text-muted-foreground"
                        )}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(task.dueDate), "dd MMM", { locale: fr })}</span>
                          {task.status !== "DONE" && isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex justify-center -space-x-2 hovered-avatar-stack">
                        {task.TaskMember && task.TaskMember.length > 0 ? (
                          <>
                            {task.TaskMember.slice(0, 3).map((member) => (
                              <Avatar
                                key={member.User.id}
                                className="h-8 w-8 border-2 border-background ring-1 ring-background transition-transform hover:scale-110 hover:z-10 cursor-help"
                                title={member.User.name}
                              >
                                <AvatarImage src={member.User.avatar || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {member.User.name.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {task.TaskMember.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-1 ring-background">
                                +{task.TaskMember.length - 3}
                              </div>
                            )}
                          </>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-dashed text-muted-foreground/50 hover:text-primary hover:border-primary/50" title="Assigner">
                            <Users className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-2">
                      {canModify && (
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {canModify && (
                    <>
                      <ContextMenuItem onClick={() => onEdit(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onToggleActive(task)}>
                        {task.isActive ? (
                          <>
                            <Circle className="h-4 w-4 mr-2" />
                            Archiver
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        )}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
