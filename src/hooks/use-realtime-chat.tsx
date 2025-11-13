"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeChatProps {
  onConversationChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', conversationId?: string) => void;
  onMessageChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', messageId?: string, conversationId?: string) => void;
  userId?: string;
}

// ⚡ Hook optimisé pour Realtime Chat
export function useRealtimeChat({ onConversationChange, onMessageChange, userId }: UseRealtimeChatProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);

  const stableOnConversationChange = useCallback(onConversationChange, [onConversationChange]);
  const stableOnMessageChange = useCallback(onMessageChange, [onMessageChange]);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour le chat...');

      channelRef.current = supabase
        .channel('chat-realtime-channel', {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' }
          }
        })
        // Écouter les changements sur la table Conversation
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Conversation'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const conversationId = (payload.new as any)?.id || (payload.old as any)?.id;
            const conversationName = (payload.new as any)?.name || (payload.old as any)?.name;

            console.log(`💬 Événement Conversation ${eventType}:`, { conversationId, conversationName });

            if (eventType === 'INSERT') {
              toast.info(`Nouvelle conversation: ${conversationName || 'Sans nom'}`, {
                duration: 3000,
              });
            } else if (eventType === 'DELETE') {
              toast.info(`Conversation supprimée: ${conversationName || 'Sans nom'}`, {
                duration: 3000,
              });
            }

            stableOnConversationChange(eventType, conversationId);
          }
        )
        // Écouter les changements sur ConversationMember
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ConversationMember'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const conversationId = (payload.new as any)?.conversationId || (payload.old as any)?.conversationId;
            const memberUserId = (payload.new as any)?.userId || (payload.old as any)?.userId;

            console.log(`👥 Événement ConversationMember ${eventType} pour conversation:`, conversationId);

            // Notifier seulement si c'est l'utilisateur actuel qui a été ajouté
            if (eventType === 'INSERT' && memberUserId === userId) {
              toast.info('Vous avez été ajouté à une conversation', {
                duration: 3000,
              });
            }

            stableOnConversationChange('UPDATE', conversationId);
          }
        )
        // Écouter les changements sur Message
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Message'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const messageId = (payload.new as any)?.id || (payload.old as any)?.id;
            const conversationId = (payload.new as any)?.conversationId || (payload.old as any)?.conversationId;
            const senderId = (payload.new as any)?.senderId || (payload.old as any)?.senderId;

            console.log(`📨 Événement Message ${eventType} pour conversation:`, conversationId);

            // Notifier seulement si ce n'est pas notre propre message
            if (eventType === 'INSERT' && senderId !== userId) {
              toast.info('Nouveau message reçu', {
                duration: 2000,
              });
            }

            stableOnMessageChange(eventType, messageId, conversationId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time Chat:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log('✅ Subscription real-time active pour le chat');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            isSubscribedRef.current = false;
            console.warn('⚠️ Erreur de connexion real-time, tentative de reconnexion...');

            if (retryCountRef.current < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
              retryCountRef.current++;

              reconnectTimeout = setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                  channelRef.current = null;
                }
                isSubscribedRef.current = false;
                setupChannel();
              }, delay);
            } else {
              console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
              toast.error('Connexion real-time perdue. Veuillez rafraîchir la page.', {
                duration: 5000,
              });
            }
          }
        });
    };

    setupChannel();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channelRef.current) {
        console.log('🧹 Nettoyage de la subscription real-time Chat...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [stableOnConversationChange, stableOnMessageChange, userId]);
}
