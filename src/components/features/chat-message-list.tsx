"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Users,
  FolderKanban,
  Settings,
  Reply,
  X,
  Search,
  Smile,
  Paperclip,
  File,
  Image as ImageIcon,
  Download,
  Bell,
  BellOff,
  Info,
  Pin,
  PinOff,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ChatAttachmentViewer } from "./chat-attachment-viewer";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  sendMessage,
  updateMessage,
  deleteMessage,
  markAsRead,
  toggleReaction,
  pinMessage,
  unpinMessage,
} from "@/actions/chat.actions";
import { useRealtimePresence } from "@/hooks/use-realtime-presence";
import { formatLastSeen, getPresenceLabel } from "@/lib/utils/presence";
import { LinkPreview } from "./link-preview";

interface Message {
  id: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  attachments?: any;
  createdAt: Date;
  reactions?: Record<string, string[]> | null;
  pinnedAt?: Date | null;
  pinnedById?: string | null;
  User: {
    id: string;
    name: string;
    avatar?: string | null;
    image?: string | null;
  };
  Message?: {
    id: string;
    content: string;
    senderId: string;
    User: {
      id: string;
      name: string;
    };
  } | null;
}

interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP" | "PROJECT";
  name?: string | null;
  ConversationMember: {
    User: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      image?: string | null;
    };
  }[];
  Project?: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
  Message: Message[];
}

interface ChatMessageListProps {
  conversation: Conversation;
  currentUserId: string;
  onUpdate: () => void;
}

export function ChatMessageList({
  conversation,
  currentUserId,
  onUpdate,
}: ChatMessageListProps) {
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string>("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionCursorPosition, setMentionCursorPosition] = useState<number>(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hook de présence en temps réel
  const { isUserOnline, getLastSeenAt } = useRealtimePresence();

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Fonction pour extraire les URLs d'un texte
  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Clé localStorage pour le brouillon
  const getDraftKey = () => `chat-draft-${conversation.id}`;

  // Sauvegarder le brouillon dans localStorage
  const saveDraft = (text: string) => {
    if (text.trim()) {
      localStorage.setItem(getDraftKey(), text);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000); // Afficher l'indicateur pendant 2s
    } else {
      localStorage.removeItem(getDraftKey());
      setDraftSaved(false);
    }
  };

  // Restaurer le brouillon au chargement de la conversation
  useEffect(() => {
    const draft = localStorage.getItem(getDraftKey());
    if (draft) {
      setMessage(draft);
    }

    // Cleanup: sauvegarder le brouillon au démontage
    return () => {
      if (message.trim()) {
        localStorage.setItem(getDraftKey(), message);
      }
    };
  }, [conversation.id]); // Se déclenche quand la conversation change

  // Sauvegarder automatiquement le brouillon toutes les 2 secondes pendant la frappe
  useEffect(() => {
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }

    draftTimeoutRef.current = setTimeout(() => {
      saveDraft(message);
    }, 2000);

    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [message]);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.Message]);

  // Cleanup du timeout de typing à la fermeture
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Simuler la réception d'événements de frappe d'autres utilisateurs
  // Dans une vraie app, cela viendrait d'un WebSocket
  useEffect(() => {
    // Pour la démo, simuler aléatoirement qu'un utilisateur tape
    const simulateTyping = () => {
      if (Math.random() > 0.95 && conversation.ConversationMember.length > 1) {
        const otherMember = conversation.ConversationMember.find(m => m.User.id !== currentUserId);
        if (otherMember) {
          setTypingUsers([otherMember.User.name]);
          setTimeout(() => setTypingUsers([]), 3000);
        }
      }
    };

    // Vérifier toutes les 10 secondes (juste pour la démo)
    const interval = setInterval(simulateTyping, 10000);
    return () => clearInterval(interval);
  }, [conversation.ConversationMember, currentUserId]);

  // Marquer comme lu quand on ouvre la conversation
  useEffect(() => {
    markAsRead({ conversationId: conversation.id });
  }, [conversation.id]);

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    try {
      let attachmentsData = [];

      // Upload des fichiers si il y en a
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((file) => {
          formData.append("files", file);
        });

        const uploadResponse = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Erreur lors de l'upload des fichiers");
        }

        const uploadResult = await uploadResponse.json();
        attachmentsData = uploadResult.files || [];
        console.log("📤 Fichiers uploadés, données reçues du serveur:", attachmentsData);
      }

      console.log("💬 Envoi du message avec attachments:", attachmentsData);
      const result = await sendMessage({
        conversationId: conversation.id,
        content: message.trim() || "(Fichier joint)",
        replyToId: replyingTo?.id,
        attachments: attachmentsData.length > 0 ? attachmentsData : undefined,
      });

      if (result?.data) {
        setMessage("");
        setReplyingTo(null);
        setAttachments([]);
        // Supprimer le brouillon après l'envoi réussi
        localStorage.removeItem(getDraftKey());
        setDraftSaved(false);
        onUpdate();
        toast.success("Message envoyé");
      } else {
        toast.error(result?.serverError || "Erreur lors de l'envoi");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;

    try {
      const result = await updateMessage({
        messageId,
        content: editingContent.trim(),
      });

      if (result?.data) {
        setEditingMessageId(null);
        setEditingContent("");
        onUpdate();
        toast.success("Message modifié");
      } else {
        toast.error(result?.serverError || "Erreur lors de la modification");
      }
    } catch (error) {
      toast.error("Erreur lors de la modification du message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;

    try {
      const result = await deleteMessage({ messageId });

      if (result?.data) {
        onUpdate();
        toast.success("Message supprimé");
      } else {
        toast.error(result?.serverError || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du message");
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const result = await toggleReaction({ messageId, emoji });

      if (result?.data) {
        onUpdate();
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la réaction");
    }
  };

  // Emojis populaires
  const popularEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Fonction pour rendre le contenu avec les mentions
  const renderMessageContent = (content: string) => {
    // Regex pour détecter les mentions @[userId:username]
    const mentionRegex = /@\[([^\]]+):([^\]]+)\]/g;
    const parts = content.split(mentionRegex);
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Texte normal
        result.push(parts[i]);
      } else if (i % 3 === 1) {
        // userId (on le saute)
        continue;
      } else {
        // username (on l'affiche comme mention)
        result.push(
          <span
            key={i}
            className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded font-medium"
          >
            @{parts[i]}
          </span>
        );
      }
    }
    
    return result.length > 0 ? result : content;
  };

  // Simuler l'indicateur de frappe (dans une vraie app, utiliser WebSockets)
  const handleTyping = () => {
    // Dans une vraie application, on enverrait un événement via WebSocket
    // Pour cette simulation, on va juste afficher un message temporaire
    // en utilisant le localStorage pour simuler la communication entre utilisateurs
    
    // Clear le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Simuler l'envoi de l'événement "typing"
    // Dans une vraie app: socket.emit('typing', { conversationId, userId, userName })
    
    // Définir un nouveau timeout pour arrêter l'indication après 3 secondes
    typingTimeoutRef.current = setTimeout(() => {
      // Dans une vraie app: socket.emit('stop-typing', { conversationId, userId })
    }, 3000);
  };

  const getConversationTitle = () => {
    if (conversation.type === "DIRECT") {
      const otherUser = conversation.ConversationMember.find(
        (m) => m.User.id !== currentUserId
      )?.User;
      return otherUser?.name || "Utilisateur inconnu";
    }

    if (conversation.type === "PROJECT" && conversation.Project) {
      return conversation.Project.name;
    }

    return conversation.name || "Groupe";
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    if (isYesterday(date)) {
      return "Hier " + format(date, "HH:mm");
    }
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.createdAt), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({
          date: msgDate,
          messages: [msg],
        });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return "Hier";
    return format(date, "dd MMMM yyyy", { locale: fr });
  };

  // Séparer les messages épinglés des messages normaux
  const pinnedMessages = conversation.Message.filter((msg) => msg.pinnedAt).sort(
    (a, b) => new Date(a.pinnedAt!).getTime() - new Date(b.pinnedAt!).getTime()
  );

  // Filtrer les messages selon la recherche
  const filteredMessages = searchQuery
    ? conversation.Message.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.User.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversation.Message;

  const messageGroups = groupMessagesByDate(filteredMessages);

  // Gérer l'épinglage d'un message
  const handlePinMessage = async (messageId: string) => {
    try {
      const result = await pinMessage({
        messageId,
        conversationId: conversation.id,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success("Message épinglé");
        onUpdate();
      }
    } catch (error) {
      toast.error("Erreur lors de l'épinglage du message");
    }
  };

  // Gérer le désépinglage d'un message
  const handleUnpinMessage = async (messageId: string) => {
    try {
      const result = await unpinMessage({ messageId });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success("Message désépinglé");
        onUpdate();
      }
    } catch (error) {
      toast.error("Erreur lors du désépinglage du message");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {conversation.type === "PROJECT" && conversation.Project ? (
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: conversation.Project.color }}
            >
              <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ) : conversation.type === "GROUP" ? (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage
                        src={
                          conversation.ConversationMember.find((m) => m.User.id !== currentUserId)
                            ?.User.avatar ||
                          conversation.ConversationMember.find((m) => m.User.id !== currentUserId)
                            ?.User.image ||
                          undefined
                        }
                      />
                      <AvatarFallback>
                        {getConversationTitle().substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Badge de présence */}
                    {(() => {
                      const otherUser = conversation.ConversationMember.find((m) => m.User.id !== currentUserId)?.User;
                      if (!otherUser) return null;
                      const online = isUserOnline(otherUser.id);
                      return (
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                            online ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
                          )}
                        />
                      );
                    })()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {(() => {
                      const otherUser = conversation.ConversationMember.find((m) => m.User.id !== currentUserId)?.User;
                      if (!otherUser) return null;
                      const online = isUserOnline(otherUser.id);
                      const lastSeen = getLastSeenAt(otherUser.id);
                      return online ? "En ligne" : `Hors ligne • ${formatLastSeen(lastSeen)}`;
                    })()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm sm:text-base truncate">{getConversationTitle()}</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {conversation.type === "DIRECT" ? (
                (() => {
                  const otherUser = conversation.ConversationMember.find((m) => m.User.id !== currentUserId)?.User;
                  if (!otherUser) return null;
                  return getPresenceLabel(isUserOnline(otherUser.id) ? new Date() : getLastSeenAt(otherUser.id));
                })()
              ) : (
                `${conversation.ConversationMember.length} membre${conversation.ConversationMember.length > 1 ? "s" : ""}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
              <DropdownMenuLabel>Paramètres de la conversation</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setIsMuted(!isMuted);
                  toast.success(
                    isMuted 
                      ? "Notifications activées pour cette conversation" 
                      : "Notifications désactivées pour cette conversation"
                  );
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
              <DropdownMenuItem
                onClick={() => setShowConversationInfo(true)}
              >
                <Info className="mr-2 h-4 w-4" />
                Informations sur la conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="p-3 border-b bg-muted/50">
          <div className="relative">
            <Input
              placeholder="Rechercher dans les messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredMessages.length} résultat{filteredMessages.length > 1 ? 's' : ''} trouvé{filteredMessages.length > 1 ? 's' : ''}
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
                  <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {msg.User.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {msg.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
                const isCurrentUser = msg.User.id === currentUserId;
                const isEditing = editingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2 sm:gap-3",
                      isCurrentUser && "flex-row-reverse"
                    )}
                  >
                    {/* Avatar */}
                    {!isCurrentUser && (
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                        <AvatarImage
                          src={msg.User.avatar || msg.User.image || undefined}
                        />
                        <AvatarFallback className="text-[10px] sm:text-xs">
                          {msg.User.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]",
                        isCurrentUser && "items-end"
                      )}
                    >
                      {!isCurrentUser && (
                        <span className="text-[10px] sm:text-xs font-medium">
                          {msg.User.name}
                        </span>
                      )}

                      <div className="relative group">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleEditMessage(msg.id);
                                } else if (e.key === "Escape") {
                                  setEditingMessageId(null);
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleEditMessage(msg.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div
                              className={cn(
                                "px-3 py-2 sm:px-4 rounded-2xl",
                                isCurrentUser
                                  ? "bg-primary text-white"
                                  : "bg-muted",
                                msg.isDeleted && "italic opacity-70"
                              )}
                            >
                              {/* Reply preview */}
                              {msg.Message && (
                                <div
                                  className={cn(
                                    "mb-2 pb-2 border-b text-[10px] sm:text-xs opacity-80",
                                    isCurrentUser
                                      ? "border-white/30"
                                      : "border-border"
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <Reply className="h-3 w-3" />
                                    <span className="font-medium">
                                      {msg.Message.User?.name}
                                    </span>
                                  </div>
                                  <p className="truncate mt-1">
                                    {msg.Message.content}
                                  </p>
                                </div>
                              )}

                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                                {renderMessageContent(msg.content)}
                              </p>

                              {/* Attachments */}
                              {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {msg.attachments.map((attachment: any, idx: number) => {
                                    console.log("🖼️ Affichage de l'attachement:", attachment);
                                    return (
                                      <ChatAttachmentViewer
                                        key={idx}
                                        attachment={attachment}
                                        isCurrentUser={isCurrentUser}
                                      />
                                    );
                                  })}
                                </div>
                              )}

                              {/* Link Previews */}
                              {!msg.isDeleted && extractUrls(msg.content).length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {extractUrls(msg.content).map((url, idx) => (
                                    <LinkPreview
                                      key={`${msg.id}-url-${idx}`}
                                      url={url}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {!msg.isDeleted && (
                              <div className={cn(
                                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex",
                                isCurrentUser ? "-left-12" : "-right-12"
                              )}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => setReplyingTo(msg)}
                                    >
                                      <Reply className="mr-2 h-4 w-4" />
                                      Répondre
                                    </DropdownMenuItem>
                                    {msg.pinnedAt ? (
                                      <DropdownMenuItem
                                        onClick={() => handleUnpinMessage(msg.id)}
                                      >
                                        <PinOff className="mr-2 h-4 w-4" />
                                        Désépingler
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => handlePinMessage(msg.id)}
                                      >
                                        <Pin className="mr-2 h-4 w-4" />
                                        Épingler
                                      </DropdownMenuItem>
                                    )}
                                    {isCurrentUser && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingMessageId(msg.id);
                                            setEditingContent(msg.content);
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
                          "flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground",
                          isCurrentUser && "flex-row-reverse"
                        )}
                      >
                        <span>{formatMessageDate(new Date(msg.createdAt))}</span>
                        {msg.isEdited && <span>• modifié</span>}
                      </div>

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={cn(
                          "flex flex-wrap gap-1 mt-1",
                          isCurrentUser && "justify-end"
                        )}>
                          {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                            <Button
                              key={emoji}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-6 px-2 text-xs",
                                userIds.includes(currentUserId) && "bg-accent"
                              )}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                            >
                              <span>{emoji}</span>
                              <span className="ml-1">{userIds.length}</span>
                            </Button>
                          ))}
                          {/* Add reaction button */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 px-2">
                                <Smile className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <div className="grid grid-cols-3 gap-1 p-2">
                                {popularEmojis.map((emoji) => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="text-xl"
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {/* Add reaction button when no reactions */}
                      {(!msg.reactions || Object.keys(msg.reactions).length === 0) && !msg.isDeleted && (
                        <div className={cn(
                          "mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                          isCurrentUser && "flex justify-end"
                        )}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <Smile className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <div className="grid grid-cols-3 gap-1 p-2">
                                {popularEmojis.map((emoji) => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="text-xl"
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                );
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
              className="h-6 w-6 flex-shrink-0"
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
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
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
        <div className="flex gap-1 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setAttachments([...attachments, ...files]);
              e.target.value = "";
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
          <Input
            ref={inputRef}
            placeholder={replyingTo ? `Répondre à ${replyingTo.User.name}...` : "Écrivez votre message..."}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              } else if (e.key === "Escape" && replyingTo) {
                setReplyingTo(null);
              }
            }}
            disabled={sending}
            className="text-sm"
          />
          <Button
            onClick={handleSendMessage}
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

      {/* Dialog d'informations de la conversation */}
      <Dialog open={showConversationInfo} onOpenChange={setShowConversationInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informations sur la conversation</DialogTitle>
            <DialogDescription>
              Détails et paramètres de cette conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Type de conversation */}
            <div className="flex items-center gap-3">
              {conversation.type === "DIRECT" && <Users className="h-5 w-5 text-blue-500" />}
              {conversation.type === "GROUP" && <Users className="h-5 w-5 text-green-500" />}
              {conversation.type === "PROJECT" && <FolderKanban className="h-5 w-5 text-purple-500" />}
              <div>
                <p className="font-medium">
                  {conversation.type === "DIRECT" && "Conversation directe"}
                  {conversation.type === "GROUP" && "Groupe"}
                  {conversation.type === "PROJECT" && "Conversation de projet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {conversation.type === "PROJECT" && conversation.name}
                </p>
              </div>
            </div>

            {/* Nom de la conversation */}
            {conversation.name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <p className="text-lg">{conversation.name}</p>
              </div>
            )}

            {/* Membres */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Membres ({conversation.ConversationMember.length})
              </p>
              <div className="space-y-2">
                {conversation.ConversationMember.map((member: any) => (
                  <div key={member.User.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.User.avatar || member.User.image || ""} />
                      <AvatarFallback>
                        {member.User.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.User.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.isAdmin ? "Administrateur" : "Membre"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statut des notifications */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {isMuted ? (
                <BellOff className="h-5 w-5 text-red-500" />
              ) : (
                <Bell className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isMuted ? "Notifications désactivées" : "Notifications activées"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isMuted 
                    ? "Vous ne recevrez pas de notifications pour cette conversation"
                    : "Vous recevrez des notifications pour cette conversation"
                  }
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

