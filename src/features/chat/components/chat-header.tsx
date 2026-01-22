'use client'

import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Users,
  FolderKanban,
  Search,
  MoreVertical,
  Bell,
  BellOff,
  Info,
  Video,
  ArrowLeft,
  X,
  UserPlus,
  LogOut,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRealtimePresence } from '@/hooks/use-realtime-presence'
import { formatLastSeen, getPresenceLabel } from '@/lib/utils/presence'
import type { Conversation } from '../types/chat.types'

interface ChatHeaderProps {
  conversation: Conversation
  currentUserId: string
  onShowInfo: () => void
  onVideoCall?: () => void
  onToggleMute: () => void
  onBack?: () => void
  isMuted: boolean
  isAdmin: boolean
  // Search props
  showSearch: boolean
  searchQuery: string
  onToggleSearch: () => void
  onSearchQueryChange: (query: string) => void
  // Additional actions
  onManageMembers?: () => void
  onLeaveConversation?: () => void
  onDeleteConversation?: () => void
}

export function ChatHeader({
  conversation,
  currentUserId,
  onShowInfo,
  onVideoCall,
  onToggleMute,
  onBack,
  isMuted,
  isAdmin,
  showSearch,
  searchQuery,
  onToggleSearch,
  onSearchQueryChange,
  onManageMembers,
  onLeaveConversation,
  onDeleteConversation,
}: ChatHeaderProps) {
  const { isUserOnline, getLastSeenAt } = useRealtimePresence()

  const getConversationTitle = () => {
    if (conversation.type === 'DIRECT') {
      const otherUser = conversation.ConversationMember.find(
        (m) => m.User.id !== currentUserId,
      )?.User
      return otherUser?.name || 'Utilisateur inconnu'
    }

    if (conversation.type === 'PROJECT' && conversation.Project) {
      return conversation.Project.name
    }

    return conversation.name || 'Groupe'
  }

  const getOtherUser = () => {
    if (conversation.type !== 'DIRECT') return null
    return conversation.ConversationMember.find((m) => m.User.id !== currentUserId)?.User
  }

  const otherUser = getOtherUser()
  const isOnline = otherUser ? isUserOnline(otherUser.id) : false
  const lastSeen = otherUser ? getLastSeenAt(otherUser.id) : null

  return (
    <div className="relative px-3 sm:px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Back button on mobile + Avatar + Title */}
        <div
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-lg transition-all duration-200"
          onClick={onShowInfo}
        >
          {/* Back button on mobile */}
          {onBack && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onBack()
                    }}
                    className="md:hidden h-8 w-8 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs md:hidden">
                  Retour (Échap)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Avatar */}
          {conversation.type === 'PROJECT' && conversation.Project ? (
            <div
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: conversation.Project.color }}
            >
              <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ) : conversation.type === 'GROUP' || conversation.type === 'CHANNEL' ? (
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <UserAvatar
                      name={getConversationTitle()}
                      avatar={otherUser?.image || otherUser?.avatar}
                      size="md"
                      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 ring-2 ring-background shadow-sm"
                    />
                    {/* Presence indicator */}
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background transition-colors',
                        isOnline ? 'bg-emerald-500' : 'bg-gray-400',
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isOnline ? 'En ligne' : `Hors ligne • ${formatLastSeen(lastSeen)}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Title & Status */}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm sm:text-base truncate">
              {getConversationTitle()}
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {conversation.type === 'DIRECT'
                ? getPresenceLabel(isOnline ? new Date() : lastSeen)
                : `${conversation.ConversationMember.length} membre${
                    conversation.ConversationMember.length > 1 ? 's' : ''
                  }`}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Video call for direct conversations */}
          {onVideoCall && conversation.type === 'DIRECT' && !showSearch && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onVideoCall}
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted/80"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Appel vidéo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Search - Inline input when active */}
          {showSearch ? (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-8 w-[180px] sm:w-[220px] pl-8 pr-8 text-sm bg-background border border-input focus-visible:ring-1 focus-visible:ring-primary/30"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSearch}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSearch}
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted/80"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rechercher</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted/80"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onShowInfo}>
                <Info className="mr-2 h-4 w-4" />
                Informations
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onToggleMute}>
                {isMuted ? (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Activer les notifications
                  </>
                ) : (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    Désactiver les notifications
                  </>
                )}
              </DropdownMenuItem>

              {/* Gérer les membres (canaux/groupes uniquement, admin) */}
              {onManageMembers && conversation.type !== 'DIRECT' && isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onManageMembers}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gérer les membres
                  </DropdownMenuItem>
                </>
              )}

              {/* Quitter / Supprimer */}
              <DropdownMenuSeparator />

              {/* Quitter (si pas admin/créateur, pour groupes/canaux) */}
              {onLeaveConversation && conversation.type !== 'DIRECT' && !isAdmin && (
                <DropdownMenuItem
                  onClick={onLeaveConversation}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Quitter la conversation
                </DropdownMenuItem>
              )}

              {/* Supprimer (admin/créateur ou conversation directe) */}
              {onDeleteConversation && (conversation.type === 'DIRECT' || isAdmin) && (
                <DropdownMenuItem
                  onClick={onDeleteConversation}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer la conversation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
