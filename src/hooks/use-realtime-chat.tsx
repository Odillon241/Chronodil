"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useDesktopNotifications } from "./use-desktop-notifications";

interface UseRealtimeChatProps {
  onConversationChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', conversationId?: string) => void;
  onMessageChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', messageId?: string, conversationId?: string) => void;
  userId?: string;
}

interface UseRealtimeChatReturn {
  isConnected: boolean;
  reconnect: () => void;
}

// ⚡ Hook optimisé pour Realtime Chat avec reconnexion améliorée
export function useRealtimeChat({ onConversationChange, onMessageChange, userId }: UseRealtimeChatProps): UseRealtimeChatReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 15; // Augmenté de 5 à 15
  const isSubscribedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { notifyNewMessage } = useDesktopNotifications();
  const conversationChangeRef = useRef(onConversationChange);
  const messageChangeRef = useRef(onMessageChange);
  const notifyNewMessageRef = useRef(notifyNewMessage);
  
  // Créer le client une seule fois
  const supabase = useMemo(() => createClient(), []);
  const channelName = useMemo(() => `chat-realtime`, []);

  // Conserver les handlers les plus récents sans redémarrer la souscription
  useEffect(() => {
    conversationChangeRef.current = onConversationChange;
  }, [onConversationChange]);

  useEffect(() => {
    messageChangeRef.current = onMessageChange;
  }, [onMessageChange]);

  useEffect(() => {
    notifyNewMessageRef.current = notifyNewMessage;
  }, [notifyNewMessage]);

  // Fonction pour nettoyer le channel proprement
  const cleanupChannel = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (channelRef.current) {
      try {
        await supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Erreur lors du nettoyage du channel:', error);
      }
      channelRef.current = null;
    }
    isSubscribedRef.current = false;
    setIsConnected(false);
  }, [supabase]);

  // Fonction de reconnexion exposée
  const reconnect = useCallback(() => {
    console.log('🔄 Reconnexion manuelle demandée...');
    retryCountRef.current = 0;
    cleanupChannel().then(() => {
      // La reconnexion sera gérée par l'effet
      window.dispatchEvent(new Event('realtime-reconnect'));
    });
  }, [cleanupChannel]);

  useEffect(() => {
    let isMounted = true;

    const setupChannel = () => {
      if (!isMounted || channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour le chat...', channelName);

      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' }
          }
        })
        // Broadcast immédiat pour les nouveaux messages (faible latence)
        .on(
          'broadcast',
          { event: 'message:new' },
          (payload) => {
            const messageId = (payload as any)?.payload?.messageId;
            const conversationId = (payload as any)?.payload?.conversationId;
            const senderId = (payload as any)?.payload?.senderId;
            if (senderId === userId) return;
            messageChangeRef.current?.('INSERT', messageId, conversationId);
          }
        )
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

            conversationChangeRef.current?.(eventType, conversationId);
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

            conversationChangeRef.current?.('UPDATE', conversationId);
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
              const senderName = 'Quelqu\'un'; // Peut être amélioré avec une requête séparée

              toast.info('Nouveau message reçu', {
                duration: 2000,
              });

              // Afficher la notification de bureau (tag = conversationId pour dédoublonner)
              notifyNewMessageRef.current?.(
                senderName,
                undefined, // conversationName non disponible dans le payload
                () => {
                  window.location.href = `/dashboard/chat?conversation=${conversationId}`;
                },
                {
                  tag: conversationId,
                  data: { conversationId },
                }
              );
            }

            messageChangeRef.current?.(eventType, messageId, conversationId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time Chat:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            setIsConnected(true);
            console.log('✅ Subscription real-time active pour le chat');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            isSubscribedRef.current = false;
            setIsConnected(false);
            console.warn(`⚠️ Erreur de connexion real-time (${status}), tentative ${retryCountRef.current + 1}/${maxRetries}...`);

            if (retryCountRef.current < maxRetries && isMounted) {
              // Backoff exponentiel avec jitter pour éviter les tempêtes de reconnexion
              const baseDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000);
              const jitter = Math.random() * 1000;
              const delay = baseDelay + jitter;
              retryCountRef.current++;

              console.log(`🔄 Reconnexion dans ${Math.round(delay / 1000)}s...`);

              reconnectTimeoutRef.current = setTimeout(async () => {
                if (!isMounted) return;
                await cleanupChannel();
                if (isMounted) {
                  setupChannel();
                }
              }, delay);
            } else if (isMounted) {
              console.warn('⚠️ Connexion real-time Chat en mode dégradé (fonctionnement sans temps réel)');
              // Ne pas afficher de toast d'erreur répétitif - le chat fonctionne par polling
              // L'utilisateur peut utiliser le bouton reconnect si nécessaire
            }
          }
        });

      channelRef.current = channel;
    };

    // Configurer le channel au montage
    setupChannel();

    // Reconnexion automatique quand la page redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSubscribedRef.current && isMounted) {
        console.log('👁️ Page visible, vérification de la connexion real-time...');
        if (!channelRef.current || !isSubscribedRef.current) {
          retryCountRef.current = 0;
          cleanupChannel().then(() => {
            if (isMounted) setupChannel();
          });
        }
      }
    };

    // Reconnexion manuelle
    const handleReconnect = () => {
      if (isMounted) {
        cleanupChannel().then(() => {
          if (isMounted) setupChannel();
        });
      }
    };

    // Reconnexion quand la connexion réseau est rétablie
    const handleOnline = () => {
      if (isMounted && !isSubscribedRef.current) {
        console.log('🌐 Connexion réseau rétablie, reconnexion...');
        retryCountRef.current = 0;
        cleanupChannel().then(() => {
          if (isMounted) setupChannel();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('realtime-reconnect', handleReconnect);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('realtime-reconnect', handleReconnect);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        console.log('🧹 Nettoyage de la subscription real-time Chat...');
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [channelName, supabase, userId, cleanupChannel]);

  return { isConnected, reconnect };
}
