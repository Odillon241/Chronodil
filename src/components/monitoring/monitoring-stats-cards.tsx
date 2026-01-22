'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Activity, Users, ShieldAlert, Bell } from 'lucide-react'
import type { MonitoringStats } from '@/types/monitoring'
import { cn } from '@/lib/utils'

interface MonitoringStatsCardsProps {
  stats: MonitoringStats | null
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({ title, value, subtitle, icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full shrink-0',
            iconBgColor,
          )}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold truncate">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="border-2 border-transparent">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-16 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

export function MonitoringStatsCards({ stats, isLoading }: MonitoringStatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Activités (24h)"
        value={stats.eventsLast24h.toLocaleString('fr-FR')}
        subtitle={`${stats.eventsLastHour} cette heure`}
        icon={<Activity className="h-6 w-6" />}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
      />
      <StatCard
        title="Utilisateurs en ligne"
        value={stats.usersOnline}
        subtitle={`sur ${stats.totalUsers} total`}
        icon={<Users className="h-6 w-6" />}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
      />
      <StatCard
        title="Alertes actives"
        value={stats.activeAlerts}
        icon={<Bell className="h-6 w-6" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
      />
      <StatCard
        title="Alertes sécurité"
        value={stats.securityEvents}
        subtitle="dernières 24h"
        icon={<ShieldAlert className="h-6 w-6" />}
        iconBgColor={stats.securityEvents > 0 ? 'bg-red-100' : 'bg-gray-100'}
        iconColor={stats.securityEvents > 0 ? 'text-red-600' : 'text-gray-600'}
      />
    </div>
  )
}
