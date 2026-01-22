'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  Pause,
  Play,
  User,
  Clock,
  Globe,
  ChevronDown,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AuditLogWithUser, ConnectionStatus } from '@/types/monitoring'
import { ACTION_CONFIG, ENTITY_CONFIG } from '@/types/monitoring'

interface ActivityFeedProps {
  events: AuditLogWithUser[]
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  isPaused: boolean
  onTogglePause: () => void
  connectionStatus: ConnectionStatus
  newEventsCount: number
  onShowNewEvents: () => void
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  CREATE_USER: 'Création utilisateur',
  UPDATE_USER: 'Modification utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  LOGIN_FAILED: 'Échec connexion',
  UNAUTHORIZED_ACCESS: 'Accès non autorisé',
  RATE_LIMIT: 'Rate limit',
}

function getActionStyle(action: string) {
  const key = action.toUpperCase().replace(/_.*/g, '')
  return ACTION_CONFIG[key] || { label: action, color: 'text-gray-700', bgColor: 'bg-gray-100' }
}

function ActivityItem({ event }: { event: AuditLogWithUser }) {
  const actionStyle = getActionStyle(event.action)

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5',
          actionStyle.bgColor,
        )}
      >
        <Activity className={cn('h-4 w-4', actionStyle.color)} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cn('text-[10px] h-5', actionStyle.bgColor, actionStyle.color)}>
            {ACTION_LABELS[event.action] || event.action}
          </Badge>
          <span className="text-sm font-medium">{ENTITY_CONFIG[event.entity] || event.entity}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {event.User?.name || 'Système'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(event.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
          {event.ipAddress && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {event.ipAddress}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-border/50">
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({
  events,
  onLoadMore,
  hasMore,
  isLoading,
  isPaused,
  onTogglePause,
  connectionStatus,
  newEventsCount,
  onShowNewEvents,
}: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtTop, setIsAtTop] = useState(true)

  // Auto-scroll quand nouveaux événements et qu'on est en haut
  useEffect(() => {
    if (isAtTop && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [events.length, isAtTop, isPaused])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setIsAtTop(target.scrollTop < 50)
  }, [])

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="py-3 px-4 border-b bg-background/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Flux d'activités</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {events.length}
            </Badge>
            {connectionStatus.connected ? (
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Temps réel</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">{connectionStatus.error || 'Déconnecté'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onTogglePause}
              title={isPaused ? 'Reprendre' : 'Mettre en pause'}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Bouton nouveaux événements */}
      {newEventsCount > 0 && isPaused && (
        <div className="px-4 py-2 bg-primary/10 border-b shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary text-xs gap-2"
            onClick={onShowNewEvents}
          >
            <ChevronDown className="h-3 w-3" />
            {newEventsCount} nouveau{newEventsCount > 1 ? 'x' : ''} événement
            {newEventsCount > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full" onScrollCapture={handleScroll} ref={scrollRef as any}>
          {isLoading && events.length === 0 ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 8 }).map((_, i) => (
                <ActivityItemSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucune activité récente</p>
            </div>
          ) : (
            <div>
              {events.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))}

              {/* Load more */}
              {hasMore && onLoadMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Charger plus'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
