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
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
    X,
    Download,
    Forward,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { QuickEmojiPicker } from "@/components/ui/emoji-picker";
import { ChatAttachmentViewer } from "@/components/features/chat-attachment-viewer";
import { VoiceMessagePlayer } from "./voice-message-player";
import { ForwardMessageDialog } from "./forward-message-dialog";
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
    onForward?: (conversationId: string, message: Message) => Promise<void>;
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
    onForward,
}: ChatMessageBubbleProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
    const [showForwardDialog, setShowForwardDialog] = useState(false);

    const reactions = message.reactions || {};
    const hasReactions = Object.keys(reactions).length > 0;
    const isPinned = !!message.pinnedAt;
    const hasThread = message.isThreadRoot && (message.threadCount || 0) > 0;

    // Détection du type de contenu pour adapter le menu
    const hasTextContent = message.content && message.content !== "(Fichier joint)";
    const hasMediaAttachments = message.attachments?.some(
        (a) => a.type.startsWith("image/") || a.type.startsWith("video/") || a.type.startsWith("audio/")
    );
    const isMediaOnlyMessage = hasMediaAttachments && !hasTextContent;
    const firstMediaUrl = message.attachments?.find(
        (a) => a.type.startsWith("image/") || a.type.startsWith("video/") || a.type.startsWith("audio/")
    )?.url;

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
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

                            {/* Media attachments (images/videos) - displayed OUTSIDE the bubble */}
                            {!message.isDeleted && message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2 mb-1">
                                    {message.attachments
                                        .filter((a) => a.type.startsWith("image/") || a.type.startsWith("video/"))
                                        .map((attachment) => (
                                            <div key={attachment.id} className="rounded-2xl overflow-hidden">
                                                {attachment.type.startsWith("image/") ? (
                                                    <img
                                                        src={attachment.url}
                                                        alt={attachment.name}
                                                        className="max-w-full max-h-64 object-cover cursor-pointer rounded-2xl hover:opacity-90 transition-opacity"
                                                        onClick={() => setPreviewImage({ url: attachment.url, name: attachment.name })}
                                                    />
                                                ) : (
                                                    <video
                                                        src={attachment.url}
                                                        controls
                                                        className="max-w-full max-h-64 rounded-2xl"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Message bubble - only for text, audio, and other files */}
                            {(!message.isDeleted && (
                                (message.content && message.content !== "(Fichier joint)") ||
                                message.attachments?.some((a) => a.type.startsWith("audio/") || (!a.type.startsWith("image/") && !a.type.startsWith("video/")))
                            )) && (
                                    <div
                                        className={cn(
                                            "relative px-3 py-2 rounded-2xl text-sm transition-all duration-200",
                                            isOwn
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-muted/70 rounded-bl-md",
                                            isPinned && "ring-2 ring-amber-400/50"
                                        )}
                                    >
                                        {/* Pinned indicator */}
                                        {isPinned && (
                                            <div className="absolute -top-2 -right-2">
                                                <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                            </div>
                                        )}

                                        {/* Text content */}
                                        {message.content && message.content !== "(Fichier joint)" && (
                                            <div className="break-words whitespace-pre-wrap">
                                                {renderMessageContent(message.content)}
                                            </div>
                                        )}

                                        {/* Audio and other files */}
                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className={message.content && message.content !== "(Fichier joint)" ? "mt-2 space-y-2" : "space-y-2"}>
                                                {message.attachments
                                                    .filter((a) => !a.type.startsWith("image/") && !a.type.startsWith("video/"))
                                                    .map((attachment) => {
                                                        if (attachment.type.startsWith("audio/")) {
                                                            return (
                                                                <VoiceMessagePlayer
                                                                    key={attachment.id}
                                                                    url={attachment.url}
                                                                    isCurrentUser={isOwn}
                                                                />
                                                            );
                                                        }
                                                        return (
                                                            <ChatAttachmentViewer
                                                                key={attachment.id}
                                                                attachment={{
                                                                    name: attachment.name,
                                                                    type: attachment.type,
                                                                    size: attachment.size,
                                                                    url: attachment.url,
                                                                }}
                                                                isCurrentUser={isOwn}
                                                            />
                                                        );
                                                    })}
                                            </div>
                                        )}

                                        {/* Edited indicator */}
                                        {message.isEdited && (
                                            <span className="text-[10px] opacity-60 ml-1">(modifié)</span>
                                        )}
                                    </div>
                                )}

                            {/* Deleted message bubble */}
                            {message.isDeleted && (
                                <div
                                    className={cn(
                                        "relative px-3 py-2 rounded-2xl text-sm opacity-50 italic",
                                        isOwn
                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                            : "bg-muted/70 rounded-bl-md"
                                    )}
                                >
                                    <span className="text-muted-foreground">Message supprimé</span>
                                </div>
                            )}

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

                                                    {/* Télécharger - seulement pour les médias */}
                                                    {hasMediaAttachments && firstMediaUrl && (
                                                        <DropdownMenuItem onClick={() => window.open(firstMediaUrl, "_blank")}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Télécharger
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* Modifier - seulement si le message contient du texte (pas pour médias seuls) */}
                                                    {hasTextContent && (
                                                        <DropdownMenuItem onClick={() => onEdit(message.id, message.content)}>
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* Transférer - disponible pour tous les types */}
                                                    <DropdownMenuItem
                                                        onClick={() => setShowForwardDialog(true)}
                                                    >
                                                        <Forward className="mr-2 h-4 w-4" />
                                                        Transférer
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

                        {/* Image Preview Dialog */}
                        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                            <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-none [&>button]:hidden">
                                <VisuallyHidden>
                                    <DialogTitle>Aperçu de l'image</DialogTitle>
                                </VisuallyHidden>
                                <div className="relative flex items-center justify-center min-h-[300px]">
                                    {/* Close button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                                        onClick={() => setPreviewImage(null)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>

                                    {/* Download button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-12 z-10 text-white hover:bg-white/20"
                                        onClick={() => previewImage && window.open(previewImage.url, "_blank")}
                                    >
                                        <Download className="h-5 w-5" />
                                    </Button>

                                    {/* Image */}
                                    {previewImage && (
                                        <img
                                            src={previewImage.url}
                                            alt={previewImage.name}
                                            className="max-w-full max-h-[85vh] object-contain"
                                        />
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </ContextMenuTrigger>

                {/* Right-click Context Menu */}
                <ContextMenuContent>
                    {/* Répondre */}
                    <ContextMenuItem onClick={() => onReply(message)}>
                        <Reply className="mr-2 h-4 w-4" />
                        Répondre
                    </ContextMenuItem>

                    {/* Épingler/Désépingler */}
                    {isPinned ? (
                        <ContextMenuItem onClick={() => onUnpin(message.id)}>
                            <PinOff className="mr-2 h-4 w-4" />
                            Désépingler
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem onClick={() => onPin(message.id)}>
                            <Pin className="mr-2 h-4 w-4" />
                            Épingler
                        </ContextMenuItem>
                    )}

                    {isOwn && !message.isDeleted && (
                        <>
                            <ContextMenuSeparator />

                            {/* Télécharger - seulement pour les médias */}
                            {hasMediaAttachments && firstMediaUrl && (
                                <ContextMenuItem onClick={() => window.open(firstMediaUrl, "_blank")}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Télécharger
                                </ContextMenuItem>
                            )}

                            {/* Modifier - seulement pour le texte */}
                            {hasTextContent && (
                                <ContextMenuItem onClick={() => onEdit(message.id, message.content)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Modifier
                                </ContextMenuItem>
                            )}

                            {/* Transférer */}
                            <ContextMenuItem onClick={() => setShowForwardDialog(true)}>
                                <Forward className="mr-2 h-4 w-4" />
                                Transférer
                            </ContextMenuItem>

                            <ContextMenuItem
                                onClick={() => onDelete(message.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </ContextMenuItem>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            {/* Forward Message Dialog - Outside ContextMenu */}
            {
                onForward && (
                    <ForwardMessageDialog
                        open={showForwardDialog}
                        onOpenChange={setShowForwardDialog}
                        message={message}
                        currentUserId={currentUserId}
                        onForward={onForward}
                    />
                )
            }
        </>
    );
});
