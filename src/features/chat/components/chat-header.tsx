"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    Users,
    FolderKanban,
    Search,
    MoreVertical,
    Bell,
    BellOff,
    Info,
    Video,
    ArrowLeft,
} from "lucide-react";
import { useRealtimePresence } from "@/hooks/use-realtime-presence";
import { formatLastSeen, getPresenceLabel } from "@/lib/utils/presence";
import type { Conversation } from "../types/chat.types";

interface ChatHeaderProps {
    conversation: Conversation;
    currentUserId: string;
    onShowSearch: () => void;
    onShowInfo: () => void;
    onVideoCall?: () => void;
    onToggleMute: () => void;
    onBack?: () => void;
    isMuted: boolean;
    isAdmin: boolean;
}

export function ChatHeader({
    conversation,
    currentUserId,
    onShowSearch,
    onShowInfo,
    onVideoCall,
    onToggleMute,
    onBack,
    isMuted,
    isAdmin,
}: ChatHeaderProps) {
    const { isUserOnline, getLastSeenAt } = useRealtimePresence();

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

    const getOtherUser = () => {
        if (conversation.type !== "DIRECT") return null;
        return conversation.ConversationMember.find(
            (m) => m.User.id !== currentUserId
        )?.User;
    };

    const otherUser = getOtherUser();
    const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
    const lastSeen = otherUser ? getLastSeenAt(otherUser.id) : null;

    return (
        <div className="relative px-3 sm:px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
                {/* Left: Back button on mobile + Avatar + Title */}
                <div
                    className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-lg transition-all duration-200"
                    onClick={onShowInfo}
                >
                    {/* Back button on mobile */}
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onBack();
                            }}
                            className="md:hidden h-8 w-8 shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Avatar */}
                    {conversation.type === "PROJECT" && conversation.Project ? (
                        <div
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: conversation.Project.color }}
                        >
                            <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                    ) : conversation.type === "GROUP" || conversation.type === "CHANNEL" ? (
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative">
                                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 ring-2 ring-background shadow-sm">
                                            <AvatarImage
                                                src={otherUser?.avatar || otherUser?.image || undefined}
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm">
                                                {getConversationTitle().substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Presence indicator */}
                                        <span
                                            className={cn(
                                                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background transition-colors",
                                                isOnline ? "bg-emerald-500" : "bg-gray-400"
                                            )}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    {isOnline
                                        ? "En ligne"
                                        : `Hors ligne • ${formatLastSeen(lastSeen)}`}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Title & Status */}
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-sm sm:text-base truncate">
                            {getConversationTitle()}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {conversation.type === "DIRECT" ? (
                                getPresenceLabel(isOnline ? new Date() : lastSeen)
                            ) : (
                                `${conversation.ConversationMember.length} membre${conversation.ConversationMember.length > 1 ? "s" : ""
                                }`
                            )}
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Video call for direct conversations */}
                    {onVideoCall && conversation.type === "DIRECT" && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onVideoCall}
                                        className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted/80"
                                    >
                                        <Video className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Appel vidéo</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Search */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onShowSearch}
                                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted/80"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rechercher</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* More actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted/80"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={onShowInfo}>
                                <Info className="mr-2 h-4 w-4" />
                                Informations
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={onToggleMute}>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
