"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { ChatConversationList } from "@/components/features/chat-conversation-list";
import { ChatMessageList } from "@/components/features/chat-message-list";
import { ChatNewConversationDialog } from "@/components/features/chat-new-conversation-dialog";
import { ChatChannelList } from "@/components/features/chat-channel-list";
import { ChatCreateChannelDialog } from "@/components/features/chat-create-channel-dialog";
// TODO: Implémenter les composants chat avancés (modules manquants)
// import { ChatThreadView } from "@/components/features/chat-thread-view";
// import { ChatGlobalSearch } from "@/components/features/chat-global-search";
// import { ChatChannelList } from "@/components/features/chat-channel-list";
// import { ChatFavoriteMessages } from "@/components/features/chat-favorite-messages";
// import { useChatKeyboardShortcuts } from "@/hooks/use-chat-keyboard-shortcuts";
import {
  getUserConversations,
  getConversationById,
  deleteConversation,
  leaveConversation,
} from "@/actions/chat.actions";
import { getAllUsersForChat } from "@/actions/user.actions";
import { getProjects } from "@/actions/project.actions";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("conversation");
  
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(
    null
  );
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"conversations" | "channels">("conversations");
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);

  // Raccourcis clavier
  // TODO: Implémenter les raccourcis clavier (hook manquant)
  // useChatKeyboardShortcuts({
  //   onSearch: () => setShowGlobalSearch(true),
  //   onNewMessage: () => setNewChatDialogOpen(true),
  //   onFavoriteMessages: () => setShowFavorites(true),
  // });

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const result = await getUserConversations({});
      if (result?.data?.conversations) {
        // Séparer les conversations normales et les canaux
        const allConversations = result.data.conversations;
        const regularConversations = allConversations.filter(
          (conv: any) => conv.type !== "CHANNEL"
        );
        const channelConversations = allConversations.filter(
          (conv: any) => conv.type === "CHANNEL"
        );

        setConversations(regularConversations);
        setChannels(channelConversations);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des conversations");
    }
  };

  // Charger les utilisateurs et projets pour la création de conversations
  const loadUsersAndProjects = async () => {
    try {
      // Charger les utilisateurs et projets
      const [usersResult, projectsResult] = await Promise.all([
        getAllUsersForChat({}),
        getProjects({}),
      ]);

      if (usersResult?.data) {
        setUsers(usersResult.data);
      }

      if (projectsResult?.data) {
        setProjects(projectsResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  // Charger une conversation spécifique
  const loadConversation = async (conversationId: string) => {
    try {
      const result = await getConversationById({ conversationId });
      if (result?.data?.conversation) {
        setSelectedConversation(result.data.conversation);
      } else {
        toast.error("Conversation introuvable");
        setSelectedConversation(null);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement de la conversation");
      setSelectedConversation(null);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      
      
      await Promise.all([loadConversations(), loadUsersAndProjects()]);
      setLoading(false);
    };

    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  // Charger la conversation depuis l'URL
  useEffect(() => {
    if (conversationIdParam && !loading) {
      loadConversation(conversationIdParam);
    }
  }, [conversationIdParam, loading]);

  // Real-time updates pour le chat
  useRealtimeChat({
    onConversationChange: (eventType, conversationId) => {
      // Rafraîchir la liste des conversations
      loadConversations();
      // Si la conversation modifiée est celle actuellement sélectionnée, la recharger
      if (conversationId && selectedConversation?.id === conversationId) {
        loadConversation(conversationId);
      }
    },
    onMessageChange: (eventType, messageId, conversationId) => {
      // Si c'est un message dans la conversation actuelle, rafraîchir
      if (conversationId && selectedConversation?.id === conversationId) {
        loadConversation(conversationId);
        loadConversations(); // Pour mettre à jour le compteur de messages non lus
      } else {
        // Sinon, juste rafraîchir la liste pour mettre à jour les compteurs
        loadConversations();
      }
    },
    userId: currentUser?.id,
  });

  // Gérer la sélection d'une conversation
  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    // Mettre à jour l'URL
    window.history.pushState({}, "", `/dashboard/chat?conversation=${conversationId}`);
  };

  // Gérer la création d'une nouvelle conversation
  const handleConversationCreated = async (conversationId: string) => {
    await loadConversations();
    await loadConversation(conversationId);
    window.history.pushState({}, "", `/dashboard/chat?conversation=${conversationId}`);
  };

  // Rafraîchir la conversation actuelle
  const handleRefreshConversation = async () => {
    if (selectedConversation) {
      await loadConversation(selectedConversation.id);
      await loadConversations(); // Pour mettre à jour le compteur de messages non lus
    }
  };

  // Gérer la suppression d'une conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const result = await deleteConversation({ conversationId });

      if (result?.data?.success) {
        // Si la conversation supprimée était sélectionnée, la désélectionner
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
        
        // Recharger les conversations
        await loadConversations();
      } else {
        throw new Error(result?.serverError || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error; // Re-throw pour que le composant puisse afficher l'erreur
    }
  };

  // Gérer la sortie d'une conversation
  const handleLeaveConversation = async (conversationId: string) => {
    try {
      const result = await leaveConversation({ conversationId });

      if (result?.data?.success) {
        // Si la conversation quittée était sélectionnée, la désélectionner
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
        
        // Recharger les conversations
        await loadConversations();
      } else {
        throw new Error(result?.serverError || "Erreur lors de la sortie");
      }
    } catch (error) {
      console.error("Erreur lors de la sortie:", error);
      throw error; // Re-throw pour que le composant puisse afficher l'erreur
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <Spinner className="size-6 mx-auto" />
          <p className="text-xs sm:text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full bg-background overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] w-full h-full min-w-0">
          {/* Sidebar Skeleton */}
          <Card className="rounded-none border-l-0 border-t-0 border-b-0 border-r md:border-r bg-background h-full flex flex-col overflow-hidden min-w-0 max-w-full">
            <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-full">
              {/* Header Skeleton */}
              <div className="p-3 sm:p-4 border-b space-y-3 sm:space-y-4 flex-shrink-0 w-full min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                  <Skeleton className="h-5 sm:h-6 w-24" />
                  <Skeleton className="h-8 w-20 sm:w-24" />
                </div>
                {/* Search Skeleton */}
                <Skeleton className="h-9 w-full" />
              </div>

              {/* Conversations List Skeleton */}
              <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
                <div className="divide-y w-full min-w-0 max-w-full">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-2 sm:gap-3 items-start min-w-0">
                        {/* Avatar Skeleton */}
                        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
                        
                        {/* Content Skeleton */}
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
          </Card>

          {/* Main Content Skeleton */}
          <Card className="rounded-none border-0 bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full hidden md:flex">
            <div className="flex flex-col h-full min-h-0">
              {/* Header Skeleton */}
              <div className="p-3 sm:p-4 border-b flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>

              {/* Messages Area Skeleton */}
              <div className="flex-1 p-4 space-y-4 overflow-hidden">
                {/* Messages */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 sm:gap-3 ${
                      i % 2 === 0 ? "flex-row-reverse" : ""
                    }`}
                  >
                    {i % 2 !== 0 && (
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-1 max-w-[80%]">
                      {i % 2 !== 0 && (
                        <Skeleton className="h-3 w-20" />
                      )}
                      <Skeleton
                        className={`h-16 sm:h-20 rounded-lg ${
                          i % 2 === 0 ? "ml-auto" : ""
                        }`}
                      />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area Skeleton */}
              <div className="p-3 sm:p-4 border-t flex-shrink-0">
                <div className="flex items-end gap-2">
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className={`grid w-full h-full min-w-0 ${selectedThreadId ? 'grid-cols-1 md:grid-cols-[350px,1fr,350px]' : 'grid-cols-1 md:grid-cols-[350px,1fr]'}`}>
        {/* Sidebar - Liste des conversations/canaux */}
        <Card className={`rounded-none border-l-0 border-t-0 border-b-0 border-r md:border-r bg-background h-full flex flex-col overflow-hidden min-w-0 max-w-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Toggle view mode */}
          <div className="p-2 border-b flex gap-2">
            <Button
              variant={viewMode === "conversations" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("conversations")}
              className="flex-1"
            >
              Messages
            </Button>
            <Button
              variant={viewMode === "channels" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("channels")}
              className="flex-1"
            >
              Canaux
            </Button>
          </div>

          {viewMode === "conversations" ? (
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
            />
          )}
        </Card>

        {/* Main Content - Messages */}
        <Card className={`rounded-none border-0 bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <ChatMessageList
              conversation={selectedConversation}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || "Utilisateur"}
              onUpdate={handleRefreshConversation}
              onThreadClick={(threadId) => setSelectedThreadId(threadId)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
              <div className="max-w-md space-y-4 sm:space-y-6">
                <div className="bg-muted rounded-full h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center mx-auto">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    Bienvenue dans la messagerie Chronodil
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sélectionnez une conversation existante ou créez-en une nouvelle
                    pour commencer à échanger avec vos collègues.
                  </p>
                </div>
                <Button
                  onClick={() => setNewChatDialogOpen(true)}
                  className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm"
                  size="lg"
                >
                  <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Nouvelle conversation
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Thread View */}
      {/* TODO: Implémenter ChatThreadView (composant manquant) */}
      {/* {selectedThreadId && (
        <Card className="rounded-none border-0 bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full hidden md:flex">
          <ChatThreadView
            threadId={selectedThreadId}
            conversationId={selectedConversation?.id || ""}
            currentUserId={currentUser.id}
            onClose={() => setSelectedThreadId(null)}
            onUpdate={handleRefreshConversation}
          />
        </Card>
      )} */}

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
      <ChatCreateChannelDialog
        open={createChannelDialogOpen}
        onOpenChange={setCreateChannelDialogOpen}
        onChannelCreated={handleConversationCreated}
      />

      {/* Global Search */}
      {/* TODO: Implémenter ChatGlobalSearch (composant manquant) */}
      {/* <ChatGlobalSearch
        open={showGlobalSearch}
        onOpenChange={setShowGlobalSearch}
        onSelectResult={(result) => {
          handleSelectConversation(result.conversationId);
          setShowGlobalSearch(false);
        }}
      /> */}

      {/* Favorite Messages */}
      {/* TODO: Implémenter ChatFavoriteMessages (composant manquant) */}
      {/* <ChatFavoriteMessages
        open={showFavorites}
        onOpenChange={setShowFavorites}
        onSelectMessage={(conversationId, messageId) => {
          handleSelectConversation(conversationId);
          // TODO: Scroll vers le message spécifique
        }}
      /> */}

      {/* Video Call */}
      {/* TODO: Implémenter ChatVideoCall (composant manquant) */}
      {/* {selectedConversation && (
        <ChatVideoCall
          open={showVideoCall}
          onOpenChange={setShowVideoCall}
          conversationId={selectedConversation.id}
          currentUserId={currentUser.id}
          otherParticipants={
            selectedConversation.ConversationMember.filter(
              (m) => m.User.id !== currentUser.id
            ).map((m) => ({
              id: m.User.id,
              name: m.User.name,
              avatar: m.User.avatar || m.User.image,
            }))
          }
        />
      )} */}
    </div>
  );
}

