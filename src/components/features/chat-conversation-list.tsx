"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Users,
  MessageSquare,
  FolderKanban,
  Plus,
  MoreVertical,
  Trash2,
  LogOut,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRealtimePresence } from "@/hooks/use-realtime-presence";
import { formatLastSeen } from "@/lib/utils/presence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP" | "PROJECT";
  name?: string | null;
  createdBy?: string | null;
  ConversationMember: {
    User: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      image?: string | null;
      lastSeenAt?: Date | null;
    };
  }[];
  Project?: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
  Message: {
    id: string;
    content: string;
    createdAt: Date;
    User: {
      id: string;
      name: string;
    };
  }[];
  unreadCount: number;
  updatedAt: Date;
}

interface ChatConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onLeaveConversation?: (conversationId: string) => void;
}

export function ChatConversationList({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onLeaveConversation,
}: ChatConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isUserOnline, getLastSeenAt } = useRealtimePresence();

  const handleDeleteConversation = async (conversationId: string, conversationName: string) => {
    if (!onDeleteConversation) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement la conversation "${conversationName}" ?\n\n` +
      "Cette action est irréversible et supprimera tous les messages de cette conversation."
    );

    if (confirmed) {
      try {
        await onDeleteConversation(conversationId);
        toast.success("Conversation supprimée");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleLeaveConversation = async (conversationId: string, conversationName: string) => {
    if (!onLeaveConversation) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir quitter la conversation "${conversationName}" ?\n\n` +
      "Vous ne recevrez plus de notifications de cette conversation."
    );

    if (confirmed) {
      try {
        await onLeaveConversation(conversationId);
        toast.success("Vous avez quitté la conversation");
      } catch (error) {
        toast.error("Erreur lors de la sortie");
      }
    }
  };

  const canDeleteConversation = (conv: Conversation) => {
    // Pour les conversations directes, seul le créateur peut supprimer
    if (conv.type === "DIRECT") {
      return conv.createdBy === currentUserId;
    }
    
    // Pour les groupes et projets, seuls les admins peuvent supprimer
    const userMembership = conv.ConversationMember.find(m => m.User.id === currentUserId);
    return (userMembership as any)?.isAdmin || false;
  };

  const canLeaveConversation = (conv: Conversation) => {
    // On ne peut pas quitter une conversation directe
    return conv.type !== "DIRECT";
  };

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();

    // Pour les conversations directes, chercher par nom d'utilisateur
    if (conv.type === "DIRECT") {
      const otherUser = conv.ConversationMember.find(
        (m) => m.User.id !== currentUserId
      )?.User;
      return otherUser?.name.toLowerCase().includes(searchLower);
    }

    // Pour les projets
    if (conv.type === "PROJECT" && conv.Project) {
      return conv.Project.name.toLowerCase().includes(searchLower);
    }

    // Pour les groupes
    if (conv.name) {
      return conv.name.toLowerCase().includes(searchLower);
    }

    return false;
  });

  const getConversationDisplay = (conv: Conversation) => {
    if (conv.type === "DIRECT") {
      const otherUser = conv.ConversationMember.find(
        (m) => m.User.id !== currentUserId
      )?.User;
      return {
        name: otherUser?.name || "Utilisateur inconnu",
        avatar: otherUser?.avatar || otherUser?.image,
        icon: <MessageSquare className="h-4 w-4" />,
        color: "bg-blue-500",
        userId: otherUser?.id,
        lastSeenAt: otherUser?.lastSeenAt,
      };
    }

    if (conv.type === "PROJECT" && conv.Project) {
      return {
        name: conv.Project.name,
        avatar: null,
        icon: <FolderKanban className="h-4 w-4" />,
        color: conv.Project.color,
        isGroup: true,
        members: conv.ConversationMember.filter(m => m.User.id !== currentUserId).slice(0, 3), // Max 3 avatars
      };
    }

    return {
      name: conv.name || "Groupe",
      avatar: null,
      icon: <Users className="h-4 w-4" />,
      color: "bg-green-500",
      isGroup: true,
      members: conv.ConversationMember.filter(m => m.User.id !== currentUserId).slice(0, 3), // Max 3 avatars
    };
  };

  const getLastMessage = (conv: Conversation) => {
    if (conv.Message.length === 0) return null;
    const lastMsg = conv.Message[0];
    const isCurrentUser = lastMsg.User.id === currentUserId;
    const prefix = isCurrentUser ? "Vous: " : `${lastMsg.User.name}: `;
    return prefix + lastMsg.content;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button
            size="sm"
            onClick={onNewChat}
            className="bg-primary hover:bg-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                {searchQuery
                  ? "Aucune conversation trouvée"
                  : "Aucune conversation pour le moment"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const display = getConversationDisplay(conv);
              const lastMessage = getLastMessage(conv);
              const isSelected = conv.id === selectedConversationId;

              return (
                <div
                  key={conv.id}
                  className={cn(
                    "w-full p-4 hover:bg-accent transition-colors relative group",
                    isSelected && "bg-accent"
                  )}
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className="w-full text-left flex items-start gap-3"
                  >
                    {/* Avatar ou Icône */}
                    {display.avatar ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={display.avatar} />
                                <AvatarFallback>
                                  {display.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {/* Badge de présence (conversations directes uniquement) */}
                              {conv.type === "DIRECT" && display.userId && (
                                <span
                                  className={cn(
                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                    isUserOnline(display.userId)
                                      ? "bg-green-500"
                                      : "bg-gray-400 dark:bg-gray-600"
                                  )}
                                />
                              )}
                            </div>
                          </TooltipTrigger>
                          {conv.type === "DIRECT" && display.userId && (
                            <TooltipContent side="right">
                              <p className="text-xs">
                                {isUserOnline(display.userId)
                                  ? "En ligne"
                                  : `Hors ligne • ${formatLastSeen(
                                      getLastSeenAt(display.userId) || display.lastSeenAt
                                    )}`}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ) : display.isGroup && display.members && display.members.length > 0 ? (
                      /* Avatars superposés pour les groupes */
                      <div className="flex -space-x-2">
                        {display.members.map((member, index) => (
                          <Avatar key={member.User.id} className="h-12 w-12 border-2 border-background">
                            <AvatarImage 
                              src={member.User.avatar || member.User.image || undefined} 
                              alt={member.User.name}
                            />
                            <AvatarFallback>
                              {member.User.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {conv.ConversationMember.length > 4 && (
                          <Avatar className="h-12 w-12 border-2 border-background bg-muted">
                            <AvatarFallback className="text-xs">
                              +{conv.ConversationMember.length - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center text-white",
                          display.color
                        )}
                      >
                        {display.icon}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate">{display.name}</h3>
                        <div className="flex items-center gap-2">
                          {conv.Message.length > 0 && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(
                                new Date(conv.Message[0].createdAt),
                                {
                                  addSuffix: true,
                                  locale: fr,
                                }
                              )}
                            </span>
                          )}
                          {/* Unread Badge */}
                          {conv.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
                            >
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {lastMessage || "Pas de messages"}
                      </p>
                    </div>
                  </button>

                  {/* Menu contextuel */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canLeaveConversation(conv) && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveConversation(conv.id, display.name);
                            }}
                            className="text-orange-600"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Quitter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {canDeleteConversation(conv) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id, display.name);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

