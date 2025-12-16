"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Hash,
  Lock,
  Plus,
  Settings,
  Bell,
  BellOff,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Trash2,
  Info,
  UserPlus,
  UserMinus,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { leaveConversation, deleteConversation, toggleMuteConversation } from "@/actions/chat.actions";

interface Channel {
  id: string;
  type: "CHANNEL";
  name: string;
  description?: string | null;
  isPrivate: boolean;
  category?: string | null;
  topic?: string | null;
  purpose?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  ConversationMember: {
    User: {
      id: string;
      name: string;
      avatar?: string | null;
      image?: string | null;
    };
    isMuted?: boolean;
    isAdmin?: boolean;
  }[];
  Message: {
    id: string;
    content: string;
    createdAt: Date;
    User: {
      id: string;
      name: string;
    };
  }[];
  unreadCount?: number;
}

interface ChatChannelListProps {
  channels: Channel[];
  currentUserId: string;
  selectedChannelId?: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  onManageMembers?: (channelId: string) => void;
  onChannelInfo?: (channelId: string) => void;
  onUpdate?: () => void;
}

// Catégories par défaut
const DEFAULT_CATEGORIES = ["Général", "Projets", "Équipes", "Autres"];

export function ChatChannelList({
  channels,
  currentUserId,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onManageMembers,
  onChannelInfo,
  onUpdate,
}: ChatChannelListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  // Grouper les canaux par catégorie
  const channelsByCategory = useMemo(() => {
    const grouped = new Map<string, Channel[]>();

    channels.forEach((channel) => {
      const category = channel.category || "Autres";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(channel);
    });

    // S'assurer que les catégories par défaut existent même si vides
    DEFAULT_CATEGORIES.forEach((cat) => {
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
    });

    return grouped;
  }, [channels]);

  // Filtrer les canaux par recherche
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;

    const searchLower = searchQuery.toLowerCase();
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(searchLower) ||
        channel.description?.toLowerCase().includes(searchLower) ||
        channel.topic?.toLowerCase().includes(searchLower)
    );
  }, [channels, searchQuery]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleToggleMute = async (channelId: string) => {
    try {
      const result = await toggleMuteConversation({ conversationId: channelId });
      if (result?.data) {
        toast.success(
          result.data.isMuted
            ? "Notifications désactivées pour ce canal"
            : "Notifications activées pour ce canal"
        );
        // Rafraîchir la liste des canaux
        if (onUpdate) {
          onUpdate();
        }
      } else {
         toast.error(result?.serverError || "Erreur lors de la modification des notifications");
      }
    } catch (error) {
      toast.error("Erreur lors de la modification des notifications");
    }
  };

  const handleLeaveChannel = async (channelId: string, channelName: string) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir quitter le canal "${channelName}" ?\n\n` +
        "Vous ne recevrez plus de notifications de ce canal."
    );

    if (confirmed) {
      try {
        await leaveConversation({ conversationId: channelId });
        toast.success(`Vous avez quitté #${channelName}`);
        // Rafraîchir la liste des canaux
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        toast.error("Erreur lors de la sortie du canal");
      }
    }
  };

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    const confirmed = confirm(
      `⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement le canal "${channelName}" ?\n\n` +
        "Cette action est IRRÉVERSIBLE et supprimera :\n" +
        "• Tous les messages du canal\n" +
        "• Tous les membres du canal\n" +
        "• Toutes les pièces jointes\n\n" +
        "Tapez OUI pour confirmer la suppression."
    );

    if (confirmed) {
      try {
        await deleteConversation({ conversationId: channelId });
        toast.success(`Canal #${channelName} supprimé définitivement`);
        // Rafraîchir la liste des canaux
        if (onUpdate) {
          onUpdate();
        }
      } catch (error: any) {
        toast.error(error?.message || "Erreur lors de la suppression du canal");
      }
    }
  };

  const canDeleteChannel = (channel: Channel) => {
    // Le créateur ou un admin peut supprimer
    const userMember = channel.ConversationMember.find(
      (m) => m.User.id === currentUserId
    );
    return channel.createdBy === currentUserId || userMember?.isAdmin === true;
  };

  const canManageMembers = (channel: Channel) => {
    // Le créateur ou un admin peut gérer les membres
    const userMember = channel.ConversationMember.find(
      (m) => m.User.id === currentUserId
    );
    return channel.createdBy === currentUserId || userMember?.isAdmin === true;
  };

  const getChannelMemberCount = (channel: Channel) => {
    return channel.ConversationMember.length;
  };

  const getLastMessage = (channel: Channel) => {
    if (channel.Message.length === 0) return null;
    const lastMsg = channel.Message[0];
    const isCurrentUser = lastMsg.User.id === currentUserId;
    const prefix = isCurrentUser ? "Vous: " : `${lastMsg.User.name}: `;
    return prefix + lastMsg.content;
  };

  const isUserMuted = (channel: Channel) => {
    const userMember = channel.ConversationMember.find(
      (m) => m.User.id === currentUserId
    );
    return userMember?.isMuted || false;
  };

  const renderChannel = (channel: Channel) => {
    const isSelected = channel.id === selectedChannelId;
    const lastMessage = getLastMessage(channel);
    const memberCount = getChannelMemberCount(channel);
    const isMuted = isUserMuted(channel);

    return (
      <div
        key={channel.id}
        className={cn(
          "w-full min-w-0 px-2 py-1.5 hover:bg-accent transition-colors relative group overflow-hidden rounded-md",
          isSelected && "bg-accent"
        )}
      >
        <div className="flex items-center gap-2 pr-8 min-w-0 w-full">
          {/* Icône canal */}
          <div className="flex-shrink-0">
            {channel.isPrivate ? (
              <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-orange-500" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Hash className="h-4 w-4 text-blue-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <button
            onClick={() => onSelectChannel(channel.id)}
            className="flex-1 min-w-0 text-left overflow-hidden"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-medium text-sm truncate flex-1 min-w-0">
                {channel.isPrivate && (
                  <Lock className="inline h-3 w-3 mr-1 text-muted-foreground" />
                )}
                {channel.name}
              </h3>

              {/* Badges */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isMuted && (
                  <BellOff className="h-3 w-3 text-muted-foreground" />
                )}
                {(channel.unreadCount ?? 0) > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-4 min-w-[16px] px-1 text-[10px]"
                  >
                    {channel.unreadCount! > 99 ? "99+" : channel.unreadCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* Topic ou dernier message */}
            <p className="text-xs text-muted-foreground line-clamp-1 break-words">
              {channel.topic || lastMessage || "Aucun message"}
            </p>

            {/* Membres */}
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {memberCount} {memberCount > 1 ? "membres" : "membre"}
              </span>
            </div>
          </button>

          {/* Menu contextuel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="sr-only">Paramètres du canal</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Informations du canal */}
              <DropdownMenuItem
                onSelect={() => {
                  if (onChannelInfo) {
                    onChannelInfo(channel.id);
                  } else {
                    // Si pas de handler, sélectionner le canal pour afficher les infos dans le header
                    onSelectChannel(channel.id);
                  }
                }}
              >
                <Info className="mr-2 h-4 w-4" />
                Informations du canal
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Gestion des membres (admin/créateur uniquement) */}
              {canManageMembers(channel) && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (onManageMembers) {
                        onManageMembers(channel.id);
                      } else {
                        // Si pas de handler, sélectionner le canal pour gérer les membres depuis le header
                        onSelectChannel(channel.id);
                      }
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gérer les membres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Notifications */}
              <DropdownMenuItem
                onSelect={() => {
                  handleToggleMute(channel.id);
                }}
              >
                {isMuted ? (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Réactiver les notifications
                  </>
                ) : (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    Désactiver les notifications
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Quitter le canal (tous les membres) */}
              {!canDeleteChannel(channel) && (
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => {
                      handleLeaveChannel(channel.id, channel.name);
                    }, 100);
                  }}
                  className="text-orange-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Quitter le canal
                </DropdownMenuItem>
              )}

              {/* Supprimer le canal (créateur/admin uniquement) */}
              {canDeleteChannel(channel) && (
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => {
                      handleDeleteChannel(channel.id, channel.name);
                    }, 100);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le canal
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b space-y-3 flex-shrink-0 w-full min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0 w-full">
          <h2 className="text-base sm:text-lg font-semibold truncate flex-1 min-w-0">
            Canaux
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onCreateChannel}
                  className="bg-primary hover:bg-primary flex-shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Créer</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Créer un nouveau canal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Search */}
        <div className="relative w-full min-w-0">
          <Input
            placeholder="Rechercher un canal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm w-full"
          />
        </div>
      </div>

      {/* Channels List par catégorie */}
      <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2 space-y-1">
            {searchQuery ? (
              // Mode recherche : liste plate
              filteredChannels.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Aucun canal trouvé</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredChannels.map(renderChannel)}
                </div>
              )
            ) : (
              // Mode normal : groupé par catégorie
              Array.from(channelsByCategory.entries()).map(
                ([category, categoryChannels]) => {
                  const isCollapsed = collapsedCategories.has(category);
                  const visibleChannels = categoryChannels.filter((ch) =>
                    filteredChannels.includes(ch)
                  );

                  if (visibleChannels.length === 0) return null;

                  return (
                    <div key={category} className="mb-3">
                      {/* Catégorie header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-accent rounded-md transition-colors group"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[10px] ml-auto"
                        >
                          {visibleChannels.length}
                        </Badge>
                      </button>

                      {/* Canaux de la catégorie */}
                      {!isCollapsed && (
                        <div className="mt-1 space-y-0.5 ml-2">
                          {visibleChannels.map(renderChannel)}
                        </div>
                      )}
                    </div>
                  );
                }
              )
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer stats */}
      <div className="p-2 border-t flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>
            {channels.length} {channels.length > 1 ? "canaux" : "canal"}
          </span>
          <span>
            {channels.filter((ch) => !ch.isPrivate).length} publics •{" "}
            {channels.filter((ch) => ch.isPrivate).length} privés
          </span>
        </div>
      </div>
    </div>
  );
}
