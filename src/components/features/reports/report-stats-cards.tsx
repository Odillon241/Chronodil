'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileText, CalendarDays, Calendar, File, TrendingUp, FileType } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReportStats {
  total: number
  weekly: number
  monthly: number
  individual: number
  thisMonth: number
  thisYear: number
  byFormat: {
    pdf: number
    word: number
    excel: number
  }
}

interface ReportStatsCardsProps {
  stats: ReportStats
  className?: string
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color: {
    bg: string
    icon: string
    hover: string
  }
}

const StatCard = ({ icon: Icon, label, value, subtitle, trend, color }: StatCardProps) => (
  <Card
    className={cn(
      'relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
      'border-muted/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm',
    )}
  >
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1.5">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium flex items-center gap-0.5',
                  trend.isPositive ? 'text-green-600' : 'text-red-600',
                )}
              >
                <TrendingUp className={cn('h-3 w-3', !trend.isPositive && 'rotate-180')} />
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>}
        </div>

        <div
          className={cn(
            'rounded-xl p-2.5 transition-all duration-300',
            color.bg,
            'group-hover:scale-110',
          )}
        >
          <Icon className={cn('h-5 w-5', color.icon)} />
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none',
          color.hover,
        )}
      />
    </CardContent>
  </Card>
)

export function ReportStatsCards({ stats, className }: ReportStatsCardsProps) {
  // Calculate most used format
  const getMostUsedFormat = () => {
    const formats = [
      { name: 'PDF', count: stats.byFormat.pdf, icon: '📄' },
      { name: 'Word', count: stats.byFormat.word, icon: '📝' },
      { name: 'Excel', count: stats.byFormat.excel, icon: '📊' },
    ]

    const mostUsed = formats.reduce((prev, current) =>
      current.count > prev.count ? current : prev,
    )

    return {
      name: mostUsed.name,
      count: mostUsed.count,
      icon: mostUsed.icon,
    }
  }

  // Calculate trend (simple: compare thisMonth vs average)
  const calculateTrend = (current: number, total: number) => {
    if (total === 0) return null
    const average = total / 12 // Rough monthly average
    const diff = ((current - average) / average) * 100
    return {
      value: Math.round(Math.abs(diff)),
      isPositive: diff >= 0,
    }
  }

  const mostUsedFormat = getMostUsedFormat()
  const monthTrend = calculateTrend(stats.thisMonth, stats.thisYear)

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {/* Total Reports */}
      <StatCard
        icon={FileText}
        label="Total rapports"
        value={stats.total}
        subtitle="Tous types confondus"
        color={{
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          icon: 'text-blue-600 dark:text-blue-400',
          hover: 'hover:bg-blue-500/5',
        }}
      />

      {/* Weekly Reports */}
      <StatCard
        icon={CalendarDays}
        label="Hebdomadaires"
        value={stats.weekly}
        subtitle="Rapports hebdo"
        color={{
          bg: 'bg-green-500/10 dark:bg-green-500/20',
          icon: 'text-green-600 dark:text-green-400',
          hover: 'hover:bg-green-500/5',
        }}
      />

      {/* Monthly Reports */}
      <StatCard
        icon={Calendar}
        label="Mensuels"
        value={stats.monthly}
        subtitle="Rapports mensuels"
        color={{
          bg: 'bg-purple-500/10 dark:bg-purple-500/20',
          icon: 'text-purple-600 dark:text-purple-400',
          hover: 'hover:bg-purple-500/5',
        }}
      />

      {/* Individual Reports */}
      <StatCard
        icon={File}
        label="Individuels"
        value={stats.individual}
        subtitle="Rapports personnels"
        color={{
          bg: 'bg-orange-500/10 dark:bg-orange-500/20',
          icon: 'text-orange-600 dark:text-orange-400',
          hover: 'hover:bg-orange-500/5',
        }}
      />

      {/* This Month */}
      <StatCard
        icon={TrendingUp}
        label="Ce mois-ci"
        value={stats.thisMonth}
        subtitle="Créés ce mois"
        trend={monthTrend || undefined}
        color={{
          bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
          icon: 'text-cyan-600 dark:text-cyan-400',
          hover: 'hover:bg-cyan-500/5',
        }}
      />

      {/* Most Used Format */}
      <StatCard
        icon={FileType}
        label="Format préféré"
        value={mostUsedFormat.count}
        subtitle={`${mostUsedFormat.icon} ${mostUsedFormat.name}`}
        color={{
          bg: 'bg-pink-500/10 dark:bg-pink-500/20',
          icon: 'text-pink-600 dark:text-pink-400',
          hover: 'hover:bg-pink-500/5',
        }}
      />
    </div>
  )
}

/**
 * Loading skeleton for report stats cards
 */
export function ReportStatsCardsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
