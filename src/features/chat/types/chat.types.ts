'use client'

// Types pour le module Chat

export interface Message {
  id: string
  content: string
  isEdited: boolean
  isDeleted: boolean
  attachments?: MessageAttachment[]
  createdAt: Date
  reactions?: Record<string, string[]> | null
  pinnedAt?: Date | null
  pinnedById?: string | null
  threadId?: string | null
  threadCount?: number
  isThreadRoot?: boolean
  User: MessageUser
  replyTo?: MessageReply | null
}

export interface MessageUser {
  id: string
  name: string
  avatar?: string | null
  image?: string | null
  email?: string
  role?: string | null
}

export interface MessageReply {
  id: string
  content: string
  senderId: string
  User: {
    id: string
    name: string
  }
}

export interface MessageAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface Conversation {
  id: string
  type: ConversationType
  name?: string | null
  description?: string | null
  topic?: string | null
  purpose?: string | null
  category?: string | null
  isPrivate?: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string | null
  User?: MessageUser | null
  ConversationMember: ConversationMember[]
  Project?: ConversationProject | null
  Message: Message[]
  _count?: {
    Message: number
    ConversationMember: number
  }
  unreadCount?: number
}

export type ConversationType = 'DIRECT' | 'GROUP' | 'PROJECT' | 'CHANNEL'

export interface ConversationMember {
  isAdmin: boolean
  isMuted?: boolean
  User: MessageUser
}

export interface ConversationProject {
  id: string
  name: string
  code: string
  color: string
}

// Props pour les composants

export interface ChatMessageListProps {
  conversation: Conversation
  currentUserId: string
  currentUserName?: string
  onUpdate: () => void
  onThreadClick?: (threadId: string) => void
  onVideoCall?: () => void
  onDeleteConversation?: (conversationId: string) => void
  onLeaveConversation?: (conversationId: string) => void
  onBack?: () => void
  openInfoOnMount?: boolean
  openManageMembersOnMount?: boolean
  onInfoOpened?: () => void
  onManageMembersOpened?: () => void
}

export interface ChatConversationListProps {
  conversations: Conversation[]
  currentUserId: string
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onNewChat: () => void
  onDeleteConversation?: (conversationId: string) => void
  onLeaveConversation?: (conversationId: string) => void
}

export interface ChatHeaderProps {
  conversation: Conversation
  currentUserId: string
  onShowSearch: () => void
  onShowInfo: () => void
  onVideoCall?: () => void
  onToggleMute: () => void
  isMuted: boolean
}

export interface ChatMessageBubbleProps {
  message: Message
  currentUserId: string
  isOwn: boolean
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onReply: (message: Message) => void
  onReaction: (messageId: string, emoji: string) => void
  onPin: (messageId: string) => void
  onUnpin: (messageId: string) => void
  onThreadClick?: (threadId: string) => void
}

export interface ChatMessageInputProps {
  conversationId: string
  currentUserId: string
  currentUserName: string
  replyingTo: Message | null
  onCancelReply: () => void
  onSend: (content: string, attachments?: File[]) => Promise<void>
  members: { id: string; name: string; avatar?: string | null }[]
  disabled?: boolean
}

export interface ChatEmptyStateProps {
  onNewChat: () => void
}
