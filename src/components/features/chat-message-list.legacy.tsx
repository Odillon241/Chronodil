'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  Users,
  FolderKanban,
  Reply,
  X,
  Search,
  Smile,
  Paperclip,
  File,
  Image as ImageIcon,
  Bell,
  BellOff,
  Info,
  Pin,
  PinOff,
  AtSign,
  MessageSquare,
  Video,
  Star,
  StarOff,
  UserPlus,
  LogOut,
  Archive,
  Settings,
  Calendar,
  Hash,
  Lock,
  Globe,
  BarChart3,
  Clock,
  Shield,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { ChatAttachmentViewer } from './chat-attachment-viewer'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  sendMessage,
  sendMessageWithThread,
  updateMessage,
  deleteMessage,
  markAsRead,
  toggleReaction,
  pinMessage,
  unpinMessage,
  toggleMuteConversation,
  updateChannel,
} from '@/actions/chat.actions'
import { useRealtimePresence } from '@/hooks/use-realtime-presence'
import { useRealtimeTyping } from '@/hooks/use-realtime-typing'
import { formatLastSeen, getPresenceLabel } from '@/lib/utils/presence'
import { LinkPreview } from './link-preview'
import { EmojiPicker, QuickEmojiPicker } from '@/components/ui/emoji-picker'
import { ChatManageMembersDialog } from './chat-manage-members-dialog'

interface Message {
  id: string
  content: string
  isEdited: boolean
  isDeleted: boolean
  attachments?: any
  createdAt: Date
  reactions?: Record<string, string[]> | null
  pinnedAt?: Date | null
  pinnedById?: string | null
  threadId?: string | null
  threadCount?: number
  isThreadRoot?: boolean
  User: {
    id: string
    name: string
    avatar?: string | null
    image?: string | null
  }
  Message?: {
    id: string
    content: string
    senderId: string
    User: {
      id: string
      name: string
    }
  } | null
}

interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP' | 'PROJECT' | 'CHANNEL'
  name?: string | null
  description?: string | null
  topic?: string | null
  purpose?: string | null
  category?: string | null
  isPrivate?: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string | null
  User?: {
    id: string
    name: string
    email: string
    avatar?: string | null
    image?: string | null
  } | null
  ConversationMember: {
    isAdmin: boolean
    isMuted?: boolean
    User: {
      id: string
      name: string
      email: string
      avatar?: string | null
      image?: string | null
      role?: string | null
    }
  }[]
  Project?: {
    id: string
    name: string
    code: string
    color: string
  } | null
  Message: Message[]
  _count?: {
    Message: number
    ConversationMember: number
  }
}

interface ChatMessageListProps {
  conversation: Conversation
  currentUserId: string
  currentUserName?: string
  onUpdate: () => void
  onThreadClick?: (threadId: string) => void
  onVideoCall?: () => void
  onDeleteConversation?: (conversationId: string) => void
  onLeaveConversation?: (conversationId: string) => void
  openInfoOnMount?: boolean
  openManageMembersOnMount?: boolean
  onInfoOpened?: () => void
  onManageMembersOpened?: () => void
}

export function ChatMessageList({
  conversation,
  currentUserId,
  currentUserName = 'Utilisateur',
  onUpdate,
  onThreadClick,
  onVideoCall,
  onDeleteConversation,
  onLeaveConversation,
  openInfoOnMount = false,
  openManageMembersOnMount = false,
  onInfoOpened,
  onManageMembersOpened,
}: ChatMessageListProps) {
  const [message, setMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string>('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionCursorPosition, setMentionCursorPosition] = useState<number>(0)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isMuted, setIsMuted] = useState(() => {
    const member = conversation.ConversationMember.find((m) => m.User.id === currentUserId)
    return member?.isMuted || false
  })
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [isEditingChannel, setIsEditingChannel] = useState(false)
  const [editChannelName, setEditChannelName] = useState('')
  const [editChannelDescription, setEditChannelDescription] = useState('')
  const [editChannelTopic, setEditChannelTopic] = useState('')
  const [editChannelPurpose, setEditChannelPurpose] = useState('')
  const [editChannelCategory, setEditChannelCategory] = useState('')
  const [savingChannel, setSavingChannel] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // TODO: Implémenter useFavoriteMessages (hook manquant)
  const toggleFavorite = (_messageId: string) => console.warn('useFavoriteMessages not implemented')
  const isFavorite = (_messageId: string) => false

  // Vérifier si l'utilisateur actuel est admin de la conversation
  const isCurrentUserAdmin = conversation.ConversationMember.find(
    (m) => m.User.id === currentUserId,
  )?.isAdmin

  // Hook de présence en temps réel
  const { isUserOnline, getLastSeenAt } = useRealtimePresence()

  // Hook d'indicateur de frappe en temps réel
  const { typingUsers, onTyping, stopTyping } = useRealtimeTyping({
    conversationId: conversation.id,
    currentUserId,
    currentUserName,
  })

  // Liste des membres pour les mentions
  const conversationMembers = useMemo(() => {
    return conversation.ConversationMember.filter((m) => m.User.id !== currentUserId).map((m) => ({
      id: m.User.id,
      name: m.User.name,
      avatar: m.User.avatar || m.User.image,
    }))
  }, [conversation.ConversationMember, currentUserId])

  // Filtrer les membres pour les mentions
  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return conversationMembers
    return conversationMembers.filter((m) =>
      m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
    )
  }, [conversationMembers, mentionQuery])

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Fonction pour extraire les URLs d'un texte
  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.match(urlRegex) || []
  }

  // Clé localStorage pour le brouillon
  const getDraftKey = () => `chat-draft-${conversation.id}`

  // Sauvegarder le brouillon dans localStorage
  const saveDraft = (text: string) => {
    if (text.trim()) {
      localStorage.setItem(getDraftKey(), text)
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000) // Afficher l'indicateur pendant 2s
    } else {
      localStorage.removeItem(getDraftKey())
      setDraftSaved(false)
    }
  }

  // Restaurer le brouillon au chargement de la conversation
  useEffect(() => {
    const draft = localStorage.getItem(getDraftKey())
    if (draft) {
      setMessage(draft)
    }

    // Cleanup: sauvegarder le brouillon au démontage
    return () => {
      if (message.trim()) {
        localStorage.setItem(getDraftKey(), message)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]) // Se déclenche quand la conversation change

  // Sauvegarder automatiquement le brouillon toutes les 2 secondes pendant la frappe

  useEffect(() => {
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current)
    }

    draftTimeoutRef.current = setTimeout(() => {
      saveDraft(message)
    }, 2000)

    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current)
      }
    }
  }, [message])

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation.Message])

  // Marquer comme lu quand on ouvre la conversation
  useEffect(() => {
    markAsRead({ conversationId: conversation.id })
  }, [conversation.id])

  // Ouvrir le dialogue d'infos si demandé depuis l'extérieur
  useEffect(() => {
    if (openInfoOnMount) {
      setShowConversationInfo(true)
      onInfoOpened?.()
    }
  }, [openInfoOnMount, onInfoOpened])

  // Ouvrir le dialogue de gestion des membres si demandé depuis l'extérieur
  useEffect(() => {
    if (openManageMembersOnMount) {
      setShowManageMembers(true)
      onManageMembersOpened?.()
    }
  }, [openManageMembersOnMount, onManageMembersOpened])

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return

    setSending(true)
    try {
      let attachmentsData = []

      // Upload des fichiers si il y en a
      if (attachments.length > 0) {
        const formData = new FormData()
        attachments.forEach((file) => {
          formData.append('files', file)
        })

        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Erreur lors de l'upload des fichiers")
        }

        const uploadResult = await uploadResponse.json()
        attachmentsData = uploadResult.files || []
        console.log('📤 Fichiers uploadés, données reçues du serveur:', attachmentsData)
      }

      console.log('💬 Envoi du message avec attachments:', attachmentsData)

      // Utiliser sendMessageWithThread si on répond à un message (pour gérer les threads)
      const result = replyingTo
        ? await sendMessageWithThread({
            conversationId: conversation.id,
            content: message.trim() || '(Fichier joint)',
            replyToId: replyingTo.id,
            attachments: attachmentsData.length > 0 ? attachmentsData : undefined,
          })
        : await sendMessage({
            conversationId: conversation.id,
            content: message.trim() || '(Fichier joint)',
            replyToId: undefined,
            attachments: attachmentsData.length > 0 ? attachmentsData : undefined,
          })

      if (result?.data) {
        setMessage('')
        setReplyingTo(null)
        setAttachments([])
        // Supprimer le brouillon après l'envoi réussi
        localStorage.removeItem(getDraftKey())
        setDraftSaved(false)
        onUpdate()
        toast.success('Message envoyé')
      } else {
        toast.error(result?.serverError || "Erreur lors de l'envoi")
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return

    try {
      const result = await updateMessage({
        messageId,
        content: editingContent.trim(),
      })

      if (result?.data) {
        setEditingMessageId(null)
        setEditingContent('')
        onUpdate()
        toast.success('Message modifié')
      } else {
        toast.error(result?.serverError || 'Erreur lors de la modification')
      }
    } catch (_error) {
      toast.error('Erreur lors de la modification du message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return

    try {
      const result = await deleteMessage({ messageId })

      if (result?.data) {
        onUpdate()
        toast.success('Message supprimé')
      } else {
        toast.error(result?.serverError || 'Erreur lors de la suppression')
      }
    } catch (_error) {
      toast.error('Erreur lors de la suppression du message')
    }
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const result = await toggleReaction({ messageId, emoji })

      if (result?.data) {
        onUpdate()
      } else {
        toast.error(result?.serverError || 'Erreur')
      }
    } catch (_error) {
      toast.error("Erreur lors de l'ajout de la réaction")
    }
  }

  const handleToggleMute = async () => {
    try {
      const result = await toggleMuteConversation({ conversationId: conversation.id })
      if (result?.data) {
        setIsMuted(result.data.isMuted)
        toast.success(
          result.data.isMuted
            ? 'Notifications désactivées pour cette conversation'
            : 'Notifications activées pour cette conversation',
        )
        onUpdate()
      } else {
        toast.error(result?.serverError || 'Erreur lors de la modification des notifications')
      }
    } catch (_error) {
      toast.error('Erreur lors de la modification des notifications')
    }
  }

  // Gérer l'insertion d'une mention
  const handleInsertMention = useCallback(
    (userId: string, userName: string) => {
      if (!inputRef.current) return

      const input = inputRef.current
      const cursorPos = input.selectionStart || 0
      const textBefore = message.substring(0, mentionCursorPosition)
      const textAfter = message.substring(cursorPos)

      // Insérer la mention au format @[userId:userName]
      const mention = `@[${userId}:${userName}] `
      const newMessage = textBefore + mention + textAfter

      setMessage(newMessage)
      setShowMentions(false)
      setMentionQuery('')

      // Replacer le curseur après la mention
      setTimeout(() => {
        const newCursorPos = textBefore.length + mention.length
        input.focus()
        input.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [message, mentionCursorPosition],
  )

  // Détecter quand l'utilisateur tape @ pour les mentions
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const cursorPos = e.target.selectionStart || 0
      setMessage(value)
      onTyping() // Notifier qu'on est en train d'écrire

      // Détecter les mentions
      const textBeforeCursor = value.substring(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
        // Vérifier qu'il n'y a pas d'espace après @
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('[')) {
          setShowMentions(true)
          setMentionQuery(textAfterAt)
          setMentionCursorPosition(lastAtIndex)
          return
        }
      }

      setShowMentions(false)
      setMentionQuery('')
    },
    [onTyping],
  )

  // Fonction pour rendre le contenu avec les mentions
  const renderMessageContent = (content: string) => {
    // Regex pour détecter les mentions @[userId:username]
    const mentionRegex = /@\[([^\]]+):([^\]]+)\]/g
    const parts = content.split(mentionRegex)

    const result = []
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Texte normal
        result.push(parts[i])
      } else if (i % 3 === 1) {
        // userId (on le saute)
        continue
      } else {
        // username (on l'affiche comme mention)
        result.push(
          <span
            key={i}
            className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded font-medium"
          >
            @{parts[i]}
          </span>,
        )
      }
    }

    return result.length > 0 ? result : content
  }

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

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    }
    if (isYesterday(date)) {
      return 'Hier ' + format(date, 'HH:mm')
    }
    return format(date, 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''

    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.createdAt), 'yyyy-MM-dd')
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({
          date: msgDate,
          messages: [msg],
        })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return "Aujourd'hui"
    if (isYesterday(date)) return 'Hier'
    return format(date, 'dd MMMM yyyy', { locale: fr })
  }

  // Séparer les messages épinglés des messages normaux
  const pinnedMessages = conversation.Message.filter((msg) => msg.pinnedAt).sort(
    (a, b) => new Date(a.pinnedAt!).getTime() - new Date(b.pinnedAt!).getTime(),
  )

  // Filtrer les messages selon la recherche
  const filteredMessages = searchQuery
    ? conversation.Message.filter(
        (msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.User.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversation.Message

  const messageGroups = groupMessagesByDate(filteredMessages)

  // Gérer l'épinglage d'un message
  const handlePinMessage = async (messageId: string) => {
    try {
      const result = await pinMessage({
        messageId,
        conversationId: conversation.id,
      })

      if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.success('Message épinglé')
        onUpdate()
      }
    } catch (_error) {
      toast.error("Erreur lors de l'épinglage du message")
    }
  }

  // Gérer le désépinglage d'un message
  const handleUnpinMessage = async (messageId: string) => {
    try {
      const result = await unpinMessage({ messageId })

      if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.success('Message désépinglé')
        onUpdate()
      }
    } catch (_error) {
      toast.error('Erreur lors du désépinglage du message')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors"
          onClick={() => setShowConversationInfo(true)}
        >
          {conversation.type === 'PROJECT' && conversation.Project ? (
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: conversation.Project.color }}
            >
              <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ) : conversation.type === 'GROUP' ? (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <UserAvatar
                      name={getConversationTitle()}
                      avatar={
                        conversation.ConversationMember.find((m) => m.User.id !== currentUserId)
                          ?.User.image ||
                        conversation.ConversationMember.find((m) => m.User.id !== currentUserId)
                          ?.User.avatar
                      }
                      size="md"
                      className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
                    />
                    {/* Badge de présence */}
                    {(() => {
                      const otherUser = conversation.ConversationMember.find(
                        (m) => m.User.id !== currentUserId,
                      )?.User
                      if (!otherUser) return null
                      const online = isUserOnline(otherUser.id)
                      return (
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                            online ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600',
                          )}
                        />
                      )
                    })()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {(() => {
                      const otherUser = conversation.ConversationMember.find(
                        (m) => m.User.id !== currentUserId,
                      )?.User
                      if (!otherUser) return null
                      const online = isUserOnline(otherUser.id)
                      const lastSeen = getLastSeenAt(otherUser.id)
                      return online ? 'En ligne' : `Hors ligne • ${formatLastSeen(lastSeen)}`
                    })()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm sm:text-base truncate">
              {getConversationTitle()}
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {conversation.type === 'DIRECT'
                ? (() => {
                    const otherUser = conversation.ConversationMember.find(
                      (m) => m.User.id !== currentUserId,
                    )?.User
                    if (!otherUser) return null
                    return getPresenceLabel(
                      isUserOnline(otherUser.id) ? new Date() : getLastSeenAt(otherUser.id),
                    )
                  })()
                : `${conversation.ConversationMember.length} membre${conversation.ConversationMember.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onVideoCall && conversation.type === 'DIRECT' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className="h-8 w-8 sm:h-10 sm:w-10"
              title="Appel vidéo"
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Paramètres du canal</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setShowConversationInfo(true)}>
                <Info className="mr-2 h-4 w-4" />
                {conversation.type === 'CHANNEL'
                  ? 'Informations du canal'
                  : 'Informations de la conversation'}
              </DropdownMenuItem>

              {isCurrentUserAdmin &&
                (conversation.type === 'GROUP' ||
                  conversation.type === 'CHANNEL' ||
                  conversation.type === 'PROJECT') && (
                  <DropdownMenuItem onSelect={() => setShowManageMembers(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gérer les membres
                  </DropdownMenuItem>
                )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault() // Empêcher la fermeture immédiate pour voir le toast
                  handleToggleMute()
                }}
              >
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

              {(conversation.type === 'CHANNEL' || conversation.type === 'GROUP') && (
                <>
                  <DropdownMenuSeparator />
                  {!isCurrentUserAdmin && onLeaveConversation && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => {
                        setTimeout(() => {
                          if (confirm('Voulez-vous vraiment quitter ce canal ?')) {
                            onLeaveConversation(conversation.id)
                          }
                        }, 100)
                      }}
                    >
                      <Reply className="mr-2 h-4 w-4 rotate-180" />
                      Quitter le canal
                    </DropdownMenuItem>
                  )}

                  {isCurrentUserAdmin && onDeleteConversation && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => {
                        setTimeout(() => {
                          if (
                            confirm(
                              'Voulez-vous vraiment supprimer ce canal ? Cette action est irréversible.',
                            )
                          ) {
                            onDeleteConversation(conversation.id)
                          }
                        }, 100)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer le canal
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="p-3 border-b bg-muted/50">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les messages..."
              className="pl-9 h-10 w-full"
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredMessages.length} résultat{filteredMessages.length > 1 ? 's' : ''} trouvé
              {filteredMessages.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Pinned Messages Section */}
      {pinnedMessages.length > 0 && (
        <div className="border-b bg-amber-50 dark:bg-amber-950/20">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
              <Pin className="h-4 w-4" />
              <span>Messages épinglés ({pinnedMessages.length}/3)</span>
            </div>
            <div className="space-y-2">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-start gap-2 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {msg.User.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {msg.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleUnpinMessage(msg.id)}
                  >
                    <PinOff className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-2 sm:p-4" ref={scrollRef}>
        <div className="space-y-4 sm:space-y-6">
          {messageGroups.map((group) => (
            <div key={group.date} className="space-y-3 sm:space-y-4">
              {/* Date Separator */}
              <div className="flex items-center justify-center">
                <div className="bg-muted px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs text-muted-foreground">
                  {getDateLabel(group.date)}
                </div>
              </div>

              {/* Messages of the day */}
              {group.messages.map((msg) => {
                const isCurrentUser = msg.User.id === currentUserId
                const isEditing = editingMessageId === msg.id

                return (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2 sm:gap-3', isCurrentUser && 'flex-row-reverse')}
                  >
                    {/* Avatar */}
                    {!isCurrentUser && (
                      <UserAvatar
                        name={msg.User.name}
                        avatar={msg.User.image || msg.User.avatar}
                        size="sm"
                        className="h-6 w-6 sm:h-8 sm:w-8 shrink-0"
                      />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        'flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]',
                        isCurrentUser && 'items-end',
                      )}
                    >
                      {!isCurrentUser && (
                        <span className="text-[10px] sm:text-xs font-medium">{msg.User.name}</span>
                      )}

                      <div className="relative group">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditMessage(msg.id)
                                } else if (e.key === 'Escape') {
                                  setEditingMessageId(null)
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleEditMessage(msg.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div
                              className={cn(
                                'px-3 py-2 sm:px-4 rounded-2xl',
                                isCurrentUser ? 'bg-primary text-white' : 'bg-muted',
                                msg.isDeleted && 'italic opacity-70',
                              )}
                            >
                              {/* Reply preview */}
                              {msg.Message && (
                                <div
                                  className={cn(
                                    'mb-2 pb-2 border-b text-[10px] sm:text-xs opacity-80',
                                    isCurrentUser ? 'border-white/30' : 'border-border',
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <Reply className="h-3 w-3" />
                                    <span className="font-medium">{msg.Message.User?.name}</span>
                                  </div>
                                  <p className="truncate mt-1">{msg.Message.content}</p>
                                </div>
                              )}

                              <div className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word">
                                {renderMessageContent(msg.content)}
                              </div>

                              {/* Attachments */}
                              {msg.attachments &&
                                Array.isArray(msg.attachments) &&
                                msg.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {msg.attachments.map((attachment: any, idx: number) => {
                                      console.log("🖼️ Affichage de l'attachement:", attachment)
                                      return (
                                        <ChatAttachmentViewer
                                          key={idx}
                                          attachment={attachment}
                                          isCurrentUser={isCurrentUser}
                                        />
                                      )
                                    })}
                                  </div>
                                )}

                              {/* Link Previews */}
                              {!msg.isDeleted && extractUrls(msg.content).length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {extractUrls(msg.content).map((url, idx) => (
                                    <LinkPreview key={`${msg.id}-url-${idx}`} url={url} />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {!msg.isDeleted && (
                              <div
                                className={cn(
                                  'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex',
                                  isCurrentUser ? '-left-12' : '-right-12',
                                )}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                      <Reply className="mr-2 h-4 w-4" />
                                      Répondre
                                    </DropdownMenuItem>
                                    {msg.pinnedAt ? (
                                      <DropdownMenuItem onClick={() => handleUnpinMessage(msg.id)}>
                                        <PinOff className="mr-2 h-4 w-4" />
                                        Désépingler
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handlePinMessage(msg.id)}>
                                        <Pin className="mr-2 h-4 w-4" />
                                        Épingler
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => toggleFavorite(msg.id)}>
                                      {isFavorite(msg.id) ? (
                                        <>
                                          <StarOff className="mr-2 h-4 w-4" />
                                          Retirer des favoris
                                        </>
                                      ) : (
                                        <>
                                          <Star className="mr-2 h-4 w-4" />
                                          Ajouter aux favoris
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    {isCurrentUser && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingMessageId(msg.id)
                                            setEditingContent(msg.content)
                                          }}
                                        >
                                          <Edit2 className="mr-2 h-4 w-4" />
                                          Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteMessage(msg.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Supprimer
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div
                        className={cn(
                          'flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground',
                          isCurrentUser && 'flex-row-reverse',
                        )}
                      >
                        <span>{formatMessageDate(new Date(msg.createdAt))}</span>
                        {msg.isEdited && <span>• modifié</span>}

                        {/* Thread indicator */}
                        {msg.isThreadRoot &&
                          msg.threadCount !== undefined &&
                          msg.threadCount > 0 && (
                            <button
                              onClick={() => onThreadClick?.(msg.id)}
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>
                                {msg.threadCount} réponse{msg.threadCount > 1 ? 's' : ''}
                              </span>
                            </button>
                          )}
                      </div>

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div
                          className={cn(
                            'flex flex-wrap gap-1 mt-1',
                            isCurrentUser && 'justify-end',
                          )}
                        >
                          {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                            <TooltipProvider key={emoji}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      'h-6 px-2 text-xs',
                                      userIds.includes(currentUserId) && 'bg-accent border-primary',
                                    )}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                  >
                                    <span>{emoji}</span>
                                    <span className="ml-1">{userIds.length}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    {userIds.includes(currentUserId)
                                      ? 'Cliquez pour retirer'
                                      : 'Cliquez pour réagir'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {/* Add reaction button with emoji picker */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 px-2">
                                <Smile className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                              <QuickEmojiPicker
                                onEmojiSelect={(emoji) => handleToggleReaction(msg.id, emoji)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* Add reaction button when no reactions */}
                      {(!msg.reactions || Object.keys(msg.reactions).length === 0) &&
                        !msg.isDeleted && (
                          <div
                            className={cn(
                              'mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
                              isCurrentUser && 'flex justify-end',
                            )}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <Smile className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2" align="start">
                                <QuickEmojiPicker
                                  onEmojiSelect={(emoji) => handleToggleReaction(msg.id, emoji)}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-2 sm:px-4 py-2 border-t">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></span>
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></span>
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></span>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} est en train d'écrire...`
                : typingUsers.length === 2
                  ? `${typingUsers[0]} et ${typingUsers[1]} sont en train d'écrire...`
                  : `${typingUsers[0]} et ${typingUsers.length - 1} autres sont en train d'écrire...`}
            </span>
          </div>
        </div>
      )}

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-2 sm:px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mb-1">
                <Reply className="h-3 w-3" />
                <span>Répondre à {replyingTo.User.name}</span>
              </div>
              <p className="text-xs sm:text-sm truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-2 sm:px-4 py-2 border-t bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-background px-3 py-2 rounded-md border"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-2 sm:p-4 border-t">
        {/* Popup de suggestions de mentions */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="mb-2 bg-popover border rounded-lg shadow-lg p-1 max-h-40 overflow-y-auto">
            <p className="px-2 py-1 text-xs text-muted-foreground">Mentionner un membre</p>
            {filteredMentions.map((member) => (
              <button
                key={member.id}
                onClick={() => handleInsertMention(member.id, member.name)}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-left"
              >
                <UserAvatar name={member.name} avatar={member.avatar} size="xs" />
                <span className="text-sm">{member.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              setAttachments([...attachments, ...files])
              e.target.value = ''
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          {/* Bouton pour ouvrir les mentions */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const cursorPos = inputRef.current?.selectionStart || message.length
              const newMessage = message.slice(0, cursorPos) + '@' + message.slice(cursorPos)
              setMessage(newMessage)
              setMentionCursorPosition(cursorPos)
              setShowMentions(true)
              setMentionQuery('')
              inputRef.current?.focus()
            }}
            disabled={sending}
            className="h-8 w-8 sm:h-10 sm:w-10"
            title="Mentionner quelqu'un (@)"
          >
            <AtSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          {/* Emoji Picker pour l'input */}
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              const cursorPos = inputRef.current?.selectionStart || message.length
              const newMessage = message.slice(0, cursorPos) + emoji + message.slice(cursorPos)
              setMessage(newMessage)
              onTyping()
              setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.setSelectionRange(
                  cursorPos + emoji.length,
                  cursorPos + emoji.length,
                )
              }, 0)
            }}
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
          <Input
            ref={inputRef}
            placeholder={
              replyingTo
                ? `Répondre à ${replyingTo.User.name}...`
                : 'Écrivez votre message... (@ pour mentionner, / pour commandes)'
            }
            value={message}
            onChange={handleInputChange}
            onFocus={async () => {
              // TODO: Implémenter les suggestions AI (module chat-ai.actions manquant)
              // if (!message.trim() && process.env.NEXT_PUBLIC_ENABLE_AI === "true") {
              //   try {
              //     const { suggestReplyAction } = await import("@/actions/chat-ai.actions");
              //     const result = await suggestReplyAction({ conversationId: conversation.id });
              //     if (result?.data?.suggestions && result.data.suggestions.length > 0) {
              //       console.log("Suggestions AI:", result.data.suggestions);
              //     }
              //   } catch (error) {
              //     // Ignorer les erreurs AI
              //   }
              // }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (showMentions && filteredMentions.length > 0) {
                  // Sélectionner la première mention
                  handleInsertMention(filteredMentions[0].id, filteredMentions[0].name)
                } else {
                  stopTyping()
                  handleSendMessage()
                }
              } else if (e.key === 'Escape') {
                if (showMentions) {
                  setShowMentions(false)
                } else if (replyingTo) {
                  setReplyingTo(null)
                }
              } else if (e.key === 'ArrowDown' && showMentions) {
                e.preventDefault()
                // TODO: Navigation dans la liste des mentions
              } else if (e.key === 'ArrowUp' && showMentions) {
                e.preventDefault()
                // TODO: Navigation dans la liste des mentions
              }
            }}
            onBlur={() => {
              // Délai pour permettre le clic sur les mentions
              setTimeout(() => {
                stopTyping()
              }, 200)
            }}
            disabled={sending}
            className="text-sm flex-1"
          />
          <Button
            onClick={() => {
              stopTyping()
              handleSendMessage()
            }}
            disabled={(!message.trim() && attachments.length === 0) || sending}
            className="bg-primary hover:bg-primary h-8 w-8 sm:h-10 sm:w-10"
          >
            {sending ? (
              <Spinner className="size-4 sm:size-5" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>

        {/* Indicateur de brouillon enregistré */}
        {draftSaved && message.trim() && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Brouillon enregistré</span>
          </div>
        )}
      </div>

      {/* Dialog d'informations de la conversation - Version enrichie */}
      <Dialog open={showConversationInfo} onOpenChange={setShowConversationInfo}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {conversation.type === 'CHANNEL' ? (
                <>
                  <Hash className="h-5 w-5" />
                  Informations sur le canal
                </>
              ) : (
                <>
                  <Info className="h-5 w-5" />
                  Informations sur la conversation
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {conversation.type === 'CHANNEL'
                ? 'Gérez les paramètres et les détails de ce canal'
                : 'Détails et paramètres de cette conversation'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="members">Membres</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* Onglet Détails */}
              <TabsContent value="details" className="space-y-6 mt-0">
                {/* En-tête avec nom et type */}
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-muted">
                    {conversation.type === 'DIRECT' && <Users className="h-6 w-6 text-blue-500" />}
                    {conversation.type === 'GROUP' && <Users className="h-6 w-6 text-green-500" />}
                    {conversation.type === 'PROJECT' && (
                      <FolderKanban className="h-6 w-6 text-purple-500" />
                    )}
                    {conversation.type === 'CHANNEL' && (
                      <MessageSquare className="h-6 w-6 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold truncate">
                        {conversation.name || 'Sans nom'}
                      </h3>
                      {conversation.type === 'CHANNEL' && (
                        <>
                          {conversation.isPrivate ? (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Privé
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Public
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.type === 'DIRECT' && 'Conversation directe'}
                      {conversation.type === 'GROUP' && 'Groupe de discussion'}
                      {conversation.type === 'PROJECT' && 'Conversation de projet'}
                      {conversation.type === 'CHANNEL' && 'Canal de discussion'}
                    </p>
                  </div>
                  {conversation.type === 'CHANNEL' && isCurrentUserAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingChannel(true)
                        setEditChannelName(conversation.name || '')
                        setEditChannelDescription(conversation.description || '')
                        setEditChannelTopic(conversation.topic || '')
                        setEditChannelPurpose(conversation.purpose || '')
                        setEditChannelCategory(conversation.category || '')
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>

                {/* Édition du canal */}
                {isEditingChannel && conversation.type === 'CHANNEL' ? (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="channelName">Nom du canal *</Label>
                      <Input
                        id="channelName"
                        value={editChannelName}
                        onChange={(e) => setEditChannelName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="channelDescription">Description</Label>
                      <Textarea
                        id="channelDescription"
                        value={editChannelDescription}
                        onChange={(e) => setEditChannelDescription(e.target.value)}
                        placeholder="Décrivez le but de ce canal..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="channelTopic">Sujet actuel</Label>
                      <Input
                        id="channelTopic"
                        value={editChannelTopic}
                        onChange={(e) => setEditChannelTopic(e.target.value)}
                        placeholder="Ex: Discussion sur le sprint actuel"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="channelPurpose">Objectif</Label>
                      <Textarea
                        id="channelPurpose"
                        value={editChannelPurpose}
                        onChange={(e) => setEditChannelPurpose(e.target.value)}
                        placeholder="Quel est l'objectif de ce canal ?"
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="channelCategory">Catégorie</Label>
                      <Input
                        id="channelCategory"
                        value={editChannelCategory}
                        onChange={(e) => setEditChannelCategory(e.target.value)}
                        placeholder="Ex: Équipes, Projets, Général"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          setSavingChannel(true)
                          try {
                            const result = await updateChannel({
                              conversationId: conversation.id,
                              name: editChannelName,
                              description: editChannelDescription || undefined,
                              topic: editChannelTopic || undefined,
                              purpose: editChannelPurpose || undefined,
                              category: editChannelCategory || undefined,
                            })
                            if (result?.data) {
                              toast.success('Canal mis à jour avec succès')
                              setIsEditingChannel(false)
                              onUpdate()
                            } else {
                              throw new Error(
                                result?.serverError || 'Erreur lors de la mise à jour',
                              )
                            }
                          } catch (error: any) {
                            toast.error(error.message || 'Erreur lors de la mise à jour du canal')
                          } finally {
                            setSavingChannel(false)
                          }
                        }}
                        disabled={!editChannelName.trim() || savingChannel}
                      >
                        {savingChannel ? (
                          <>
                            <Spinner className="h-4 w-4 mr-2" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setIsEditingChannel(false)
                          setEditChannelName('')
                          setEditChannelDescription('')
                          setEditChannelTopic('')
                          setEditChannelPurpose('')
                          setEditChannelCategory('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Description */}
                    {conversation.description && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Description
                        </Label>
                        <p className="text-sm mt-1">{conversation.description}</p>
                      </div>
                    )}

                    {/* Sujet */}
                    {conversation.topic && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Sujet actuel
                        </Label>
                        <p className="text-sm italic mt-1">{conversation.topic}</p>
                      </div>
                    )}

                    {/* Objectif */}
                    {conversation.purpose && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Objectif
                        </Label>
                        <p className="text-sm mt-1">{conversation.purpose}</p>
                      </div>
                    )}

                    {/* Catégorie */}
                    {conversation.category && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Catégorie
                        </Label>
                        <Badge variant="outline" className="mt-1">
                          {conversation.category}
                        </Badge>
                      </div>
                    )}

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {conversation._count?.Message || conversation.Message?.length || 0}{' '}
                            messages
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {conversation._count?.ConversationMember ||
                              conversation.ConversationMember.length}{' '}
                            membres
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>

                    {/* Informations de création */}
                    <div className="space-y-3 pt-4 border-t">
                      {conversation.User && (
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Créé par</p>
                            <p className="text-sm font-medium">{conversation.User.name}</p>
                          </div>
                        </div>
                      )}
                      {conversation.createdAt && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Créé le</p>
                            <p className="text-sm font-medium">
                              {format(new Date(conversation.createdAt), 'PPP', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      )}
                      {conversation.updatedAt && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Dernière activité</p>
                            <p className="text-sm font-medium">
                              {format(new Date(conversation.updatedAt), "PPP 'à' HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Onglet Membres */}
              <TabsContent value="members" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Membres ({conversation.ConversationMember.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conversation._count?.ConversationMember ||
                        conversation.ConversationMember.length}{' '}
                      membre{conversation.ConversationMember.length > 1 ? 's' : ''} dans ce{' '}
                      {conversation.type === 'CHANNEL' ? 'canal' : 'conversation'}
                    </p>
                  </div>
                  {isCurrentUserAdmin &&
                    (conversation.type === 'GROUP' ||
                      conversation.type === 'CHANNEL' ||
                      conversation.type === 'PROJECT') && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setShowConversationInfo(false)
                          setShowManageMembers(true)
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Gérer les membres
                      </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-3">
                    {conversation.ConversationMember.map((member: any) => (
                      <div
                        key={member.User.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <UserAvatar
                          name={member.User.name}
                          avatar={member.User.image || member.User.avatar}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{member.User.name}</p>
                            {member.isAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.User.email}
                          </p>
                          {member.User.role && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {member.User.role}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Onglet Notifications */}
              <TabsContent value="notifications" className="mt-0 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Paramètres de notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="shrink-0 mt-0.5">
                        {isMuted ? (
                          <BellOff className="h-5 w-5 text-red-500" />
                        ) : (
                          <Bell className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {isMuted ? 'Notifications désactivées' : 'Notifications activées'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isMuted
                                ? 'Vous ne recevrez pas de notifications pour cette conversation'
                                : 'Vous recevrez des notifications pour tous les nouveaux messages'}
                            </p>
                          </div>
                          <Button
                            variant={isMuted ? 'default' : 'outline'}
                            size="sm"
                            onClick={async () => {
                              try {
                                const result = await toggleMuteConversation({
                                  conversationId: conversation.id,
                                })
                                if (result?.data) {
                                  setIsMuted(!isMuted)
                                  toast.success(
                                    !isMuted
                                      ? 'Notifications désactivées'
                                      : 'Notifications activées',
                                  )
                                  onUpdate()
                                }
                              } catch (error: any) {
                                toast.error(
                                  error.message ||
                                    'Erreur lors de la modification des notifications',
                                )
                              }
                            }}
                          >
                            {isMuted ? 'Activer' : 'Désactiver'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Astuce :</strong> Vous pouvez personnaliser vos notifications
                        pour recevoir uniquement les mentions (@vous) ou désactiver complètement les
                        notifications pour cette conversation.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Actions */}
              <TabsContent value="actions" className="mt-0 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Actions disponibles</h3>
                  <div className="space-y-2">
                    {/* Quitter le canal */}
                    {conversation.type === 'CHANNEL' &&
                      !isCurrentUserAdmin &&
                      conversation.createdBy !== currentUserId && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={async () => {
                            if (confirm('Êtes-vous sûr de vouloir quitter ce canal ?')) {
                              try {
                                if (onLeaveConversation) {
                                  await onLeaveConversation(conversation.id)
                                  setShowConversationInfo(false)
                                  toast.success('Vous avez quitté le canal')
                                }
                              } catch (error: any) {
                                toast.error(error.message || 'Erreur lors de la sortie du canal')
                              }
                            }
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Quitter le canal
                        </Button>
                      )}

                    {/* Archiver (placeholder) */}
                    {conversation.type === 'CHANNEL' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          toast.info("Fonctionnalité d'archivage à venir")
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archiver le canal
                      </Button>
                    )}

                    {/* Messages épinglés */}
                    {conversation.type === 'CHANNEL' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          toast.info('Voir les messages épinglés (à implémenter)')
                        }}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        Voir les messages épinglés
                      </Button>
                    )}

                    {/* Actions admin */}
                    {isCurrentUserAdmin &&
                      (conversation.type === 'CHANNEL' || conversation.type === 'GROUP') && (
                        <>
                          <div className="pt-2 border-t">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                              Actions administrateur
                            </p>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                setShowConversationInfo(false)
                                setShowManageMembers(true)
                              }}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Gérer les membres
                            </Button>
                            {conversation.type === 'CHANNEL' && (
                              <Button
                                variant="outline"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      'Êtes-vous sûr de vouloir supprimer ce canal ? Cette action est irréversible.',
                                    )
                                  ) {
                                    if (
                                      confirm(
                                        '⚠️ ATTENTION : Cette action supprimera définitivement le canal et tous ses messages. Continuer ?',
                                      )
                                    ) {
                                      try {
                                        if (onDeleteConversation) {
                                          await onDeleteConversation(conversation.id)
                                          setShowConversationInfo(false)
                                          toast.success('Canal supprimé')
                                        }
                                      } catch (error: any) {
                                        toast.error(
                                          error.message || 'Erreur lors de la suppression du canal',
                                        )
                                      }
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer le canal
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion des membres */}
      <ChatManageMembersDialog
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        conversationId={conversation.id}
        members={conversation.ConversationMember}
        currentUserId={currentUserId}
        onUpdate={onUpdate}
      />
    </div>
  )
}
