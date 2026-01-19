"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Send,
    Smile,
    Paperclip,
    X,
    File,
    Image as ImageIcon,
    AtSign,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { useChatInput } from "../hooks/use-chat-input";
import { VoiceRecorderButton } from "./voice-recorder-button";
import type { Message } from "../types/chat.types";

interface ChatMessageInputProps {
    conversationId: string;
    currentUserId: string;
    currentUserName: string;
    members: { id: string; name: string; avatar?: string | null }[];
    replyingTo: Message | null;
    onCancelReply: () => void;
    onSend: (content: string, attachments: File[]) => Promise<boolean>;
    disabled?: boolean;
}

export function ChatMessageInput({
    conversationId,
    currentUserId,
    currentUserName,
    members,
    replyingTo,
    onCancelReply,
    onSend,
    disabled = false,
}: ChatMessageInputProps) {
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        message,
        setMessage,
        attachments,
        inputRef,
        draftSaved,
        showMentions,
        filteredMentions,
        typingUsers,
        handleInputChange,
        handleInsertMention,
        addAttachments,
        removeAttachment,
        clearInput,
    } = useChatInput({
        conversationId,
        currentUserId,
        currentUserName,
        members,
    });

    const handleSend = async () => {
        if ((!message.trim() && attachments.length === 0) || sending || disabled) return;

        setSending(true);
        const success = await onSend(message, attachments);
        if (success) {
            clearInput();
            onCancelReply();
        }
        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            addAttachments(files);
        }
        e.target.value = "";
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const isImage = (file: File) => file.type.startsWith("image/");

    return (
        <div className="border-t bg-background/80 backdrop-blur-sm">
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
                <div className="px-4 py-1.5 text-xs text-muted-foreground animate-pulse">
                    {typingUsers.length === 1
                        ? `${typingUsers[0]} est en train d'écrire...`
                        : `${typingUsers.slice(0, 2).join(", ")} ${typingUsers.length > 2 ? `et ${typingUsers.length - 2} autre(s)` : ""
                        } sont en train d'écrire...`}
                </div>
            )}

            {/* Reply preview */}
            {replyingTo && (
                <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground">
                            Réponse à{" "}
                            <span className="font-medium text-foreground">
                                {replyingTo.User.name}
                            </span>
                        </span>
                        <p className="text-sm truncate text-muted-foreground">
                            {replyingTo.content}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={onCancelReply}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="px-4 py-2 border-b">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-2">
                            {attachments.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative group shrink-0 rounded-lg border bg-muted/30 overflow-hidden"
                                >
                                    {isImage(file) ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="h-16 w-16 object-cover"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 flex flex-col items-center justify-center p-2">
                                            <File className="h-6 w-6 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground truncate max-w-full">
                                                {file.name.substring(0, 10)}
                                            </span>
                                        </div>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeAttachment(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Input area */}
            <div className="p-3 sm:p-4 flex items-center gap-2">
                {/* Emoji picker */}
                <EmojiPicker
                    onEmojiSelect={(emoji: string) => {
                        setMessage(message + emoji);
                        inputRef.current?.focus();
                    }}
                    trigger={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            disabled={disabled}
                        >
                            <Smile className="h-5 w-5" />
                        </Button>
                    }
                />

                {/* File input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                >
                    <Paperclip className="h-5 w-5" />
                </Button>

                {/* Voice recorder */}
                <VoiceRecorderButton
                    onRecordingComplete={async (audioFile) => {
                        // Envoyer directement le message vocal
                        setSending(true);
                        const success = await onSend("", [audioFile]);
                        if (success) {
                            clearInput();
                        }
                        setSending(false);
                    }}
                    disabled={disabled || sending}
                />

                {/* Text input */}
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        placeholder="Écrire un message..."
                        value={message}
                        onChange={(e) =>
                            handleInputChange(e.target.value, e.target.selectionStart || 0)
                        }
                        onKeyDown={handleKeyDown}
                        disabled={disabled || sending}
                        className="pr-10 bg-muted/50 border border-input/50 rounded-full focus-visible:ring-1 focus-visible:ring-primary/30"
                    />

                    {/* Draft saved indicator */}
                    {draftSaved && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            Brouillon
                        </span>
                    )}

                    {/* Mentions dropdown */}
                    {showMentions && filteredMentions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-3 w-full max-w-xs bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
                            <ScrollArea className="max-h-48">
                                {filteredMentions.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleInsertMention(member.id, member.name)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={member.avatar || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {member.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{member.name}</span>
                                    </button>
                                ))}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* Send button */}
                <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full"
                    onClick={handleSend}
                    disabled={
                        (!message.trim() && attachments.length === 0) || sending || disabled
                    }
                >
                    {sending ? (
                        <Spinner className="h-4 w-4" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
