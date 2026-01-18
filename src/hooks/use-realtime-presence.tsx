"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSession } from "@/lib/auth-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Constantes pour la détection de présence
const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

interface PresenceData {
  userId: string;
  lastSeenAt: Date | null;
  isOnline: boolean;
  onlineAt?: Date | null; // Timestamp de connexion via Presence API
}

/**
 * Hook pour suivre la présence des utilisateurs en temps réel
 *
 * Utilise l'API Presence de Supabase Realtime pour détecter les utilisateurs en ligne
 * Combine avec postgres_changes pour les mises à jour de lastSeenAt (fallback)
 */
export function useRealtimePresence() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceData>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isMountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Vérifie si un utilisateur est en ligne
   * Priorité: Presence API > lastSeenAt
   */
  const isUserOnline = useCallback((userId: string): boolean => {
    const presence = presenceMap.get(userId);
    if (!presence) return false;

    // Si l'utilisateur est tracké via Presence API, il est en ligne
    if (presence.onlineAt) {
      return true;
    }

    // Sinon, vérifier via lastSeenAt
    if (presence.lastSeenAt) {
      const now = Date.now();
      const lastSeen = presence.lastSeenAt.getTime();
      return now - lastSeen < ONLINE_THRESHOLD;
    }

    return false;
  }, [presenceMap]);

  /**
   * Récupère la liste des utilisateurs en ligne
   */
  const getOnlineUsers = useCallback((): string[] => {
    const onlineUsers: string[] = [];
    presenceMap.forEach((presence, userId) => {
      if (isUserOnline(userId)) {
        onlineUsers.push(userId);
      }
    });
    return onlineUsers;
  }, [presenceMap, isUserOnline]);

  /**
   * Récupère le dernier temps vu pour un utilisateur
   */
  const getLastSeenAt = useCallback((userId: string): Date | null => {
    return presenceMap.get(userId)?.lastSeenAt || null;
  }, [presenceMap]);

  /**
   * Met à jour le statut de présence d'un utilisateur
   */
  const updatePresence = useCallback((userId: string, data: Partial<PresenceData>) => {
    setPresenceMap((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(userId) || { userId, lastSeenAt: null, isOnline: false };

      const updated: PresenceData = {
        ...existing,
        ...data,
        userId,
      };

      // Calculer isOnline si nécessaire
      if (updated.onlineAt) {
        updated.isOnline = true;
      } else if (updated.lastSeenAt) {
        const now = Date.now();
        updated.isOnline = now - updated.lastSeenAt.getTime() < ONLINE_THRESHOLD;
      }

      newMap.set(userId, updated);
      return newMap;
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    isMountedRef.current = true;
    const supabase = createClient();
    let presenceCheckInterval: NodeJS.Timeout;

    const setupChannel = () => {
      // Vérifier que le composant est toujours monté
      if (!isMountedRef.current || !currentUserId) {
        return;
      }

      // Éviter les doublons de channel
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log("🔄 Configuration du real-time Supabase Presence API...");

      try {
        // Créer un channel avec configuration Presence
        channelRef.current = supabase
          .channel("presence-global", {
            config: {
              presence: {
                key: currentUserId, // Clé unique pour cet utilisateur
              },
            },
          })
          // Écouter les événements Presence
          .on("presence", { event: "sync" }, () => {
            if (!isMountedRef.current || !channelRef.current) return;

            const state = channelRef.current.presenceState();
            console.log("🔄 Sync Presence - Utilisateurs en ligne:", Object.keys(state).length);

            // Mettre à jour tous les utilisateurs trackés
            Object.entries(state).forEach(([key, presences]) => {
              if (presences && presences.length > 0) {
                const presenceData = presences[0] as any;
                const userId = presenceData.user_id || key;
                updatePresence(userId, {
                  onlineAt: new Date(),
                  isOnline: true,
                });
              }
            });
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
            if (!isMountedRef.current) return;

            console.log("✅ Utilisateur rejoint:", key);

            if (newPresences && newPresences.length > 0) {
              const presenceData = newPresences[0] as any;
              const userId = presenceData.user_id || key;
              updatePresence(userId, {
                onlineAt: new Date(),
                isOnline: true,
              });
            }
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
            if (!isMountedRef.current) return;

            console.log("❌ Utilisateur quitte:", key);

            if (leftPresences && leftPresences.length > 0) {
              const presenceData = leftPresences[0] as any;
              const userId = presenceData.user_id || key;
              // Ne pas supprimer, mais marquer comme hors ligne
              updatePresence(userId, {
                onlineAt: null,
                isOnline: false,
              });
            }
          })
          // Fallback: Écouter aussi les changements de lastSeenAt en DB
          .on<Record<string, any>>(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "User",
              filter: "lastSeenAt=not.is.null",
            },
            (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
              if (!isMountedRef.current) return;

              retryCountRef.current = 0;
              const user = payload.new as any;

              if (user && user.id && user.lastSeenAt) {
                const lastSeenAt = new Date(user.lastSeenAt);
                updatePresence(user.id, { lastSeenAt });
                console.log(`👤 lastSeenAt mis à jour pour l'utilisateur ${user.id}`);
              }
            }
          )
          .subscribe(async (status) => {
            if (!isMountedRef.current) return;

            console.log(`📡 Statut Supabase Presence Realtime: ${status}`);

            if (status === "SUBSCRIBED") {
              isSubscribedRef.current = true;
              retryCountRef.current = 0;

              // Tracker la présence de l'utilisateur actuel
              if (channelRef.current && currentUserId) {
                try {
                  await channelRef.current.track({
                    user_id: currentUserId,
                    online_at: new Date().toISOString(),
                  });
                  console.log("✅ Présence trackée pour l'utilisateur actuel");
                } catch (error) {
                  console.error("Erreur lors du tracking de présence:", error);
                }

                // Mettre à jour périodiquement la présence (heartbeat)
                trackIntervalRef.current = setInterval(async () => {
                  if (channelRef.current && currentUserId && isMountedRef.current) {
                    try {
                      await channelRef.current.track({
                        user_id: currentUserId,
                        online_at: new Date().toISOString(),
                      });
                    } catch (error) {
                      console.warn("Erreur heartbeat présence:", error);
                    }
                  }
                }, 10000); // Toutes les 10 secondes (réduit de 30s pour plus de réactivité)
              }
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
              isSubscribedRef.current = false;

              // Arrêter le heartbeat
              if (trackIntervalRef.current) {
                clearInterval(trackIntervalRef.current);
                trackIntervalRef.current = null;
              }

              // Nettoyer le timeout précédent s'il existe
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
              }

              // Backoff exponentiel pour les reconnexions
              if (retryCountRef.current < maxRetries && isMountedRef.current) {
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                console.log(`⏳ Reconnexion dans ${delay}ms (tentative ${retryCountRef.current + 1}/${maxRetries})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                  if (!isMountedRef.current) return;

                  retryCountRef.current++;

                  // Nettoyer l'ancien channel
                  if (channelRef.current) {
                    try {
                      channelRef.current.unsubscribe();
                    } catch (error) {
                      console.warn("Erreur lors de la déconnexion du channel:", error);
                    }
                    channelRef.current = null;
                  }

                  isSubscribedRef.current = false;

                  // Réessayer seulement si on n'a pas atteint le max
                  if (retryCountRef.current <= maxRetries) {
                    setupChannel();
                  }
                }, delay);
              } else if (retryCountRef.current >= maxRetries) {
                console.warn("❌ Nombre maximum de tentatives de reconnexion atteint. La présence en temps réel est désactivée.");
              }
            }
          });
      } catch (error) {
        console.error("Erreur lors de la configuration du channel de présence:", error);
        isSubscribedRef.current = false;
        if (channelRef.current) {
          channelRef.current = null;
        }
      }
    };

    // Initialiser le channel
    setupChannel();

    // Vérifier périodiquement le statut des utilisateurs
    // (pour mettre à jour isOnline si lastSeenAt devient trop ancien)
    presenceCheckInterval = setInterval(() => {
      if (!isMountedRef.current) return;

      setPresenceMap((prev) => {
        const newMap = new Map(prev);
        const now = Date.now();

        newMap.forEach((presence, userId) => {
          // Si l'utilisateur est tracké via Presence API, il est en ligne
          if (presence.onlineAt) {
            return; // Pas besoin de vérifier
          }

          // Sinon, vérifier via lastSeenAt
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
    }, 15000); // Vérifier toutes les 15 secondes (réduit de 30s)

    // Cleanup
    return () => {
      isMountedRef.current = false;

      // Arrêter le heartbeat
      if (trackIntervalRef.current) {
        clearInterval(trackIntervalRef.current);
        trackIntervalRef.current = null;
      }

      // Nettoyer le timeout de reconnexion
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      clearInterval(presenceCheckInterval);

      if (channelRef.current) {
        try {
          console.log("🔌 Déconnexion du real-time Presence Supabase");
          channelRef.current.unsubscribe();
        } catch (error) {
          console.warn("Erreur lors de la déconnexion:", error);
        }
        channelRef.current = null;
      }

      isSubscribedRef.current = false;
      retryCountRef.current = 0;
    };
  }, [currentUserId, updatePresence]);

  return {
    presenceMap,
    isUserOnline,
    getOnlineUsers,
    getLastSeenAt,
  };
}
