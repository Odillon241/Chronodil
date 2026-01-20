'use client'

import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Trash2,
  CheckCheck,
  Calendar,
  Clock,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date | string
  link?: string | null
}

interface NotificationDetailViewProps {
  notification: Notification
  onBack: () => void
  onMarkAsRead: () => void
  onDelete: () => void
  isPending?: boolean
}

// Helper helpers (duplicated from page.tsx for consistency, ideally should be in specific utils)
function extractUserName(message: string): string | null {
  const patterns = [
    /^([A-Z][A-Z-]+ [A-Za-zÀ-ÿ-]+) a soumis/,
    /^([A-Z][A-Z-]+ [A-Za-zÀ-ÿ-]+ [A-Za-zÀ-ÿ-]+) a soumis/,
    /^([A-Za-zÀ-ÿ-]+ [A-Za-zÀ-ÿ-]+) /,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

function getInitials(name: string | null): string {
  if (!name) return 'N'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string | null): string {
  if (!name) return 'bg-gray-500'
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    default:
      return <Info className="h-5 w-5 text-blue-500" />
  }
}

export function NotificationDetailView({
  notification,
  onBack,
  onMarkAsRead,
  onDelete,
  isPending,
}: NotificationDetailViewProps) {
  const date =
    typeof notification.createdAt === 'string'
      ? new Date(notification.createdAt)
      : notification.createdAt

  const userName = extractUserName(notification.message)
  const _initials = getInitials(userName)
  const _avatarColor = getAvatarColor(userName)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detail Header */}
      <div className="p-4 border-b bg-background/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMarkAsRead}
                disabled={isPending}
                title="Marquer comme lu"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isPending}
              title="Supprimer"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground hidden sm:block">
          {format(date, 'd MMMM yyyy à HH:mm', { locale: fr })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <UserAvatar
              name={userName || 'Système'}
              size="2xl"
              className="h-16 w-16 text-lg shrink-0"
            />
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">{notification.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{userName || 'Système'}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(date, 'd MMMM yyyy', { locale: fr })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(date, 'HH:mm', { locale: fr })}
                </span>
                <Badge variant="outline" className="ml-2 gap-1 font-normal">
                  {getTypeIcon(notification.type)}
                  <span className="capitalize">{notification.type || 'Info'}</span>
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Message Body */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{notification.message}</p>
          </div>

          {/* Action Button */}
          {notification.link && (
            <div className="pt-4">
              <Button asChild className="gap-2">
                <a href={notification.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Voir le contenu associé
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
