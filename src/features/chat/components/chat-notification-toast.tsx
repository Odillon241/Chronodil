'use client'

import { motion } from 'motion/react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { X, Reply } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatNotificationToastProps {
  sender: {
    name: string
    avatar?: string | null
  }
  message: string
  conversationName?: string
  onReply?: () => void
  onDismiss?: () => void
  className?: string
}

/**
 * Toast notification personnalisé pour les nouveaux messages de chat
 * Utilisé pour afficher des notifications élégantes en dehors de l'interface de chat
 */
export function ChatNotificationToast({
  sender,
  message,
  conversationName,
  onReply,
  onDismiss,
  className,
}: ChatNotificationToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      className={cn(
        'bg-background border shadow-lg rounded-lg p-4 max-w-md w-full',
        'flex items-start gap-3',
        className,
      )}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <UserAvatar name={sender.name} avatar={sender.avatar} size="md" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{sender.name}</p>
            {conversationName && (
              <p className="text-xs text-muted-foreground truncate">dans {conversationName}</p>
            )}
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{message}</p>

        {/* Action rapide */}
        {onReply && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onReply}>
            <Reply className="h-3 w-3" />
            Répondre
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Version compacte du toast pour les notifications groupées
 */
export function ChatNotificationToastCompact({
  count,
  latestSender,
  onView,
  onDismiss,
  className,
}: {
  count: number
  latestSender: { name: string; avatar?: string | null }
  onView?: () => void
  onDismiss?: () => void
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn(
        'bg-background border shadow-lg rounded-lg p-3 w-80',
        'flex items-center gap-3',
        className,
      )}
    >
      <UserAvatar name={latestSender.name} avatar={latestSender.avatar} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">
          {count} nouveau{count > 1 ? 'x' : ''} message{count > 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Dernier message de {latestSender.name}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onView && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onView}>
            Voir
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Animation de badge pour le compteur de messages non lus
 */
export function UnreadBadgeAnimation({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
      }}
      className={cn(
        'bg-destructive text-destructive-foreground',
        'rounded-full px-2 py-0.5',
        'text-xs font-semibold',
        'min-w-[20px] text-center',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  )
}
