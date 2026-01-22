'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Wifi,
  WifiOff,
  Database,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ConnectionStatus } from '@/types/monitoring'
import { cn } from '@/lib/utils'

interface SystemHealthCardProps {
  connectionStatus: ConnectionStatus
  onlineUsersCount: number
  lastDataFetch: Date | null
  isLoading?: boolean
}

interface HealthIndicatorProps {
  label: string
  status: 'healthy' | 'warning' | 'error'
  icon: React.ReactNode
  detail?: string
}

function HealthIndicator({ label, status, icon, detail }: HealthIndicatorProps) {
  const statusConfig = {
    healthy: {
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      badge: 'bg-emerald-500',
      label: 'OK',
    },
    warning: {
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      badge: 'bg-amber-500',
      label: 'Dégradé',
    },
    error: {
      color: 'text-red-600',
      bg: 'bg-red-100',
      badge: 'bg-red-500',
      label: 'Erreur',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded', config.bg)}>
          <div className={config.color}>{icon}</div>
        </div>
        <div>
          <span className="text-sm">{label}</span>
          {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <Badge className={cn('text-[10px]', config.badge)}>{config.label}</Badge>
    </div>
  )
}

function SystemHealthSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-28 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-5 w-12 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function SystemHealthCard({
  connectionStatus,
  onlineUsersCount,
  lastDataFetch,
  isLoading,
}: SystemHealthCardProps) {
  if (isLoading) {
    return <SystemHealthSkeleton />
  }

  const overallHealth = connectionStatus.connected
    ? 'healthy'
    : connectionStatus.error
      ? 'error'
      : 'warning'
  const OverallIcon =
    overallHealth === 'healthy' ? CheckCircle2 : overallHealth === 'error' ? XCircle : AlertCircle

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <OverallIcon
              className={cn(
                'h-4 w-4',
                overallHealth === 'healthy' && 'text-emerald-600',
                overallHealth === 'warning' && 'text-amber-600',
                overallHealth === 'error' && 'text-red-600',
              )}
            />
            Santé système
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              overallHealth === 'healthy' && 'border-emerald-500 text-emerald-600',
              overallHealth === 'warning' && 'border-amber-500 text-amber-600',
              overallHealth === 'error' && 'border-red-500 text-red-600',
            )}
          >
            {overallHealth === 'healthy'
              ? 'Opérationnel'
              : overallHealth === 'warning'
                ? 'Dégradé'
                : 'Problème'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <HealthIndicator
          label="Temps réel"
          status={
            connectionStatus.connected
              ? 'healthy'
              : connectionStatus.reconnectAttempts > 0
                ? 'warning'
                : 'error'
          }
          icon={
            connectionStatus.connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )
          }
          detail={
            connectionStatus.connected
              ? connectionStatus.lastConnected
                ? `Connecté ${formatDistanceToNow(connectionStatus.lastConnected, { addSuffix: true, locale: fr })}`
                : 'Connecté'
              : connectionStatus.error || 'Déconnecté'
          }
        />
        <HealthIndicator
          label="Base de données"
          status="healthy"
          icon={<Database className="h-3.5 w-3.5" />}
          detail="Connexion active"
        />
        <HealthIndicator
          label="Sessions actives"
          status="healthy"
          icon={<Users className="h-3.5 w-3.5" />}
          detail={`${onlineUsersCount} utilisateur${onlineUsersCount > 1 ? 's' : ''} en ligne`}
        />

        {lastDataFetch && (
          <div className="pt-3 mt-2 border-t">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Dernière sync :{' '}
              {formatDistanceToNow(lastDataFetch, {
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
