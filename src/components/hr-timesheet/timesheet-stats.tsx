"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";

interface Activity {
  status: "IN_PROGRESS" | "COMPLETED";
  totalHours?: number;
}

interface TimesheetStatsProps {
  activities: Activity[];
}

export function TimesheetStats({ activities }: TimesheetStatsProps) {
  const totalActivities = activities.length;
  const inProgressCount = activities.filter((a) => a.status === "IN_PROGRESS").length;
  const completedCount = activities.filter((a) => a.status === "COMPLETED").length;
  const totalHours = activities.reduce((sum, activity) => sum + (activity.totalHours || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Nombre total d'activités */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total activités
              </p>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalActivities}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalActivities > 1 ? "tâches" : "tâche"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* En cours */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                En cours
              </p>
              <Badge
                variant="secondary"
                className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                <span className="text-xs">{inProgressCount}</span>
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {inProgressCount}
              </p>
              <p className="text-sm text-muted-foreground">actives</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terminées */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Terminées
              </p>
              <Badge
                variant="secondary"
                className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900"
              >
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  ✓
                </span>
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </p>
              <p className="text-sm text-muted-foreground">complètes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total heures */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total heures
              </p>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary">{totalHours}</p>
              <p className="text-sm text-muted-foreground">heures</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
