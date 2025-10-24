"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CalendarIcon, KanbanSquareIcon, ListIcon, GanttChartSquareIcon } from "lucide-react";
import { TaskCalendar } from "./task-calendar";
import { TaskKanban } from "./task-kanban";
import { TaskList } from "./task-list";
import { TaskGantt } from "./task-gantt";

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

interface TaskRoadmapProps {
  tasks: Task[];
  onEventClick: (task: Task) => void;
  onEventDrop: (taskId: string, newDate: Date) => Promise<void>;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onDayDoubleClick: (date: Date) => void;
  onEventDelete?: (taskId: string) => Promise<void>;
  onEventToggle?: (task: Task) => Promise<void>;
  onAddItem?: (date: Date) => void;
}

export function TaskRoadmap({
  tasks,
  onEventClick,
  onEventDrop,
  onStatusChange,
  onDayDoubleClick,
  onEventDelete,
  onEventToggle,
  onAddItem,
}: TaskRoadmapProps) {
  const [activeView, setActiveView] = useState("calendar");

  return (
    <Card className="p-4 sm:p-6">
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Gestion des tâches</h2>
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Calendrier</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <KanbanSquareIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-2">
              <GanttChartSquareIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Gantt</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <ListIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Liste</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="mt-0">
          <TaskCalendar
            tasks={tasks}
            onEventClick={onEventClick}
            onEventDrop={onEventDrop}
            onDayDoubleClick={onDayDoubleClick}
            onEventDelete={onEventDelete}
            onEventToggle={onEventToggle}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-0 -mx-4 sm:-mx-6">
          <TaskKanban
            tasks={tasks}
            onEventClick={onEventClick}
            onStatusChange={onStatusChange}
            onEventDelete={onEventDelete}
            onEventToggle={onEventToggle}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-0 -mx-4 sm:-mx-6">
          <TaskGantt
            tasks={tasks}
            onEventClick={onEventClick}
            onEventDrop={onEventDrop}
            onEventDelete={onEventDelete}
            onEventToggle={onEventToggle}
            onAddItem={onAddItem}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <TaskList
            tasks={tasks}
            onEventClick={onEventClick}
            onEventDelete={onEventDelete}
            onEventToggle={onEventToggle}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
