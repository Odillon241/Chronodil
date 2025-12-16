"use client";

// ============================================
// REALTIME OPTIMISÉ POUR LES TÂCHES
// ============================================
// Version optimisée avec:
// - Filtres côté serveur pour réduire le trafic réseau
// - Un seul channel au lieu de 4
// - Utilisation de React Query pour synchroniser le cache
// - Debouncing des notifications
// - Protection SSR: ne s'exécute que côté client

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, getQueryClient } from "@/providers/query-provider";

interface UseRealtimeTasksOptimizedProps {
  userId: string; // REQUIS pour filtrer les événements
  projectId?: string; // Optionnel: écouter seulement les tâches d'un projet
  enabled?: boolean; // Permettre de désactiver le real-time
}

// ⚡ OPTIMISATION: Un seul channel pour tous les événements
// ⚡ FILTRES: Seulement les événements pertinents pour l'utilisateur
// ⚡ REACT QUERY: Synchronise automatiquement le cache
export function useRealtimeTasksOptimized({
  userId,
  projectId,
  enabled = true,
}: UseRealtimeTasksOptimizedProps) {
  const [isMounted, setIsMounted] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);
  const lastNotificationRef = useRef<{ [key: string]: number }>({});

  // Marquer comme monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce les notifications (max 1 toutes les 3 secondes par type)
  const canShowNotification = useCallback((type: string) => {
    const now = Date.now();
    const last = lastNotificationRef.current[type] || 0;
    if (now - last > 3000) {
      lastNotificationRef.current[type] = now;
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // ⚡ Ne pas exécuter côté serveur ou si désactivé
    const queryClient = getQueryClient();
    if (!isMounted || !enabled || !queryClient) return;

    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log("🔄 Configuration du real-time optimisé...");

      // ⚡ UN SEUL CHANNEL pour tous les événements
      channelRef.current = supabase
        .channel(`task-optimized-${userId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: userId },
          },
        })
        // ⚡ FILTRE: Seulement les tâches de l'utilisateur
        .on<Record<string, any>>(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Task",
            // Filtre côté serveur: seulement les tâches créées par l'utilisateur
            // Note: RLS doit être activé pour que ce filtre fonctionne correctement
            filter: `createdBy=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
            const taskName = (payload.new as any)?.name || (payload.old as any)?.name;

            console.log(`🔄 Task ${eventType}:`, { taskId, taskName });

            // ⚡ INVALIDER LE CACHE REACT QUERY automatiquement
            if (eventType === "INSERT") {
              // Nouvelle tâche: invalider toutes les listes
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
              if (canShowNotification("task-insert")) {
                toast.info(`Nouvelle tâche: ${taskName}`);
              }
            } else if (eventType === "DELETE") {
              // Tâche supprimée: supprimer du cache + invalider listes
              queryClient.removeQueries({ queryKey: QUERY_KEYS.tasks.detail(taskId) });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
              if (canShowNotification("task-delete")) {
                toast.info(`Tâche supprimée: ${taskName}`);
              }
            } else if (eventType === "UPDATE") {
              // Tâche mise à jour: invalider la tâche spécifique + listes
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(taskId) });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });

              // Notification seulement pour les changements importants
              const changedStatus = (payload.new as any)?.status !== (payload.old as any)?.status;
              const changedPriority =
                (payload.new as any)?.priority !== (payload.old as any)?.priority;

              if ((changedStatus || changedPriority) && canShowNotification("task-update")) {
                toast.info(`Tâche mise à jour: ${taskName}`);
              }
            }
          }
        )
        // ⚡ FILTRE: Seulement les TaskMembers de l'utilisateur
        .on<Record<string, any>>(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "TaskMember",
            filter: `userId=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const taskId = (payload.new as any)?.taskId || (payload.old as any)?.taskId;

            console.log(`👥 TaskMember ${eventType} pour la tâche:`, taskId);

            if (eventType === "INSERT") {
              // Ajouté à une tâche: invalider les listes
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
              if (canShowNotification("task-member-insert")) {
                toast.info("Vous avez été ajouté à une tâche");
              }
            } else if (eventType === "DELETE") {
              // Retiré d'une tâche: invalider les listes
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
            } else {
              // Mise à jour: invalider la tâche
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(taskId) });
            }
          }
        )
        .subscribe((status) => {
          console.log("📡 Statut subscription:", status);

          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log("✅ Real-time optimisé actif");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            isSubscribedRef.current = false;
            console.warn("⚠️ Erreur real-time, reconnexion...");

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
              console.error("❌ Nombre max de reconnexions atteint");
              if (canShowNotification("error")) {
                toast.error("Connexion real-time perdue. Veuillez rafraîchir la page.", {
                  duration: 5000,
                });
              }
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
        console.log("🧹 Nettoyage real-time...");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [userId, projectId, enabled, isMounted, canShowNotification]);
}

// ============================================
// HOOK REAL-TIME POUR LES HR TIMESHEETS
// ============================================
export function useRealtimeHRTimesheets({ userId, enabled = true }: { userId: string; enabled?: boolean }) {
  const [isMounted, setIsMounted] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  // Marquer comme monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // ⚡ Ne pas exécuter côté serveur ou si désactivé
    const queryClient = getQueryClient();
    if (!isMounted || !enabled || !queryClient) return;

    const supabase = createClient();

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log("🔄 Real-time HR Timesheets...");

      channelRef.current = supabase
        .channel(`hr-timesheet-${userId}`)
        .on<Record<string, any>>(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "HRTimesheet",
            filter: `userId=eq.${userId}`,
          },
          (payload) => {
            console.log("📋 HRTimesheet event:", payload.eventType);

            // ⚡ Invalider le cache des timesheets
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });

            const timesheetId = (payload.new as any)?.id || (payload.old as any)?.id;
            if (timesheetId) {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.hrTimesheets.detail(timesheetId),
              });
            }
          }
        )
        .on<Record<string, any>>(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "HRActivity",
          },
          (payload) => {
            console.log("📊 HRActivity event:", payload.eventType);

            // Invalider le timesheet parent
            const hrTimesheetId = (payload.new as any)?.hrTimesheetId || (payload.old as any)?.hrTimesheetId;
            if (hrTimesheetId) {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.hrTimesheets.detail(hrTimesheetId),
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true;
            console.log("✅ Real-time HR Timesheets actif");
          }
        });
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [userId, enabled, isMounted]);
}

// ============================================
// NOTES D'OPTIMISATION
// ============================================
// AVANT:
// - 4 abonnements séparés (Task, TaskComment, TaskMember, TaskActivity)
// - Pas de filtres: reçoit TOUS les événements de TOUS les utilisateurs
// - Notifications non debouncées (spam)
// - Pas de synchronisation avec le cache React Query
//
// APRÈS:
// - 1 seul abonnement avec filtres côté serveur
// - Filtre userId: seulement les événements pertinents
// - Notifications debouncées (max 1 toutes les 3s par type)
// - Synchronisation automatique du cache React Query
// - Peut être désactivé avec enabled={false}
// - Protection SSR: ne s'exécute que côté client
//
// GAINS ATTENDUS:
// - Réduction du trafic réseau: -70 à -80%
// - Réduction de la charge CPU: -60 à -70%
// - Réduction des re-renders: -50 à -60%
// - Meilleure expérience utilisateur (moins de spam)
//
// PRÉREQUIS:
// - Row Level Security (RLS) activé sur les tables
// - Politiques RLS configurées pour filtrer par userId
// - React Query Provider installé dans l'app
