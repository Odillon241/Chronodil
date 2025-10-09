"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Users, Clock } from "lucide-react";

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  color: string;
  budgetHours?: number | null;
  usedHours?: number;
  members?: Array<{ id: string }>;
}

interface ProjectCardProps {
  project: Project;
  onDetails?: (projectId: string) => void;
  onManage?: (projectId: string) => void;
}

export function ProjectCard({ project, onDetails, onManage }: ProjectCardProps) {
  const progress = project.budgetHours && project.usedHours
    ? (project.usedHours / project.budgetHours) * 100
    : 0;

  const progressColor =
    progress > 90 ? "bg-red-500" : progress > 70 ? "bg-amber-500" : "bg-green-500";

  const remainingHours = project.budgetHours
    ? project.budgetHours - (project.usedHours || 0)
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </CardTitle>
            <CardDescription>{project.code}</CardDescription>
          </div>
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || "Aucune description"}
        </p>

        {project.budgetHours && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-300`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{project.usedHours || 0}h utilisées</span>
              <span>{project.budgetHours}h budget</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{project.members?.length || 0} membres</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {remainingHours !== null ? `${remainingHours}h restantes` : "Pas de budget"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {onDetails && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDetails(project.id)}
            >
              Détails
            </Button>
          )}
          {onManage && (
            <Button
              size="sm"
              className="flex-1 bg-rusty-red hover:bg-ou-crimson"
              onClick={() => onManage(project.id)}
            >
              Gérer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
