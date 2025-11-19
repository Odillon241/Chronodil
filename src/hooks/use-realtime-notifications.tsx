"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeNotificationsProps {
  onNewNotification: (notification: any) => void;
  userId: string;
}

/**
 * Hook optimisé pour écouter les nouvelles notifications en temps réel
 * Surveille la table Notification pour détecter les nouvelles notifications
 */
export function useRealtimeNotifications({ onNewNotification, userId }: UseRealtimeNotificationsProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);

  const stableOnNewNotification = useCallback(onNewNotification, [onNewNotification]);

  useEffect(() => {
    if (!userId) {
      console.warn('[Realtime Notifications] userId non fourni, skip subscription');
      return;
    }

    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour les notifications...');

      channelRef.current = supabase
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
            const newNotification = payload.new;

            if (newNotification) {
              console.log('🔔 Nouvelle notification reçue:', newNotification);
              stableOnNewNotification(newNotification);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time Notifications:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log('✅ Subscription real-time active pour les notifications');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            isSubscribedRef.current = false;
            console.warn('⚠️ Erreur de connexion real-time notifications, tentative de reconnexion...');

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
              console.error('❌ Nombre maximum de tentatives de reconnexion atteint (Notifications)');
              toast.error('Connexion real-time des notifications perdue. Veuillez rafraîchir la page.', {
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
        console.log('🧹 Nettoyage de la subscription real-time Notifications...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [stableOnNewNotification, userId]);
}
