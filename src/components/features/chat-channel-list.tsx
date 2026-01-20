'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Hash,
  Lock,
  Plus,
  Settings,
  Bell,
  BellOff,
  LogOut,
  ChevronDown,
  ChevronRight,
  Trash2,
  Info,
  UserPlus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  leaveConversation,
  deleteConversation,
  toggleMuteConversation,
} from '@/actions/chat.actions'

interface Channel {
  id: string
  type: 'CHANNEL'
  name: string
  description?: string | null
  isPrivate: boolean
  category?: string | null
  topic?: string | null
  purpose?: string | null
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date
  ConversationMember: {
    User: {
      id: string
      name: string
      avatar?: string | null
      image?: string | null
    }
    isMuted?: boolean
    isAdmin?: boolean
  }[]
  Message: {
    id: string
    content: string
    createdAt: Date
    User: {
      id: string
      name: string
    }
  }[]
  unreadCount?: number
}

interface ChatChannelListProps {
  channels: Channel[]
  currentUserId: string
  selectedChannelId?: string
  onSelectChannel: (channelId: string) => void
  onCreateChannel: () => void
  onManageMembers?: (channelId: string) => void
  onChannelInfo?: (channelId: string) => void
  onUpdate?: () => void
}

// Catégories par défaut
const DEFAULT_CATEGORIES = ['Général', 'Projets', 'Équipes', 'Autres']

export function ChatChannelList({
  channels,
  currentUserId,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onManageMembers,
  onChannelInfo,
  onUpdate,
}: ChatChannelListProps) {
  const [_searchQuery, _setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // Grouper les canaux par catégorie
  const channelsByCategory = useMemo(() => {
    const grouped = new Map<string, Channel[]>()

    channels.forEach((channel) => {
      const category = channel.category || 'Autres'
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(channel)
    })

    // S'assurer que les catégories par défaut existent même si vides
    DEFAULT_CATEGORIES.forEach((cat) => {
      if (!grouped.has(cat)) {
        grouped.set(cat, [])
      }
    })

    return grouped
  }, [channels])

  // Filtrer les canaux par recherche
  const _filteredChannels = useMemo(() => {
    if (!_searchQuery) return channels

    const searchLower = _searchQuery.toLowerCase()
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(searchLower) ||
        channel.description?.toLowerCase().includes(searchLower) ||
        channel.topic?.toLowerCase().includes(searchLower),
    )
  }, [channels, _searchQuery])

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleToggleMute = async (channelId: string) => {
    try {
      const result = await toggleMuteConversation({ conversationId: channelId })
      if (result?.data) {
        toast.success(
          result.data.isMuted
            ? 'Notifications désactivées pour ce canal'
            : 'Notifications activées pour ce canal',
        )
        // Rafraîchir la liste des canaux
        if (onUpdate) {
          onUpdate()
        }
      } else {
        toast.error(result?.serverError || 'Erreur lors de la modification des notifications')
      }
    } catch (_error) {
      toast.error('Erreur lors de la modification des notifications')
    }
  }

  const handleLeaveChannel = async (channelId: string, channelName: string) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir quitter le canal "${channelName}" ?\n\n` +
        'Vous ne recevrez plus de notifications de ce canal.',
    )

    if (confirmed) {
      try {
        await leaveConversation({ conversationId: channelId })
        toast.success(`Vous avez quitté #${channelName}`)
        // Rafraîchir la liste des canaux
        if (onUpdate) {
          onUpdate()
        }
      } catch (_error) {
        toast.error('Erreur lors de la sortie du canal')
      }
    }
  }

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    const confirmed = confirm(
      `⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement le canal "${channelName}" ?\n\n` +
        'Cette action est IRRÉVERSIBLE et supprimera :\n' +
        '• Tous les messages du canal\n' +
        '• Tous les membres du canal\n' +
        '• Toutes les pièces jointes\n\n' +
        'Tapez OUI pour confirmer la suppression.',
    )

    if (confirmed) {
      try {
        await deleteConversation({ conversationId: channelId })
        toast.success(`Canal #${channelName} supprimé définitivement`)
        // Rafraîchir la liste des canaux
        if (onUpdate) {
          onUpdate()
        }
      } catch (error: any) {
        toast.error(error?.message || 'Erreur lors de la suppression du canal')
      }
    }
  }

  const canDeleteChannel = (channel: Channel) => {
    // Le créateur ou un admin peut supprimer
    const userMember = channel.ConversationMember.find((m) => m.User.id === currentUserId)
    return channel.createdBy === currentUserId || userMember?.isAdmin === true
  }

  const canManageMembers = (channel: Channel) => {
    // Le créateur ou un admin peut gérer les membres
    const userMember = channel.ConversationMember.find((m) => m.User.id === currentUserId)
    return channel.createdBy === currentUserId || userMember?.isAdmin === true
  }

  const _getChannelMemberCount = (channel: Channel) => {
    return channel.ConversationMember.length
  }

  const _getLastMessage = (channel: Channel) => {
    if (channel.Message.length === 0) return null
    const lastMsg = channel.Message[0]
    const isCurrentUser = lastMsg.User.id === currentUserId
    const prefix = isCurrentUser ? 'Vous: ' : `${lastMsg.User.name}: `
    return prefix + lastMsg.content
  }

  const isUserMuted = (channel: Channel) => {
    const userMember = channel.ConversationMember.find((m) => m.User.id === currentUserId)
    return userMember?.isMuted || false
  }

  const renderChannel = (channel: Channel) => {
    const isSelected = channel.id === selectedChannelId
    const _memberCount = _getChannelMemberCount(channel)
    const isMuted = isUserMuted(channel)

    return (
      <div
        key={channel.id}
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground',
        )}
        onClick={() => onSelectChannel(channel.id)}
      >
        {/* Icône */}
        <span className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}>
          {channel.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
        </span>

        {/* Nom du canal */}
        <span
          className={cn('flex-1 truncate text-sm', isSelected ? 'font-semibold' : 'font-medium')}
        >
          {channel.name}
        </span>

        {/* Indicateurs */}
        <div className="flex items-center gap-1 shrink-0">
          {isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
          {(channel.unreadCount ?? 0) > 0 && (
            <Badge variant="destructive" className="h-4 min-w-[16px] px-1 text-[10px]">
              {channel.unreadCount! > 99 ? '99+' : channel.unreadCount}
            </Badge>
          )}

          {/* Menu contextuel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="h-3 w-3" />
                <span className="sr-only">Paramètres du canal</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Informations du canal */}
              <DropdownMenuItem
                onSelect={() => {
                  if (onChannelInfo) {
                    onChannelInfo(channel.id)
                  } else {
                    // Si pas de handler, sélectionner le canal pour afficher les infos dans le header
                    onSelectChannel(channel.id)
                  }
                }}
              >
                <Info className="mr-2 h-4 w-4" />
                Informations du canal
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Gestion des membres (admin/créateur uniquement) */}
              {canManageMembers(channel) && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (onManageMembers) {
                        onManageMembers(channel.id)
                      } else {
                        // Si pas de handler, sélectionner le canal pour gérer les membres depuis le header
                        onSelectChannel(channel.id)
                      }
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gérer les membres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Notifications */}
              <DropdownMenuItem
                onSelect={() => {
                  handleToggleMute(channel.id)
                }}
              >
                {isMuted ? (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Réactiver les notifications
                  </>
                ) : (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    Désactiver les notifications
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Quitter le canal (tous les membres) */}
              {!canDeleteChannel(channel) && (
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => {
                      handleLeaveChannel(channel.id, channel.name)
                    }, 100)
                  }}
                  className="text-orange-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Quitter le canal
                </DropdownMenuItem>
              )}

              {/* Supprimer le canal (créateur/admin uniquement) */}
              {canDeleteChannel(channel) && (
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => {
                      handleDeleteChannel(channel.id, channel.name)
                    }, 100)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le canal
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-full">
      {/* Header compact */}
      <div className="px-3 py-2 border-b shrink-0 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Canaux
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={onCreateChannel} className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Créer un canal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Channels List par catégorie */}
      <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="py-1">
            {channels.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Hash className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucun canal</p>
                <p className="text-xs mt-1">Créez votre premier canal</p>
              </div>
            ) : (
              // Groupé par catégorie
              Array.from(channelsByCategory.entries()).map(([category, categoryChannels]) => {
                const isCollapsed = collapsedCategories.has(category)

                if (categoryChannels.length === 0) return null

                return (
                  <div key={category} className="mb-1">
                    {/* Catégorie header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-1 w-full px-3 py-1.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">
                        {category}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {categoryChannels.length}
                      </span>
                    </button>

                    {/* Canaux de la catégorie */}
                    {!isCollapsed && (
                      <div className="px-1 space-y-0.5">{categoryChannels.map(renderChannel)}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
