"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getUserConversations } from "@/actions/chat.actions";
import { useRealtimeChat } from "./use-realtime-chat";

export function useChatUnreadCount() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await getUserConversations({});
      const total =
        result?.data?.conversations?.reduce((acc: number, conv: any) => {
          return acc + (conv.unreadCount || 0);
        }, 0) ?? 0;
      setUnreadCount(total);
    } catch (error) {
      console.error("[Chat] Erreur lors du calcul des non-lus", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refreshUnread();
    }
  }, [userId, refreshUnread]);

  // Callbacks memoizés pour éviter les re-renders infinis
  const handleConversationChange = useCallback(() => {
    refreshUnread();
  }, [refreshUnread]);

  const handleMessageChange = useCallback(() => {
    refreshUnread();
  }, [refreshUnread]);

  useRealtimeChat({
    userId,
    onConversationChange: handleConversationChange,
    onMessageChange: handleMessageChange,
  });

  return {
    unreadCount,
    loading,
    refreshUnread,
  };
}
