"use client";

import { useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeNotificationsProps {
  onNewNotification: (notification: any) => void;
  userId: string;
  enabled?: boolean;
}

/**
 * Hook optimisé pour écouter les nouvelles notifications en temps réel
 * Surveille la table Notification pour détecter les nouvelles notifications
 */
export function useRealtimeNotifications({ onNewNotification, userId, enabled = true }: UseRealtimeNotificationsProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10; // Augmenté pour plus de résilience
  const isSubscribedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownErrorRef = useRef(false);

  // Utiliser le singleton Supabase
  const supabase = useMemo(() => createClient(), []);
  
  // Garder une référence stable du callback
  const onNewNotificationRef = useRef(onNewNotification);
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    let isMounted = true;

    const cleanupChannel = async () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current);
        } catch {
          // Ignorer les erreurs de nettoyage
        }
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };

    const setupChannel = () => {
      if (!isMounted || channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour les notifications...');

      const channel = supabase
        .channel(`notifications-realtime-${userId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: userId }
          }
        })
        // Écouter UNIQUEMENT les nouvelles notifications (INSERT) pour l'utilisateur connecté
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            hasShownErrorRef.current = false;
            const newNotification = payload.new;

            if (newNotification) {
              console.log('🔔 Nouvelle notification reçue:', newNotification);
              onNewNotificationRef.current?.(newNotification);
            }
          }
        )
        .subscribe((status) => {
          // Ignorer les callbacks si le composant est démonté (React Strict Mode)
          if (!isMounted) return;

          console.log('📡 Statut de la subscription real-time Notifications:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            hasShownErrorRef.current = false;
            console.log('✅ Subscription real-time active pour les notifications');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            isSubscribedRef.current = false;
            console.warn(`⚠️ Erreur de connexion real-time Notifications (${status}), tentative ${retryCountRef.current + 1}/${maxRetries}...`);

            if (retryCountRef.current < maxRetries && isMounted) {
              // Backoff exponentiel avec jitter
              const baseDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000);
              const jitter = Math.random() * 1000;
              const delay = baseDelay + jitter;
              retryCountRef.current++;

              console.log(`🔄 Reconnexion Notifications dans ${Math.round(delay / 1000)}s...`);

              reconnectTimeoutRef.current = setTimeout(async () => {
                if (!isMounted) return;
                await cleanupChannel();
                if (isMounted) {
                  setupChannel();
                }
              }, delay);
            } else if (isMounted && !hasShownErrorRef.current) {
              hasShownErrorRef.current = true;
              console.warn('⚠️ Connexion real-time Notifications en mode dégradé');
              // Ne pas afficher de toast - les notifications peuvent être récupérées par polling
            }
          }
        });

      channelRef.current = channel;
    };

    setupChannel();

    // Reconnexion quand la page redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSubscribedRef.current && isMounted) {
        console.log('👁️ Page visible, tentative de reconnexion Notifications...');
        retryCountRef.current = 0;
        hasShownErrorRef.current = false;
        cleanupChannel().then(() => {
          if (isMounted) setupChannel();
        });
      }
    };

    // Reconnexion quand le réseau revient
    const handleOnline = () => {
      if (isMounted && !isSubscribedRef.current) {
        console.log('🌐 Connexion réseau rétablie, reconnexion Notifications...');
        retryCountRef.current = 0;
        hasShownErrorRef.current = false;
        cleanupChannel().then(() => {
          if (isMounted) setupChannel();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        console.log('🧹 Nettoyage de la subscription real-time Notifications...');
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [supabase, userId, enabled]);
}
