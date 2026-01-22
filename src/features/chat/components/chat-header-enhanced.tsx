'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Search,
  Phone,
  Video,
  MoreVertical,
  Bell,
  BellOff,
  Users,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatHeaderEnhancedProps {
  conversation: {
    id: string
    type: 'DIRECT' | 'GROUP' | 'PROJECT' | 'CHANNEL'
    name?: string | null
    ConversationMember?: Array<{
      User: {
        id: string
        name: string
        avatar?: string | null
        image?: string | null
        lastSeenAt?: Date | null
      }
      isAdmin?: boolean
    }>
    Project?: {
      name: string
      color: string
    } | null
  }
  currentUserId: string
  isOnline?: boolean
  lastSeenAt?: Date | null
  isMuted?: boolean
  onBack?: () => void
  onSearch?: () => void
  onVoiceCall?: () => void
  onVideoCall?: () => void
  onToggleMute?: () => void
  onShowInfo?: () => void
  onManageMembers?: () => void
  className?: string
}

/**
 * Header de conversation enrichi avec présence en ligne, actions rapides et animations
 */
export function ChatHeaderEnhanced({
  conversation,
  currentUserId,
  isOnline = false,
  lastSeenAt,
  isMuted = false,
  onBack,
  onSearch,
  onVoiceCall,
  onVideoCall,
  onToggleMute,
  onShowInfo,
  onManageMembers,
  className,
}: ChatHeaderEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Récupération des informations de conversation
  const getConversationInfo = () => {
    if (conversation.type === 'DIRECT') {
      const otherUser = conversation.ConversationMember?.find(
        (m) => m.User.id !== currentUserId,
      )?.User
      return {
        name: otherUser?.name || 'Utilisateur',
        avatar: otherUser?.avatar || otherUser?.image,
        subtitle: isOnline
          ? 'En ligne'
          : lastSeenAt
            ? `Vu ${formatDistanceToNow(lastSeenAt, { addSuffix: true, locale: fr })}`
            : 'Hors ligne',
        showPresence: true,
      }
    }

    if (conversation.type === 'PROJECT' && conversation.Project) {
      const memberCount = conversation.ConversationMember?.length || 0
      return {
        name: conversation.Project.name,
        avatar: null,
        subtitle: `${memberCount} membre${memberCount > 1 ? 's' : ''}`,
        showPresence: false,
        color: conversation.Project.color,
      }
    }

    if (conversation.type === 'CHANNEL') {
      const memberCount = conversation.ConversationMember?.length || 0
      return {
        name: conversation.name || 'Canal',
        avatar: null,
        subtitle: `${memberCount} membre${memberCount > 1 ? 's' : ''}`,
        showPresence: false,
      }
    }

    const memberCount = conversation.ConversationMember?.length || 0
    return {
      name: conversation.name || 'Groupe',
      avatar: null,
      subtitle: `${memberCount} membre${memberCount > 1 ? 's' : ''}`,
      showPresence: false,
    }
  }

  const info = getConversationInfo()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'px-4 py-3 flex items-center gap-3',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bouton retour (mobile) */}
      {onBack && (
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Avatar et informations */}
      <button
        onClick={onShowInfo}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="relative shrink-0">
          <UserAvatar
            name={info.name}
            avatar={info.avatar}
            size="md"
            className={info.color ? `bg-${info.color}` : ''}
          />
          {info.showPresence && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600',
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm sm:text-base truncate">{info.name}</h2>
            {isMuted && (
              <Badge variant="secondary" className="h-5 px-1.5 gap-1">
                <BellOff className="h-3 w-3" />
                <span className="text-[10px] hidden sm:inline">Muet</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{info.subtitle}</p>
        </div>
      </button>

      {/* Actions rapides */}
      <AnimatePresence>
        <motion.div
          className="flex items-center gap-1 shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          {/* Recherche */}
          {onSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearch}
              className={cn('h-9 w-9 transition-all duration-200', isHovered && 'bg-muted')}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Appel vocal (conversations directes) */}
          {conversation.type === 'DIRECT' && onVoiceCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoiceCall}
              className={cn(
                'h-9 w-9 transition-all duration-200 hidden sm:flex',
                isHovered && 'bg-muted',
              )}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}

          {/* Appel vidéo (conversations directes) */}
          {conversation.type === 'DIRECT' && onVideoCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className={cn(
                'h-9 w-9 transition-all duration-200 hidden sm:flex',
                isHovered && 'bg-muted',
              )}
            >
              <Video className="h-4 w-4" />
            </Button>
          )}

          {/* Mute/Unmute */}
          {onToggleMute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              className={cn(
                'h-9 w-9 transition-all duration-200 hidden sm:flex',
                isHovered && 'bg-muted',
              )}
            >
              {isMuted ? (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Gérer les membres (groupes/canaux) */}
          {conversation.type !== 'DIRECT' && onManageMembers && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onManageMembers}
              className={cn(
                'h-9 w-9 transition-all duration-200 hidden sm:flex',
                isHovered && 'bg-muted',
              )}
            >
              <Users className="h-4 w-4" />
            </Button>
          )}

          {/* Info */}
          {onShowInfo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowInfo}
              className={cn('h-9 w-9 transition-all duration-200', isHovered && 'bg-muted')}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}

          {/* Menu contextuel (mobile) */}
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </motion.div>
      </AnimatePresence>
    </motion.header>
  )
}
