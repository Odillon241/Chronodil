'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useAnalyticsDashboard } from '@/hooks/use-task-analytics'
import { MetricsCard } from '@/components/analytics/metrics-card'
import { ProductivityChart } from '@/components/analytics/productivity-chart'
import { InsightsPanel } from '@/components/analytics/insights-panel'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Clock, TrendingUp, AlertTriangle, Target, Repeat } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: _session } = useSession() as any
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30)

  // Charger toutes les données via le hook optimisé
  const {
    data: dashboard,
    isLoading,
    error,
  } = useAnalyticsDashboard({
    days: selectedPeriod,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">Chargement des analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-destructive">Erreur lors du chargement des analytics</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const { metrics, trends, insights, projectPerformance, period: _period } = dashboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos performances</p>
        </div>

        <Select
          value={selectedPeriod.toString()}
          onValueChange={(value) => setSelectedPeriod(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="60">60 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Tâches totales"
          value={metrics.totalTasks}
          icon={Target}
          description={`${metrics.completedTasks} complétées`}
        />

        <MetricsCard
          title="Taux de complétion"
          value={`${metrics.completionRate.toFixed(1)}%`}
          icon={CheckCircle2}
          trend={{
            value: metrics.completionRate > 70 ? 15 : -5,
            label: 'vs période précédente',
            isPositive: metrics.completionRate > 70,
          }}
        />

        <MetricsCard
          title="Temps moyen"
          value={`${metrics.averageCompletionTime.toFixed(1)}h`}
          icon={Clock}
          description="Délai de résolution"
        />

        <MetricsCard
          title="Tâches en retard"
          value={metrics.overdueTasks}
          icon={AlertTriangle}
          description={
            metrics.averageOverdueDays > 0
              ? `Moy: ${metrics.averageOverdueDays.toFixed(1)} jours`
              : 'Aucune'
          }
          className={metrics.overdueTasks > 0 ? 'border-destructive' : ''}
        />
      </div>

      {/* SLA Compliance */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard
          title="SLA - On Track"
          value={metrics.slaCompliance.onTrack}
          description={`${metrics.slaCompliance.complianceRate.toFixed(1)}% de compliance`}
          className="border-green-200 bg-green-50"
        />

        <MetricsCard
          title="SLA - At Risk"
          value={metrics.slaCompliance.atRisk}
          description="Nécessite attention"
          className="border-yellow-200 bg-yellow-50"
        />

        <MetricsCard
          title="SLA - Breached"
          value={metrics.slaCompliance.breached}
          description="SLA dépassé"
          className="border-red-200 bg-red-50"
        />
      </div>

      {/* Graphique de tendances */}
      <ProductivityChart
        data={trends}
        title={`Tendances (${selectedPeriod} jours)`}
        description="Évolution de votre productivité"
      />

      {/* Tâches récurrentes */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricsCard
          title="Templates récurrents"
          value={metrics.recurringTemplates}
          icon={Repeat}
          description="Tâches automatisées"
        />

        <MetricsCard
          title="Instances créées"
          value={metrics.recurringInstancesCreated}
          icon={TrendingUp}
          description="Pendant cette période"
        />
      </div>

      {/* Insights & Recommandations */}
      <InsightsPanel insights={insights.insights} recommendations={insights.recommendations} />

      {/* Performance par projet */}
      {projectPerformance && projectPerformance.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Performance par Projet</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projectPerformance.map((project) => (
              <MetricsCard
                key={project.projectId}
                title={project.projectName}
                value={`${project.metrics.completionRate.toFixed(1)}%`}
                description={`${project.metrics.completed}/${project.metrics.totalTasks} tâches complétées`}
                trend={{
                  value: project.metrics.completionRate,
                  label: 'taux de complétion',
                  isPositive: project.metrics.completionRate > 70,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
