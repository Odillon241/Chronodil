'use client'

import { useState, useMemo } from 'react'
import { Bell, Search, Mail, CheckCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationDetailView } from '@/components/features/notifications/notification-detail-view'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { markAsRead, markAllAsRead, deleteNotification } from '@/actions/notification.actions'
import { toast } from 'sonner'

// Types
interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date | string
  link?: string | null
}

// Helper function: extract user name from message
function extractUserName(message: string): string | null {
  // Pattern: "NOM Prénom a soumis..." or "NOM Prénom-Composé a soumis..."
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

// Helper function: get initials from name
function getInitials(name: string | null): string {
  if (!name) return 'N'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Helper function: get avatar color based on name
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

// Notification Item in sidebar
function NotificationSidebarItem({
  notification,
  isSelected,
  onClick,
}: {
  notification: Notification
  isSelected: boolean
  onClick: () => void
}) {
  const date =
    typeof notification.createdAt === 'string'
      ? new Date(notification.createdAt)
      : notification.createdAt

  const userName = extractUserName(notification.message)
  const _initials = getInitials(userName)
  const _avatarColor = getAvatarColor(userName)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-start gap-3 text-left transition-colors hover:bg-muted/60',
        isSelected && 'bg-muted',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <UserAvatar name={userName || 'Système'} size="md" />

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm truncate flex-1',
              !notification.isRead ? 'font-semibold' : 'font-medium',
            )}
          >
            {notification.title}
          </span>
          {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {userName || notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
        </p>
      </div>
    </button>
  )
}

// Main Client Component
export function NotificationsView({
  initialNotifications,
}: {
  initialNotifications: Notification[]
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isPending, setIsPending] = useState(false)

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matches =
          n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query)
        if (!matches) return false
      }

      // Status filter
      if (filterStatus === 'unread' && n.isRead) return false
      if (filterStatus === 'read' && !n.isRead) return false

      return true
    })
  }, [notifications, searchQuery, filterStatus])

  const selectedNotification = notifications.find((n) => n.id === selectedId)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Handlers
  const handleMarkAsRead = async (id: string) => {
    setIsPending(true)
    try {
      await markAsRead({ id })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
    setIsPending(false)
  }

  const handleMarkAllAsRead = async () => {
    setIsPending(true)
    try {
      await markAllAsRead({})
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success('Toutes les notifications marquées comme lues')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
    setIsPending(false)
  }

  const handleDelete = async (id: string) => {
    setIsPending(true)
    try {
      await deleteNotification({ id })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast.success('Notification supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
    setIsPending(false)
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const notification = notifications.find((n) => n.id === id)
    if (notification && !notification.isRead) {
      handleMarkAsRead(id)
    }
  }

  if (!notifications.length && !searchQuery && filterStatus === 'all') {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed">
        <div className="text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Vous n'avez aucune notification pour le moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-background rounded-lg border">
      {/* Sidebar */}
      <div
        className={cn(
          'flex flex-col border-r bg-background h-full',
          'w-full md:w-[380px] md:min-w-[380px] md:max-w-[380px]',
          selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">Notifications</h2>
              <Badge variant="secondary">{notifications.length}</Badge>
              {unreadCount > 0 && (
                <Badge className="bg-primary hover:bg-primary/90 whitespace-nowrap rounded-full px-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                title="Tout marquer comme lu"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filters */}
          <ToggleGroup
            type="single"
            value={filterStatus}
            onValueChange={(v) => v && setFilterStatus(v)}
            className="w-full bg-muted/50 p-0.5 rounded-lg"
          >
            <ToggleGroupItem value="all" className="flex-1 text-xs data-[state=on]:bg-background">
              Toutes
            </ToggleGroupItem>
            <ToggleGroupItem
              value="unread"
              className="flex-1 text-xs data-[state=on]:bg-background"
            >
              Non lues
            </ToggleGroupItem>
            <ToggleGroupItem value="read" className="flex-1 text-xs data-[state=on]:bg-background">
              Lues
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Notification List */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Aucune notification'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationSidebarItem
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedId === notification.id}
                  onClick={() => handleSelect(notification.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail View */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-muted/20 min-w-0 h-full overflow-hidden',
          selectedId ? 'flex' : 'hidden md:flex',
        )}
      >
        {selectedNotification ? (
          <NotificationDetailView
            notification={selectedNotification}
            onBack={() => setSelectedId(null)}
            onMarkAsRead={() => handleMarkAsRead(selectedNotification.id)}
            onDelete={() => handleDelete(selectedNotification.id)}
            isPending={isPending}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-lg mb-1">Sélectionnez une notification</h3>
              <p className="text-sm text-muted-foreground">
                Cliquez sur une notification pour voir les détails
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
