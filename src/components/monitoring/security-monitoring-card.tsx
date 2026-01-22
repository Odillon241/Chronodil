'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock, Key, Ban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { SecuritySummary } from '@/types/monitoring'
import { cn } from '@/lib/utils'

interface SecurityMonitoringCardProps {
  security: SecuritySummary | null
  isLoading?: boolean
}

interface SecurityMetricProps {
  label: string
  value: number
  icon: React.ReactNode
  severity: 'normal' | 'warning' | 'danger'
}

function SecurityMetric({ label, value, icon, severity }: SecurityMetricProps) {
  const severityStyles = {
    normal: 'text-muted-foreground',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }

  const bgStyles = {
    normal: 'bg-muted',
    warning: 'bg-amber-100',
    danger: 'bg-red-100',
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded', bgStyles[severity])}>
          <div className={severityStyles[severity]}>{icon}</div>
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <Badge
        variant={severity === 'normal' ? 'secondary' : 'default'}
        className={cn(
          'min-w-[32px] justify-center',
          severity === 'warning' && 'bg-amber-500 hover:bg-amber-600',
          severity === 'danger' && 'bg-red-500 hover:bg-red-600',
        )}
      >
        {value}
      </Badge>
    </div>
  )
}

function SecurityCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-5 w-8 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function SecurityMonitoringCard({ security, isLoading }: SecurityMonitoringCardProps) {
  if (isLoading || !security) {
    return <SecurityCardSkeleton />
  }

  const isSecure =
    security.authFailures === 0 &&
    security.unauthorizedAccess === 0 &&
    security.criticalEvents === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isSecure ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Sécurité
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Alertes sécurité
              </>
            )}
          </CardTitle>
          <Badge variant={isSecure ? 'default' : 'destructive'} className="text-[10px]">
            {isSecure
              ? 'OK'
              : `${security.criticalEvents} alerte${security.criticalEvents > 1 ? 's' : ''}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <SecurityMetric
          label="Échecs connexion"
          value={security.authFailures}
          icon={<Key className="h-3.5 w-3.5" />}
          severity={
            security.authFailures > 5 ? 'danger' : security.authFailures > 0 ? 'warning' : 'normal'
          }
        />
        <SecurityMetric
          label="Rate limits"
          value={security.rateLimitHits}
          icon={<Ban className="h-3.5 w-3.5" />}
          severity={
            security.rateLimitHits > 10
              ? 'danger'
              : security.rateLimitHits > 0
                ? 'warning'
                : 'normal'
          }
        />
        <SecurityMetric
          label="Accès non autorisés"
          value={security.unauthorizedAccess}
          icon={<Lock className="h-3.5 w-3.5" />}
          severity={security.unauthorizedAccess > 0 ? 'danger' : 'normal'}
        />
        <SecurityMetric
          label="Tentatives XSS"
          value={security.xssAttempts}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          severity={security.xssAttempts > 0 ? 'danger' : 'normal'}
        />

        {security.lastSecurityEvent && (
          <div className="pt-3 mt-2 border-t">
            <p className="text-[10px] text-muted-foreground">
              Dernier événement :{' '}
              {formatDistanceToNow(new Date(security.lastSecurityEvent), {
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
