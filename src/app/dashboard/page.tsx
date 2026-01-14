import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { QuickActions } from "@/components/dashboard/quick-actions";

import { StatsWrapper, ChartWrapper, ActivityWrapper } from "@/components/dashboard/dashboard-wrappers";
import { StatsCardsSkeleton, OverviewChartSkeleton, RecentActivitySkeleton } from "@/components/dashboard/skeletons";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Bienvenue sur Chronodil. Voici ce qui se passe aujourd'hui.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Rapport
          </Button>
        </div>
      </div>

      {/* Barre d'actions rapide */}
      <QuickActions />

      {/* Statistiques principales - Cartes */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsWrapper />
      </Suspense>

      {/* Graphiques */}
      <Suspense fallback={<OverviewChartSkeleton />}>
        <ChartWrapper />
      </Suspense>

      {/* Activité Récente */}
      <section>
        <Suspense fallback={<RecentActivitySkeleton />}>
          <ActivityWrapper />
        </Suspense>
      </section>
    </div>
  );
}
