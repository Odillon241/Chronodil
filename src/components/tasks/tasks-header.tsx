"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TasksHeaderProps {
  onNewTask: () => void;
}

export function TasksHeader({ onNewTask }: TasksHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tâches</h2>
        <p className="text-muted-foreground">
          Gérez les tâches de vos projets.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={onNewTask}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>
    </div>
  );
}
