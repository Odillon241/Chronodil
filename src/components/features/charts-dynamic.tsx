"use client";

/**
 * ⚡ Composants de graphiques en lazy loading
 *
 * Ces composants sont chargés dynamiquement pour réduire le bundle initial.
 * Recharts est une librairie lourde (~150KB), le lazy loading permet de
 * ne la charger que quand les graphiques sont nécessaires.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton de chargement pour les graphiques
function ChartSkeleton({ className = "h-[300px]" }: { className?: string }) {
  return (
    <div className={`w-full ${className} flex items-center justify-center`}>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

// Task Stats Chart - Lazy loaded
export const TaskStatsChart = dynamic(
  () => import("./task-stats-chart").then((mod) => mod.TaskStatsChart),
  {
    loading: () => <ChartSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

// Weekly Activity Chart - Lazy loaded
export const WeeklyActivityChart = dynamic(
  () => import("./weekly-activity-chart").then((mod) => mod.WeeklyActivityChart),
  {
    loading: () => <ChartSkeleton className="h-[200px]" />,
    ssr: false,
  }
);

// Validation Stats Chart - Lazy loaded
export const ValidationStatsChart = dynamic(
  () => import("./validation-stats-chart").then((mod) => mod.ValidationStatsChart),
  {
    loading: () => <ChartSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

// Project Distribution Chart - Lazy loaded
export const ProjectDistributionChart = dynamic(
  () => import("./project-distribution-chart").then((mod) => mod.ProjectDistributionChart),
  {
    loading: () => <ChartSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

// HR Timesheet Stats Chart - Lazy loaded
export const HRTimesheetStatsChart = dynamic(
  () => import("./hr-timesheet-stats-chart").then((mod) => mod.HRTimesheetStatsChart),
  {
    loading: () => <ChartSkeleton className="h-[400px]" />,
    ssr: false,
  }
);
