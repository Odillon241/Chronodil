"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  MessageSquare,
  FolderKanban,
  Plus,
  MoreVertical,
  Trash2,
  LogOut,
  Pin,
  PinOff,
  BellOff,
  Bell,
  Archive,
  ArchiveRestore,
  Mail,
  MailOpen,
  Info,
  User,
  Link,
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
import {
  togglePinConversation,
  toggleMuteConversation,
  toggleArchiveConversation,
  markConversationAsRead,
  markConversationAsUnread,
} from "@/actions/chat.actions";

interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP" | "PROJECT" | "CHANNEL";
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

  // Handlers pour les nouvelles options du menu
  const handleTogglePin = async (conversationId: string) => {
    try {
      const result = await togglePinConversation({ conversationId });
      if (result?.data?.message) {
        toast.success(result.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de l'épinglage");
    }
  };

  const handleToggleMute = async (conversationId: string) => {
    try {
      const result = await toggleMuteConversation({ conversationId });
      if (result?.data?.success) {
        toast.success(result.data.isMuted ? "Notifications désactivées" : "Notifications activées");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise en sourdine");
    }
  };

  const handleToggleArchive = async (conversationId: string) => {
    try {
      const result = await toggleArchiveConversation({ conversationId });
      if (result?.data?.message) {
        toast.success(result.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleMarkAsRead = async (conversationId: string) => {
    try {
      await markConversationAsRead({ conversationId });
      toast.success("Marqué comme lu");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleMarkAsUnread = async (conversationId: string) => {
    try {
      await markConversationAsUnread({ conversationId });
      toast.success("Marqué comme non lu");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleCopyLink = (conversationId: string) => {
    const url = `${window.location.origin}/dashboard/chat?conversation=${conversationId}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié");
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b space-y-3 sm:space-y-4 shrink-0 w-full min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0 w-full">
          <h2 className="text-base sm:text-lg font-semibold truncate flex-1 min-w-0">Messages</h2>
          <Button
            size="sm"
            onClick={onNewChat}
            className="bg-primary hover:bg-primary shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Nouveau</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full min-w-0">
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm w-full"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="divide-y w-full">
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
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "w-full p-3 sm:p-4 relative group overflow-hidden cursor-pointer",
                      "transition-all duration-200 ease-out",
                      "hover:bg-accent/80 hover:shadow-sm",
                      isSelected && "bg-accent shadow-sm"
                    )}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <div className="flex items-start gap-2 sm:gap-3 pr-8 sm:pr-10 w-full">
                      {/* Avatar ou Icône */}
                      <div className="shrink-0">
                        {conv.type === "DIRECT" ? (
                          /* Conversation directe - toujours afficher UserAvatar */
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <UserAvatar
                                    name={display.name}
                                    avatar={display.avatar}
                                    className="h-10 w-10 sm:h-12 sm:w-12"
                                  />
                                  {/* Badge de présence */}
                                  {display.userId && (
                                    <span
                                      className={cn(
                                        "absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-background",
                                        isUserOnline(display.userId)
                                          ? "bg-green-500"
                                          : "bg-gray-400 dark:bg-gray-600"
                                      )}
                                    />
                                  )}
                                </div>
                              </TooltipTrigger>
                              {display.userId && (
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
                          /* Avatars superposés pour les groupes/projets */
                          <div className="flex -space-x-1.5 sm:-space-x-2">
                            {display.members.map((member) => (
                              <UserAvatar
                                key={member.User.id}
                                name={member.User.name}
                                avatar={member.User.avatar || member.User.image}
                                className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background"
                              />
                            ))}
                            {conv.ConversationMember.length > 4 && (
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background bg-muted">
                                <AvatarFallback className="text-[10px] sm:text-xs">
                                  +{conv.ConversationMember.length - 3}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ) : (
                          /* Icône par défaut pour les canaux */
                          <div
                            className={cn(
                              "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-white shrink-0",
                              display.color
                            )}
                          >
                            {display.icon}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => onSelectConversation(conv.id)}
                        className="flex-1 w-0 text-left overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 w-full">
                          <h3 className="font-medium text-sm sm:text-base truncate flex-1 w-0">
                            {display.name}
                          </h3>
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {conv.Message.length > 0 && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap max-w-[50px] sm:max-w-[70px] truncate">
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
                                className="h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] flex items-center justify-center px-1 sm:px-1.5 text-[10px] sm:text-xs shrink-0"
                              >
                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 break-all">
                          {lastMessage || "Pas de messages"}
                        </p>
                      </button>
                    </div>

                    {/* Menu contextuel - Toujours visible sur mobile, visible au hover sur desktop */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {/* Actions rapides */}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(conv.id);
                          }}
                        >
                          <Pin className="mr-2 h-4 w-4" />
                          Épingler
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMute(conv.id);
                          }}
                        >
                          <BellOff className="mr-2 h-4 w-4" />
                          Mettre en sourdine
                        </DropdownMenuItem>
                        {conv.unreadCount > 0 ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(conv.id);
                            }}
                          >
                            <MailOpen className="mr-2 h-4 w-4" />
                            Marquer comme lu
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsUnread(conv.id);
                            }}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Marquer comme non lu
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(conv.id);
                          }}
                        >
                          <Link className="mr-2 h-4 w-4" />
                          Copier le lien
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleArchive(conv.id);
                          }}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archiver
                        </DropdownMenuItem>
                        {canLeaveConversation(conv) && (
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
                        )}
                        {canDeleteConversation(conv) && (
                          <>
                            <DropdownMenuSeparator />
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
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

