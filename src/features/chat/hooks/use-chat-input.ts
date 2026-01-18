"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRealtimeTyping } from "@/hooks/use-realtime-typing";

interface UseChatInputProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  members: { id: string; name: string; avatar?: string | null }[];
}

export function useChatInput({
  conversationId,
  currentUserId,
  currentUserName,
  members,
}: UseChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const [draftSaved, setDraftSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hook d'indicateur de frappe
  const { typingUsers, onTyping, stopTyping } = useRealtimeTyping({
    conversationId,
    currentUserId,
    currentUserName,
  });

  // Clé localStorage pour le brouillon
  const getDraftKey = useCallback(() => `chat-draft-${conversationId}`, [conversationId]);

  // Sauvegarder le brouillon
  const saveDraft = useCallback(
    (text: string) => {
      if (text.trim()) {
        localStorage.setItem(getDraftKey(), text);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } else {
        localStorage.removeItem(getDraftKey());
        setDraftSaved(false);
      }
    },
    [getDraftKey]
  );

  // Restaurer le brouillon au chargement
  useEffect(() => {
    const draft = localStorage.getItem(getDraftKey());
    if (draft) {
      setMessage(draft);
    }

    return () => {
      if (message.trim()) {
        localStorage.setItem(getDraftKey(), message);
      }
    };
  }, [conversationId]);

  // Sauvegarde auto du brouillon
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
  }, [message, saveDraft]);

  // Filtrer les membres pour les mentions
  const filteredMentions = useMemo(() => {
    const otherMembers = members.filter((m) => m.id !== currentUserId);
    if (!mentionQuery) return otherMembers;
    return otherMembers.filter((m) =>
      m.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [members, mentionQuery, currentUserId]);

  // Gérer le changement de l'input
  const handleInputChange = useCallback(
    (value: string, cursorPos: number) => {
      setMessage(value);
      onTyping();

      // Détecter les mentions
      const textBeforeCursor = value.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(" ") && !textAfterAt.includes("[")) {
          setShowMentions(true);
          setMentionQuery(textAfterAt);
          setMentionCursorPosition(lastAtIndex);
          return;
        }
      }

      setShowMentions(false);
      setMentionQuery("");
    },
    [onTyping]
  );

  // Insérer une mention
  const handleInsertMention = useCallback(
    (userId: string, userName: string) => {
      if (!inputRef.current) return;

      const input = inputRef.current;
      const cursorPos = input.selectionStart || 0;
      const textBefore = message.substring(0, mentionCursorPosition);
      const textAfter = message.substring(cursorPos);

      const mention = `@[${userId}:${userName}] `;
      const newMessage = textBefore + mention + textAfter;

      setMessage(newMessage);
      setShowMentions(false);
      setMentionQuery("");

      setTimeout(() => {
        const newCursorPos = textBefore.length + mention.length;
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [message, mentionCursorPosition]
  );

  // Ajouter des attachments
  const addAttachments = useCallback((files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
  }, []);

  // Supprimer un attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Effacer tout après envoi
  const clearInput = useCallback(() => {
    setMessage("");
    setAttachments([]);
    localStorage.removeItem(getDraftKey());
    setDraftSaved(false);
  }, [getDraftKey]);

  return {
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
    stopTyping,
  };
}
