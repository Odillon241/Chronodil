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

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const result = await getUserConversations({});
      if (result?.data?.conversations) {
        setConversations(result.data.conversations);
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
      <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Spinner className="size-6 mx-auto" />
          <p className="text-xs sm:text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 flex bg-background">
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-80 border-r p-3 md:p-4 space-y-3 md:space-y-4">
          <Skeleton className="h-9 md:h-10 w-full" />
          <Skeleton className="h-9 md:h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 md:gap-3">
              <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 md:h-4 w-3/4" />
                <Skeleton className="h-2 md:h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="hidden md:flex flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] h-full">
        {/* Sidebar - Liste des conversations */}
        <Card className={`rounded-none border-l-0 border-t-0 border-b-0 bg-background ${selectedConversation ? 'hidden md:block' : 'block'}`}>
          <ChatConversationList
            conversations={conversations}
            currentUserId={currentUser.id}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            onNewChat={() => setNewChatDialogOpen(true)}
            onDeleteConversation={handleDeleteConversation}
            onLeaveConversation={handleLeaveConversation}
          />
        </Card>

        {/* Main Content - Messages */}
        <Card className={`rounded-none border-0 bg-background ${selectedConversation ? 'block' : 'hidden md:block'}`}>
          {selectedConversation ? (
            <ChatMessageList
              conversation={selectedConversation}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || "Utilisateur"}
              onUpdate={handleRefreshConversation}
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

      {/* Dialog pour créer une nouvelle conversation */}
      <ChatNewConversationDialog
        open={newChatDialogOpen}
        onOpenChange={setNewChatDialogOpen}
        users={users}
        projects={projects}
        currentUserId={currentUser.id}
        onConversationCreated={handleConversationCreated}
      />

    </div>
  );
}

