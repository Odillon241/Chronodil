"use client";

import { useState, memo } from "react";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    MoreVertical,
    Edit2,
    Trash2,
    Reply,
    Pin,
    PinOff,
    MessageSquare,
    Smile,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { QuickEmojiPicker } from "@/components/ui/emoji-picker";
import type { Message } from "../types/chat.types";

interface ChatMessageBubbleProps {
    message: Message;
    currentUserId: string;
    isOwn: boolean;
    onEdit: (messageId: string, content: string) => void;
    onDelete: (messageId: string) => void;
    onReply: (message: Message) => void;
    onReaction: (messageId: string, emoji: string) => void;
    onPin: (messageId: string) => void;
    onUnpin: (messageId: string) => void;
    onThreadClick?: (threadId: string) => void;
}

// Fonction pour rendre le contenu avec les mentions
const renderMessageContent = (content: string) => {
    const mentionRegex = /@\[([^\]]+):([^\]]+)\]/g;
    const parts = content.split(mentionRegex);

    const result = [];
    for (let i = 0; i < parts.length; i++) {
        if (i % 3 === 0) {
            result.push(parts[i]);
        } else if (i % 3 === 1) {
            continue;
        } else {
            result.push(
                <span
                    key={i}
                    className="bg-primary/20 text-primary px-1 rounded font-medium"
                >
                    @{parts[i]}
                </span>
            );
        }
    }

    return result.length > 0 ? result : content;
};

const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
        return format(date, "HH:mm");
    }
    if (isYesterday(date)) {
        return "Hier " + format(date, "HH:mm");
    }
    return format(date, "dd/MM HH:mm", { locale: fr });
};

export const ChatMessageBubble = memo(function ChatMessageBubble({
    message,
    currentUserId,
    isOwn,
    onEdit,
    onDelete,
    onReply,
    onReaction,
    onPin,
    onUnpin,
    onThreadClick,
}: ChatMessageBubbleProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const reactions = message.reactions || {};
    const hasReactions = Object.keys(reactions).length > 0;
    const isPinned = !!message.pinnedAt;
    const hasThread = message.isThreadRoot && (message.threadCount || 0) > 0;

    return (
        <div
            className={cn(
                "group flex gap-2 sm:gap-3 px-3 py-1.5 hover:bg-muted/30 transition-colors duration-150",
                isOwn && "flex-row-reverse"
            )}
        >
            {/* Avatar */}
            {!isOwn && (
                <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-1 ring-border/50">
                    <AvatarImage src={message.User.avatar || message.User.image || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                        {message.User.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Message content */}
            <div className={cn("flex flex-col max-w-[75%] sm:max-w-[70%]", isOwn && "items-end")}>
                {/* Sender name (not for own messages) */}
                {!isOwn && (
                    <span className="text-xs font-medium text-muted-foreground mb-0.5 ml-1">
                        {message.User.name}
                    </span>
                )}

                {/* Reply indicator */}
                {message.replyTo && (
                    <div
                        className={cn(
                            "text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-t-lg border-l-2 border-primary/50 mb-0.5",
                            isOwn ? "mr-1" : "ml-1"
                        )}
                    >
                        <span className="font-medium">@{message.replyTo.User.name}</span>
                        <span className="ml-1 truncate max-w-[200px] inline-block align-bottom">
                            {message.replyTo.content.substring(0, 50)}
                            {message.replyTo.content.length > 50 && "..."}
                        </span>
                    </div>
                )}

                {/* Message bubble */}
                <div
                    className={cn(
                        "relative px-3 py-2 rounded-2xl text-sm transition-all duration-200",
                        isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted/70 rounded-bl-md",
                        isPinned && "ring-2 ring-amber-400/50",
                        message.isDeleted && "opacity-50 italic"
                    )}
                >
                    {/* Pinned indicator */}
                    {isPinned && (
                        <div className="absolute -top-2 -right-2">
                            <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="break-words whitespace-pre-wrap">
                        {message.isDeleted ? (
                            <span className="text-muted-foreground">Message supprimé</span>
                        ) : (
                            renderMessageContent(message.content)
                        )}
                    </div>

                    {/* Edited indicator */}
                    {message.isEdited && !message.isDeleted && (
                        <span className="text-[10px] opacity-60 ml-1">(modifié)</span>
                    )}
                </div>

                {/* Reactions */}
                {hasReactions && (
                    <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "mr-1" : "ml-1")}>
                        {Object.entries(reactions).map(([emoji, userIds]) => (
                            <button
                                key={emoji}
                                onClick={() => onReaction(message.id, emoji)}
                                className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                                    userIds.includes(currentUserId)
                                        ? "bg-primary/10 border-primary/30"
                                        : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                                )}
                            >
                                <span>{emoji}</span>
                                <span className="text-muted-foreground">{userIds.length}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Thread indicator */}
                {hasThread && onThreadClick && (
                    <button
                        onClick={() => onThreadClick(message.id)}
                        className={cn(
                            "flex items-center gap-1 mt-1 text-xs text-primary hover:underline",
                            isOwn ? "mr-1" : "ml-1"
                        )}
                    >
                        <MessageSquare className="h-3 w-3" />
                        {message.threadCount} réponse{(message.threadCount || 0) > 1 ? "s" : ""}
                    </button>
                )}

                {/* Time & Actions */}
                <div
                    className={cn(
                        "flex items-center gap-2 mt-0.5",
                        isOwn ? "mr-1 flex-row-reverse" : "ml-1"
                    )}
                >
                    <span className="text-[10px] text-muted-foreground">
                        {formatMessageTime(new Date(message.createdAt))}
                    </span>

                    {/* Actions (visible on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        {/* Quick emoji */}
                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Smile className="h-3 w-3" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1" side="top">
                                <QuickEmojiPicker
                                    onEmojiSelect={(emoji: string) => {
                                        onReaction(message.id, emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Reply */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onReply(message)}
                                    >
                                        <Reply className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Répondre</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* More actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwn ? "end" : "start"}>
                                {isPinned ? (
                                    <DropdownMenuItem onClick={() => onUnpin(message.id)}>
                                        <PinOff className="mr-2 h-4 w-4" />
                                        Désépingler
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onPin(message.id)}>
                                        <Pin className="mr-2 h-4 w-4" />
                                        Épingler
                                    </DropdownMenuItem>
                                )}

                                {isOwn && !message.isDeleted && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onEdit(message.id, message.content)}>
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(message.id)}
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
                </div>
            </div>
        </div>
    );
});
