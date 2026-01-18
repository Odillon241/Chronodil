"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatHeader,
  ChatMessageBubble,
  ChatMessageInput,
  useChatMessages,
  ChatMessageListProps,
} from "@/features/chat";
import { useRealtimePresence } from "@/hooks/use-realtime-presence";
import { ChatManageMembersDialog } from "./chat-manage-members-dialog";
import { ChatInfoDialog } from "./chat-info-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toggleMuteConversation, markAsRead } from "@/actions/chat.actions";
import { toast } from "sonner";

export function ChatMessageList({
  conversation,
  currentUserId,
  currentUserName = "Utilisateur",
  onUpdate,
  onThreadClick,
  onVideoCall,
  onDeleteConversation,
  onLeaveConversation,
  openInfoOnMount,
  openManageMembersOnMount,
  onInfoOpened,
  onManageMembersOpened,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  // Initialisation des états au montage si demandé
  useEffect(() => {
    if (openInfoOnMount) {
      setShowInfo(true);
      onInfoOpened?.();
    }
    if (openManageMembersOnMount) {
      setShowManageMembers(true);
      onManageMembersOpened?.();
    }
  }, [openInfoOnMount, openManageMembersOnMount, onInfoOpened, onManageMembersOpened]);

  // Hook pour la logique des messages
  const {
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleToggleReaction,
    handlePinMessage,
    handleUnpinMessage,
    uploadFiles,
  } = useChatMessages({
    conversationId: conversation.id,
    onUpdate,
  });

  // Gestion du mute
  const isMuted = useMemo(() => {
    const member = conversation.ConversationMember?.find(
      (m) => m.User.id === currentUserId
    );
    return member?.isMuted || false;
  }, [conversation.ConversationMember, currentUserId]);

  const handleToggleMute = async () => {
    try {
      const result = await toggleMuteConversation({ conversationId: conversation.id });
      if (result?.data) {
        onUpdate();
        toast.success(
          result.data.isMuted
            ? "Notifications désactivées pour cette conversation"
            : "Notifications activées pour cette conversation"
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la modification des notifications");
    }
  };

  // Marquer comme lu
  useEffect(() => {
    const markRead = async () => {
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        await markAsRead({ conversationId: conversation.id });
        onUpdate(); // Mettre à jour pour effacer le badge
      }
    };
    markRead();
  }, [conversation.id, conversation.unreadCount, onUpdate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [conversation.Message?.length, conversation.id]);

  // Filtrage des messages
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return conversation.Message || [];
    return conversation.Message.filter((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversation.Message, searchQuery]);

  // Membres pour les mentions
  const members = useMemo(() => {
    return conversation.ConversationMember?.map((m) => ({
      id: m.User.id,
      name: m.User.name,
      avatar: m.User.avatar || m.User.image,
    })) || [];
  }, [conversation.ConversationMember]);

  const isAdmin = useMemo(() => {
    const member = conversation.ConversationMember?.find(m => m.User.id === currentUserId);
    return member?.isAdmin || false;
  }, [conversation, currentUserId]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        onShowSearch={() => setShowSearch(!showSearch)}
        onShowInfo={() => setShowInfo(true)}
        onVideoCall={onVideoCall}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
        isAdmin={isAdmin}
      />

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b bg-muted/50 transition-all animate-in slide-in-from-top-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les messages..."
              className="pl-9 h-9 w-full bg-background"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setSearchQuery("");
                setShowSearch(false);
              }}
            >
              <span className="sr-only">Fermer</span>
              <span aria-hidden>×</span>
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea ref={scrollRef} className="h-full w-full p-4">
          <div className="flex flex-col gap-4 pb-4">
            {/* Historique complet / Pagination loader ici si besoin */}

            {/* Messages affichés chronologiquement (ancien → récent) */}
            {filteredMessages.map((message, index) => {
              const isOwn = message.User.id === currentUserId;
              return (
                <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ChatMessageBubble
                    message={message}
                    currentUserId={currentUserId}
                    isOwn={isOwn}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onReply={setReplyingTo}
                    onReaction={handleToggleReaction}
                    onPin={handlePinMessage}
                    onUnpin={handleUnpinMessage}
                    onThreadClick={onThreadClick}
                  />
                </div>
              );
            })}

            {filteredMessages.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <p>Aucun message pour le moment.</p>
                <p className="text-sm">Envoyez le premier message !</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <ChatMessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        members={members}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSend={async (content, attachments) => {
          try {
            let uploadedAttachments: any[] = [];

            // Uploader les fichiers si nécessaire
            if (attachments.length > 0) {
              uploadedAttachments = await uploadFiles(attachments);
            }

            const result = await handleSendMessage(content, uploadedAttachments, replyingTo?.id);
            return !!result;
          } catch (error) {
            console.error("Erreur lors de l'envoi:", error);
            toast.error("Erreur lors de l'envoi du message");
            return false;
          }
        }}
      />

      {/* Dialogs - Gardés pour compatibilité */}
      <ChatManageMembersDialog
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        conversationId={conversation.id}
        members={conversation.ConversationMember || []}
        currentUserId={currentUserId}
        onUpdate={onUpdate}
      />

      {/* Info Dialog Complet */}
      <ChatInfoDialog
        open={showInfo}
        onOpenChange={setShowInfo}
        conversation={conversation}
        currentUserId={currentUserId}
      />
    </div>
  );
}
