"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, Send, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getThreadMessages, sendMessageWithThread } from "@/actions/chat.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatThreadViewProps {
  threadId: string;
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ChatThreadView({
  threadId,
  conversationId,
  currentUserId,
  onClose,
  onUpdate,
}: ChatThreadViewProps) {
  const [rootMessage, setRootMessage] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThread = async () => {
    try {
      const result = await getThreadMessages({ threadId });
      if (result?.data) {
        setRootMessage(result.data.rootMessage);
        setReplies(result.data.messages || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du fil de discussion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThread();
  }, [threadId]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || sending) return;

    setSending(true);
    try {
      const result = await sendMessageWithThread({
        conversationId,
        content: replyContent.trim(),
        threadId,
        replyToId: rootMessage?.id, // Optionnel, mais lie au parent techniquement
      });

      if (result?.data) {
        setReplyContent("");
        // Recharger les réponses
        const threadResult = await getThreadMessages({ threadId });
        if (threadResult?.data?.messages) {
          setReplies(threadResult.data.messages);
        }
        onUpdate(); // Mettre à jour la vue principale (compteurs, etc.)
      } else {
        toast.error(result?.serverError || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-l bg-background w-full md:w-80 lg:w-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rootMessage) {
    return (
      <div className="h-full flex flex-col items-center justify-center border-l bg-background w-full md:w-80 lg:w-96 p-4 text-center">
        <p className="text-muted-foreground mb-4">Fil de discussion introuvable</p>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l bg-background w-full md:w-80 lg:w-96 shadow-lg z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Fil de discussion</h3>
          <span className="text-xs text-muted-foreground">
            {replies.length} réponse{replies.length > 1 ? "s" : ""}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {/* Message Racine */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={rootMessage.User.avatar || undefined} />
              <AvatarFallback>
                {rootMessage.User.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm">{rootMessage.User.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(rootMessage.createdAt), "dd MMM HH:mm", {
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="pl-11">
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              {rootMessage.content}
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            Réponses
          </span>
        </div>

        {/* Liste des réponses */}
        <div className="space-y-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3 group">
              <Avatar className="h-6 w-6 mt-1">
                <AvatarImage src={reply.User.avatar || undefined} />
                <AvatarFallback className="text-[10px]">
                  {reply.User.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-xs">{reply.User.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(reply.createdAt), "HH:mm")}
                  </span>
                </div>
                <div className="text-sm wrap-break-word mt-0.5">{reply.content}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Répondre..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendReply}
            disabled={!replyContent.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
