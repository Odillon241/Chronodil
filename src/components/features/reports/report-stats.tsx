'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileText, Calendar, CalendarDays, File } from 'lucide-react'
import type { Report, ReportStats as ReportStatsType } from '@/types/report.types'

interface ReportStatsProps {
  reports: Report[]
}

function calculateStats(reports: Report[]): ReportStatsType {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  return {
    total: reports.length,
    weekly: reports.filter((r) => r.reportType === 'WEEKLY').length,
    monthly: reports.filter((r) => r.reportType === 'MONTHLY').length,
    individual: reports.filter((r) => r.reportType === 'INDIVIDUAL' || r.reportType === null)
      .length,
    byFormat: {
      pdf: reports.filter((r) => r.format === 'pdf').length,
      word: reports.filter((r) => r.format === 'word').length,
      excel: reports.filter((r) => r.format === 'excel').length,
    },
    thisMonth: reports.filter((r) => new Date(r.createdAt) >= startOfMonth).length,
    thisYear: reports.filter((r) => new Date(r.createdAt) >= startOfYear).length,
  }
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export function ReportStats({ reports }: ReportStatsProps) {
  const stats = calculateStats(reports)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={FileText} label="Total rapports" value={stats.total} color="bg-blue-500" />
      <StatCard
        icon={CalendarDays}
        label="Hebdomadaires"
        value={stats.weekly}
        color="bg-green-500"
      />
      <StatCard icon={Calendar} label="Mensuels" value={stats.monthly} color="bg-purple-500" />
      <StatCard icon={File} label="Individuels" value={stats.individual} color="bg-orange-500" />
    </div>
  )
}

export function ReportStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
