'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'
import { ChatConversationList } from '@/components/features/chat-conversation-list'
import { ChatMessageList } from '@/components/features/chat-message-list'
import { ChatNewConversationDialog } from '@/components/features/chat-new-conversation-dialog'
import { ChatChannelList } from '@/components/features/chat-channel-list'
// ⚡ DYNAMIC IMPORTS: Réduction bundle initial ~100KB
import {
  ChatCreateChannelDialogDynamic,
  ChatThreadViewDynamic,
} from '@/components/features/chat-components-dynamic'

import { ChatEmptyState } from '@/features/chat/components/chat-empty-state'

import { useChatKeyboardShortcuts } from '@/hooks/use-chat-keyboard-shortcuts'
import {
  getUserConversations,
  getConversationById,
  deleteConversation,
  leaveConversation,
} from '@/actions/chat.actions'
import { getAllUsersForChat } from '@/actions/user.actions'
import { getProjects } from '@/actions/project.actions'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPageInner />
    </Suspense>
  )
}

function ChatPageInner() {
  const searchParams = useSearchParams()
  const conversationIdParam = searchParams.get('conversation')

  const { data: session } = useSession()
  const currentUser = session?.user

  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [, setIsInitialLoad] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  const [channels, setChannels] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'conversations' | 'channels'>('conversations')
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false)
  const [openChannelInfoOnSelect, setOpenChannelInfoOnSelect] = useState(false)
  const [openManageMembersOnSelect, setOpenManageMembersOnSelect] = useState(false)
  const conversationListRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const conversationDetailRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref pour éviter les dépendances circulaires dans les callbacks realtime
  const selectedConversationIdRef = useRef<string | null>(null)

  // S'assurer que le composant est monté côté client avant de rendre le contenu
  useEffect(() => {
    setMounted(true)
  }, [])

  // Synchroniser la ref avec l'état pour éviter les dépendances circulaires
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null
  }, [selectedConversation?.id])

  // Raccourcis clavier
  useChatKeyboardShortcuts({
    onSearch: () => {}, // Recherche désactivée
    onNewMessage: () => setNewChatDialogOpen(true),
    onEscape: () => {
      // Priorité 1: Fermer les dialogs ouverts
      if (newChatDialogOpen) {
        setNewChatDialogOpen(false)
        return
      }
      if (createChannelDialogOpen) {
        setCreateChannelDialogOpen(false)
        return
      }

      // Priorité 2: Fermer le thread si ouvert
      if (selectedThreadId) {
        setSelectedThreadId(null)
        return
      }

      // Priorité 3: Revenir à la liste des conversations (désélectionner la conversation)
      if (selectedConversation) {
        setSelectedConversation(null)
        // Supprimer le paramètre conversation de l'URL
        window.history.pushState({}, '', '/dashboard/chat')
      }
    },
  })

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    try {
      // ⚡ PAGINATION: Charger 20 conversations par page
      const result = await getUserConversations({ page: 1, limit: 20 })
      if (result?.data?.conversations) {
        const allConversations = result.data.conversations
        const regularConversations = allConversations.filter((conv: any) => conv.type !== 'CHANNEL')
        const channelConversations = allConversations.filter((conv: any) => conv.type === 'CHANNEL')

        setConversations(regularConversations)
        setChannels(channelConversations)
      }
    } catch (error) {
      console.error('Erreur chargement conversations', error)
    }
  }, [])

  // Charger les utilisateurs et projets pour la création de conversations
  const loadUsersAndProjects = useCallback(async () => {
    try {
      const [usersResult, projectsResult] = await Promise.all([
        getAllUsersForChat({}),
        getProjects({}),
      ])

      if (usersResult?.data) {
        setUsers(usersResult.data)
      }

      if (projectsResult?.data) {
        setProjects(projectsResult.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }, [])

  // Charger une conversation spécifique
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      // ⚡ PAGINATION: Charger 50 derniers messages
      const result = await getConversationById({
        conversationId,
        messagesLimit: 50,
      })
      if (result?.data?.conversation) {
        setSelectedConversation(result.data.conversation)
      } else {
        toast.error('Conversation introuvable')
        setSelectedConversation(null)
      }
    } catch (_error) {
      toast.error('Erreur lors du chargement de la conversation')
      setSelectedConversation(null)
    }
  }, [])

  const scheduleConversationsRefresh = useCallback(() => {
    if (conversationListRefreshRef.current) return
    conversationListRefreshRef.current = setTimeout(async () => {
      conversationListRefreshRef.current = null
      await loadConversations()
    }, 50) // Réduit de 200ms à 50ms pour plus de réactivité
  }, [loadConversations])

  const scheduleConversationDetailRefresh = useCallback(
    (conversationId?: string) => {
      if (!conversationId) return
      if (conversationDetailRefreshRef.current) {
        clearTimeout(conversationDetailRefreshRef.current)
      }
      conversationDetailRefreshRef.current = setTimeout(async () => {
        conversationDetailRefreshRef.current = null
        await loadConversation(conversationId)
      }, 30) // Réduit de 180ms à 30ms pour plus de réactivité
    },
    [loadConversation],
  )

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await Promise.all([loadConversations(), loadUsersAndProjects()])
      setLoading(false)
      setIsInitialLoad(false) // Après le premier chargement, ne plus afficher le skeleton
    }

    if (currentUser) {
      loadInitialData()
    }
  }, [currentUser, loadConversations, loadUsersAndProjects])

  // Charger la conversation depuis l'URL
  useEffect(() => {
    if (conversationIdParam && !loading) {
      loadConversation(conversationIdParam)
    }
  }, [conversationIdParam, loading, loadConversation])

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      await loadConversation(conversationId)
      window.history.pushState({}, '', `/dashboard/chat?conversation=${conversationId}`)
    },
    [loadConversation],
  )

  const handleConversationCreated = useCallback(
    async (conversationId: string) => {
      await loadConversations()
      await loadConversation(conversationId)
      window.history.pushState({}, '', `/dashboard/chat?conversation=${conversationId}`)
    },
    [loadConversations, loadConversation],
  )

  // Utiliser la ref pour éviter que handleRefreshConversation ne change de référence
  // à chaque changement de selectedConversation (évite les boucles infinies)
  const handleRefreshConversation = useCallback(async () => {
    const currentConversationId = selectedConversationIdRef.current
    if (currentConversationId) {
      await loadConversation(currentConversationId)
      await loadConversations()
    }
  }, [loadConversation, loadConversations])

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const result = await deleteConversation({ conversationId })

        if (result?.data?.success) {
          if (selectedConversation?.id === conversationId) {
            setSelectedConversation(null)
          }
          await loadConversations()
        } else {
          throw new Error(result?.serverError || 'Erreur lors de la suppression')
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        throw error
      }
    },
    [loadConversations, selectedConversation],
  )

  const handleLeaveConversation = useCallback(
    async (conversationId: string) => {
      try {
        const result = await leaveConversation({ conversationId })

        if (result?.data?.success) {
          if (selectedConversation?.id === conversationId) {
            setSelectedConversation(null)
          }
          await loadConversations()
        } else {
          throw new Error(result?.serverError || 'Erreur lors de la sortie')
        }
      } catch (error) {
        console.error('Erreur lors de la sortie:', error)
        throw error
      }
    },
    [loadConversations, selectedConversation],
  )

  const handleChannelInfo = useCallback(
    async (channelId: string) => {
      setOpenChannelInfoOnSelect(true)
      await handleSelectConversation(channelId)
    },
    [handleSelectConversation],
  )

  const handleManageMembers = useCallback(
    async (channelId: string) => {
      setOpenManageMembersOnSelect(true)
      await handleSelectConversation(channelId)
    },
    [handleSelectConversation],
  )

  const handleRealtimeConversationChange = useCallback(
    (_eventType: string | undefined, conversationId?: string) => {
      scheduleConversationsRefresh()
      // Utiliser la ref pour éviter les dépendances circulaires
      if (conversationId && selectedConversationIdRef.current === conversationId) {
        scheduleConversationDetailRefresh(conversationId)
      }
    },
    [scheduleConversationDetailRefresh, scheduleConversationsRefresh],
  )

  const handleRealtimeMessageChange = useCallback(
    (_eventType: string | undefined, _messageId: string | undefined, conversationId?: string) => {
      scheduleConversationsRefresh()
      // Utiliser la ref pour éviter les dépendances circulaires
      if (conversationId && selectedConversationIdRef.current === conversationId) {
        loadConversation(conversationId)
      }
    },
    [loadConversation, scheduleConversationsRefresh],
  )

  // Real-time updates pour le chat
  useRealtimeChat({
    onConversationChange: handleRealtimeConversationChange,
    onMessageChange: handleRealtimeMessageChange,
    userId: currentUser?.id,
  })

  useEffect(() => {
    return () => {
      if (conversationListRefreshRef.current) {
        clearTimeout(conversationListRefreshRef.current)
      }
      if (conversationDetailRefreshRef.current) {
        clearTimeout(conversationDetailRefreshRef.current)
      }
    }
  }, [])

  // Conteneur plein écran sans débordement horizontal.
  // On laisse le padding du layout parent, on force juste la hauteur pleine.
  const fullScreenClasses = 'flex flex-col h-full min-h-0 overflow-hidden'

  // Pendant l'hydratation, afficher un état de chargement simple pour éviter les erreurs d'hydratation
  // Le skeleton initial est maintenant géré par loading.tsx
  if (!mounted || !currentUser) {
    if (!mounted) return <ChatLoading />
    return <div className={`${fullScreenClasses} bg-background`} />
  }

  return (
    <div className={`${fullScreenClasses} bg-background`} suppressHydrationWarning>
      <div className="flex h-full w-full overflow-hidden max-w-full" suppressHydrationWarning>
        <div
          className={`grid w-full h-full min-w-0 max-w-full ${selectedThreadId ? 'grid-cols-1 md:grid-cols-[minmax(0,350px)_1fr_minmax(0,350px)]' : 'grid-cols-1 md:grid-cols-[minmax(0,350px)_1fr]'}`}
          suppressHydrationWarning
        >
          {/* Sidebar - Liste des conversations/canaux */}
          <div
            className={`border-r bg-background h-full flex flex-col overflow-hidden overflow-x-hidden min-w-0 max-w-[350px] w-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}
          >
            {/* Toggle view mode */}
            <div className="p-2 border-b flex gap-2">
              <Button
                variant={viewMode === 'conversations' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('conversations')}
                className="flex-1"
              >
                Messages
              </Button>
              <Button
                variant={viewMode === 'channels' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('channels')}
                className="flex-1"
              >
                Canaux
              </Button>
            </div>

            {viewMode === 'conversations' ? (
              <ChatConversationList
                conversations={conversations}
                currentUserId={currentUser.id}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                onNewChat={() => setNewChatDialogOpen(true)}
                onDeleteConversation={handleDeleteConversation}
                onLeaveConversation={handleLeaveConversation}
              />
            ) : (
              <ChatChannelList
                channels={channels}
                currentUserId={currentUser.id}
                selectedChannelId={selectedConversation?.id}
                onSelectChannel={handleSelectConversation}
                onCreateChannel={() => setCreateChannelDialogOpen(true)}
                onChannelInfo={handleChannelInfo}
                onManageMembers={handleManageMembers}
                onUpdate={loadConversations}
              />
            )}
          </div>

          {/* Main Content - Messages */}
          <div
            className={`bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full w-full ${selectedConversation ? 'flex' : 'hidden md:flex'}`}
          >
            {selectedConversation ? (
              <ChatMessageList
                conversation={selectedConversation}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name || 'Utilisateur'}
                onUpdate={handleRefreshConversation}
                onThreadClick={(threadId) => setSelectedThreadId(threadId)}
                onDeleteConversation={handleDeleteConversation}
                onLeaveConversation={handleLeaveConversation}
                onBack={() => {
                  setSelectedConversation(null)
                  window.history.pushState({}, '', '/dashboard/chat')
                }}
                openInfoOnMount={openChannelInfoOnSelect && selectedConversation.type === 'CHANNEL'}
                openManageMembersOnMount={
                  openManageMembersOnSelect && selectedConversation.type === 'CHANNEL'
                }
                onInfoOpened={() => setOpenChannelInfoOnSelect(false)}
                onManageMembersOpened={() => setOpenManageMembersOnSelect(false)}
              />
            ) : (
              <ChatEmptyState onNewChat={() => setNewChatDialogOpen(true)} />
            )}
          </div>

          {/* Thread View */}
          {selectedThreadId && selectedConversation && (
            <div className="bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full hidden md:flex border-l z-20">
              <ChatThreadViewDynamic
                threadId={selectedThreadId}
                conversationId={selectedConversation.id}
                currentUserId={currentUser.id}
                onClose={() => setSelectedThreadId(null)}
                onUpdate={handleRefreshConversation}
              />
            </div>
          )}
        </div>

        {/* Dialog pour créer une nouvelle conversation */}
        <ChatNewConversationDialog
          open={newChatDialogOpen}
          onOpenChange={setNewChatDialogOpen}
          users={users}
          projects={projects}
          currentUserId={currentUser.id}
          onConversationCreated={handleConversationCreated}
        />

        {/* Dialog pour créer un nouveau canal */}
        <ChatCreateChannelDialogDynamic
          open={createChannelDialogOpen}
          onOpenChange={setCreateChannelDialogOpen}
          onChannelCreated={handleConversationCreated}
          users={users}
          currentUserId={currentUser.id}
        />

        {/* Global Search */}
      </div>
    </div>
  )
}

function ChatLoading() {
  const fullScreenClasses = 'flex flex-col h-full min-h-0 overflow-hidden'

  return (
    <div className={`${fullScreenClasses} bg-background`}>
      <div className="flex h-full w-full overflow-hidden max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] w-full h-full min-w-0 max-w-full">
          {/* Sidebar Skeleton */}
          <div className="border-r bg-background h-full flex flex-col overflow-hidden min-w-0 max-w-full">
            <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-full">
              <div className="p-3 sm:p-4 border-b space-y-3 sm:space-y-4 shrink-0 w-full min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                  <Skeleton className="h-5 sm:h-6 w-24" />
                  <Skeleton className="h-8 w-20 sm:w-24" />
                </div>
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
                <div className="divide-y w-full min-w-0 max-w-full">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-2 sm:gap-3 items-start min-w-0">
                        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-4 w-32 sm:w-40" />
                            <Skeleton className="h-3 w-12 sm:w-16" />
                          </div>
                          <Skeleton className="h-3 w-full max-w-[200px]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Main Content Skeleton */}
          <div className="bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full hidden md:flex">
            <div className="flex flex-col h-full min-h-0">
              <div className="p-3 sm:p-4 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 sm:gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}
                  >
                    {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                    <div className="flex-1 space-y-1 max-w-[80%]">
                      {i % 2 !== 0 && <Skeleton className="h-3 w-20" />}
                      <Skeleton
                        className={`h-16 sm:h-20 rounded-lg ${i % 2 === 0 ? 'ml-auto' : ''}`}
                      />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 sm:p-4 border-t shrink-0">
                <div className="flex items-end gap-2">
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
