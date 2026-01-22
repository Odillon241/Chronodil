'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Users, Activity, TrendingUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DepartmentStats } from '@/types/monitoring'
import { cn } from '@/lib/utils'

interface DepartmentOverviewGridProps {
  departments: DepartmentStats[]
  isLoading?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function DepartmentCard({ department }: { department: DepartmentStats }) {
  const activityLevel =
    department.eventsLast24h > 50 ? 'high' : department.eventsLast24h > 20 ? 'medium' : 'low'

  const activityConfig = {
    high: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Très actif' },
    medium: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Actif' },
    low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Calme' },
  }

  const config = activityConfig[activityLevel]

  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {department.departmentName}
          </CardTitle>
          <Badge variant="outline" className={cn('text-[10px]', config.color)}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métriques */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-lg font-bold">{department.userCount}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Membres
            </p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-lg font-bold text-emerald-600">{department.activeUsers}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Activity className="h-3 w-3" />
              En ligne
            </p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-lg font-bold">{department.eventsLast24h}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Actions 24h
            </p>
          </div>
        </div>

        {/* Top performers */}
        {department.topPerformers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Top contributeurs
            </h4>
            <div className="space-y-1.5">
              {department.topPerformers.slice(0, 3).map((performer, idx) => (
                <div key={performer.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(performer.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate max-w-[100px]">{performer.userName}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {performer.eventCount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activité récente */}
        {department.recentActivity.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Dernière activité :{' '}
              {formatDistanceToNow(new Date(department.recentActivity[0].createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DepartmentCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-5 w-14 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-2 rounded-md bg-muted/50">
              <div className="h-6 w-8 mx-auto bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-12 mx-auto bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-5 w-8 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DepartmentOverviewGrid({ departments, isLoading }: DepartmentOverviewGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Vue par département
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <DepartmentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (departments.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Vue par département
        </h3>
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Aucun département configuré</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Vue par département
        <Badge variant="secondary" className="ml-2">
          {departments.length}
        </Badge>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <DepartmentCard key={dept.departmentId} department={dept} />
        ))}
      </div>
    </div>
  )
}
