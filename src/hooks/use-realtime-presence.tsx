"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Constantes pour la détection de présence
const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

interface PresenceData {
  userId: string;
  lastSeenAt: Date | null;
  isOnline: boolean;
}

/**
 * Hook pour suivre la présence des utilisateurs en temps réel
 *
 * Écoute les changements de lastSeenAt via Supabase Realtime
 * Calcule le statut en ligne/hors ligne selon le threshold
 */
export function useRealtimePresence() {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceData>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  /**
   * Vérifie si un utilisateur est en ligne
   */
  const isUserOnline = useCallback((userId: string): boolean => {
    const presence = presenceMap.get(userId);
    if (!presence || !presence.lastSeenAt) return false;

    const now = Date.now();
    const lastSeen = presence.lastSeenAt.getTime();
    return now - lastSeen < ONLINE_THRESHOLD;
  }, [presenceMap]);

  /**
   * Récupère la liste des utilisateurs en ligne
   */
  const getOnlineUsers = useCallback((): string[] => {
    const onlineUsers: string[] = [];
    presenceMap.forEach((presence, userId) => {
      if (presence.isOnline) {
        onlineUsers.push(userId);
      }
    });
    return onlineUsers;
  }, [presenceMap]);

  /**
   * Récupère le dernier temps vu pour un utilisateur
   */
  const getLastSeenAt = useCallback((userId: string): Date | null => {
    return presenceMap.get(userId)?.lastSeenAt || null;
  }, [presenceMap]);

  /**
   * Met à jour le statut de présence d'un utilisateur
   */
  const updatePresence = useCallback((userId: string, lastSeenAt: Date | null) => {
    setPresenceMap((prev) => {
      const newMap = new Map(prev);
      const now = Date.now();
      const isOnline = lastSeenAt
        ? now - lastSeenAt.getTime() < ONLINE_THRESHOLD
        : false;

      newMap.set(userId, {
        userId,
        lastSeenAt,
        isOnline,
      });

      return newMap;
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;
    let presenceCheckInterval: NodeJS.Timeout;

    const setupChannel = () => {
      // Éviter les doublons de channel
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log("🔄 Configuration du real-time Supabase pour la présence...");

      channelRef.current = supabase
        .channel("presence-realtime-channel", {
          config: {
            broadcast: { self: false },
          },
        })
        .on<Record<string, any>>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "User",
            filter: "lastSeenAt=not.is.null", // Seulement les updates avec lastSeenAt
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const user = payload.new as any;

            if (user && user.id && user.lastSeenAt) {
              const lastSeenAt = new Date(user.lastSeenAt);
              updatePresence(user.id, lastSeenAt);
              console.log(`👤 Présence mise à jour pour l'utilisateur ${user.id}`);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Statut Supabase Presence Realtime: ${status}`);

          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            isSubscribedRef.current = false;

            // Backoff exponentiel pour les reconnexions
            if (retryCountRef.current < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
              console.log(`⏳ Reconnexion dans ${delay}ms (tentative ${retryCountRef.current + 1}/${maxRetries})`);

              reconnectTimeout = setTimeout(() => {
                retryCountRef.current++;
                if (channelRef.current) {
                  channelRef.current.unsubscribe();
                  channelRef.current = null;
                }
                setupChannel();
              }, delay);
            } else {
              console.error("❌ Nombre maximum de tentatives de reconnexion atteint");
            }
          }
        });
    };

    // Initialiser le channel
    setupChannel();

    // Vérifier périodiquement le statut des utilisateurs
    // (pour mettre à jour isOnline si lastSeenAt devient trop ancien)
    presenceCheckInterval = setInterval(() => {
      setPresenceMap((prev) => {
        const newMap = new Map(prev);
        const now = Date.now();

        newMap.forEach((presence, userId) => {
          if (presence.lastSeenAt) {
            const isOnline = now - presence.lastSeenAt.getTime() < ONLINE_THRESHOLD;
            if (isOnline !== presence.isOnline) {
              newMap.set(userId, {
                ...presence,
                isOnline,
              });
            }
          }
        });

        return newMap;
      });
    }, 30000); // Vérifier toutes les 30 secondes

    // Cleanup
    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(presenceCheckInterval);

      if (channelRef.current) {
        console.log("🔌 Déconnexion du real-time Presence Supabase");
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      isSubscribedRef.current = false;
    };
  }, [updatePresence]);

  return {
    presenceMap,
    isUserOnline,
    getOnlineUsers,
    getLastSeenAt,
  };
}
