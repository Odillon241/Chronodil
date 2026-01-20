'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Search, Send, Users, Hash, Folder, Loader2, User, MessageSquare } from 'lucide-react'
import { getUserConversations, createOrGetConversation } from '@/actions/chat.actions'
import { getAllUsersForChat } from '@/actions/user.actions'
import type { Conversation, Message } from '../types/chat.types'
import { toast } from 'sonner'

interface ForwardMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: Message
  currentUserId: string
  onForward: (conversationId: string, message: Message) => Promise<void>
}

interface UserResult {
  id: string
  name: string
  email: string
  avatar?: string | null
  image?: string | null
}

/**
 * Dialog pour transférer un message vers une autre conversation ou utilisateur
 */
export function ForwardMessageDialog({
  open,
  onOpenChange,
  message,
  currentUserId,
  onForward,
}: ForwardMessageDialogProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allUsers, setAllUsers] = useState<UserResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'conversation' | 'user' | null>(null)

  // Charger les conversations et les utilisateurs
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [convResult, usersResult] = await Promise.all([
        getUserConversations({ page: 1, limit: 50 }),
        getAllUsersForChat({}),
      ])

      if (convResult?.data) {
        const data = convResult.data as unknown as {
          conversations: Conversation[]
          pagination: { hasMore: boolean; totalCount: number }
        }
        setConversations(data.conversations || [])
      }

      if (usersResult?.data) {
        // Filtrer l'utilisateur courant
        const filteredUsers = (usersResult.data as UserResult[]).filter(
          (u) => u.id !== currentUserId,
        )
        setAllUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    }
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    if (open) {
      loadData()
      setSelectedId(null)
      setSelectedType(null)
      setSearchQuery('')
      setActiveTab('conversations')
    }
  }, [open, loadData])

  // Filtrer les conversations localement
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) => {
        const name = getConversationName(conv)
        return name.toLowerCase().includes(searchQuery.toLowerCase())
      })
    : conversations

  // Filtrer les utilisateurs localement
  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allUsers

  // Obtenir le nom de la conversation
  function getConversationName(conv: Conversation): string {
    if (conv.name) return conv.name
    if (conv.type === 'DIRECT') {
      const otherMember = conv.ConversationMember?.find((m) => m.User.id !== currentUserId)
      return otherMember?.User.name || 'Utilisateur'
    }
    if (conv.Project) return conv.Project.name
    return 'Conversation'
  }

  // Obtenir l'avatar de la conversation
  function getConversationAvatar(conv: Conversation): string | undefined {
    if (conv.type === 'DIRECT') {
      const otherMember = conv.ConversationMember?.find((m) => m.User.id !== currentUserId)
      return otherMember?.User.avatar || otherMember?.User.image || undefined
    }
    return undefined
  }

  // Obtenir l'icône selon le type
  function getConversationIcon(conv: Conversation) {
    switch (conv.type) {
      case 'GROUP':
        return <Users className="h-4 w-4" />
      case 'CHANNEL':
        return <Hash className="h-4 w-4" />
      case 'PROJECT':
        return <Folder className="h-4 w-4" />
      default:
        return null
    }
  }

  // Sélectionner une conversation
  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
    setSelectedType('conversation')
  }

  // Sélectionner un utilisateur
  const handleSelectUser = (id: string) => {
    setSelectedId(id)
    setSelectedType('user')
  }

  // Transférer le message
  const handleForward = async () => {
    if (!selectedId || !selectedType) return

    setSending(true)
    try {
      let conversationId = selectedId

      // Si c'est un utilisateur, créer ou trouver la conversation directe
      if (selectedType === 'user') {
        const result = await createOrGetConversation({
          type: 'DIRECT',
          memberIds: [selectedId],
        })
        if (result?.serverError) {
          throw new Error(result.serverError)
        }
        if (result?.data) {
          const data = result.data as { conversation: { id: string } }
          conversationId = data.conversation.id
        }
      }

      await onForward(conversationId, message)
      toast.success('Message transféré avec succès')
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors du transfert:', error)
      toast.error('Erreur lors du transfert du message')
    }
    setSending(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transférer le message</DialogTitle>
        </DialogHeader>

        {/* Aperçu du message à transférer */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground text-xs mb-1">Message à transférer :</p>
          <p className="line-clamp-2">{message.content || '(Fichier joint)'}</p>
          {message.attachments && message.attachments.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              + {message.attachments.length} fichier(s) joint(s)
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'conversations' | 'users')}>
          <TabsList className="grid w-full grid-cols-2 gap-2">
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
          </TabsList>

          {/* Recherche */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === 'conversations'
                  ? 'Rechercher une conversation...'
                  : 'Rechercher un utilisateur...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Liste des conversations */}
          <TabsContent value="conversations" className="mt-2">
            <ScrollArea className="h-56">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Aucune conversation trouvée
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                        selectedId === conv.id && selectedType === 'conversation'
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/50',
                      )}
                    >
                      {conv.type === 'DIRECT' ? (
                        <UserAvatar
                          name={getConversationName(conv)}
                          avatar={getConversationAvatar(conv)}
                          size="sm"
                          className="h-9 w-9"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          {getConversationIcon(conv)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{getConversationName(conv)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.type === 'DIRECT'
                            ? 'Message direct'
                            : conv.type === 'GROUP'
                              ? 'Groupe'
                              : conv.type === 'PROJECT'
                                ? 'Projet'
                                : 'Canal'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Liste des utilisateurs */}
          <TabsContent value="users" className="mt-2">
            <ScrollArea className="h-56">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery.trim() ? 'Aucun utilisateur trouvé' : 'Tapez un nom pour filtrer'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                        selectedId === user.id && selectedType === 'user'
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/50',
                      )}
                    >
                      <UserAvatar
                        name={user.name}
                        avatar={user.image || user.avatar}
                        size="sm"
                        className="h-9 w-9"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Boutons */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleForward} disabled={!selectedId || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Transférer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
