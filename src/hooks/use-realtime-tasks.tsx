"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeTasksProps {
  onTaskChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', taskId?: string) => void;
  userId?: string; // ID de l'utilisateur connecté pour filtrer les notifications
}

// ⚡ Hook optimisé pour Realtime avec:
// - Prévention des reconnexions inutiles
// - Backoff exponentiel en cas d'erreur
// - Cleanup approprié
// - Gestion des événements sur Task, TaskComment, TaskMember, TaskActivity
// - Notifications toast pour les changements importants
export function useRealtimeTasks({ onTaskChange, userId }: UseRealtimeTasksProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);

  // Stabiliser la callback avec useCallback
  const stableOnChange = useCallback(onTaskChange, [onTaskChange]);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      // Éviter les doublons de channel
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour les tâches...');

      // Créer un channel pour écouter les changements sur toutes les tables liées aux tâches
      channelRef.current = supabase
        .channel('task-realtime-channel', {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' }
          }
        })
        // Écouter les changements sur la table Task
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'Task'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
            const taskName = (payload.new as any)?.name || (payload.old as any)?.name;

            console.log(`🔄 Événement Task ${eventType}:`, { taskId, taskName });

            // Afficher une notification pour les événements importants
            if (eventType === 'INSERT') {
              toast.info(`Nouvelle tâche créée: ${taskName}`, {
                duration: 3000,
              });
            } else if (eventType === 'DELETE') {
              toast.info(`Tâche supprimée: ${taskName}`, {
                duration: 3000,
              });
            } else if (eventType === 'UPDATE') {
              // Notification silencieuse pour les mises à jour (trop fréquentes)
              // On peut filtrer pour ne notifier que les changements importants
              const changedFields = Object.keys((payload.new as any) || {});
              if (changedFields.includes('status') || changedFields.includes('priority')) {
                toast.info(`Tâche mise à jour: ${taskName}`, {
                  duration: 2000,
                });
              }
            }

            stableOnChange(eventType, taskId);
          }
        )
        // Écouter les changements sur TaskComment
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'TaskComment'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const taskId = (payload.new as any)?.taskId || (payload.old as any)?.taskId;

            console.log(`💬 Événement TaskComment ${eventType} pour la tâche:`, taskId);

            // Notifier seulement si ce n'est pas notre propre commentaire
            if (eventType === 'INSERT' && (payload.new as any)?.userId !== userId) {
              toast.info('Nouveau commentaire ajouté', {
                duration: 2000,
              });
            }

            stableOnChange('UPDATE', taskId); // Traiter comme une mise à jour de la tâche
          }
        )
        // Écouter les changements sur TaskMember
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'TaskMember'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const taskId = (payload.new as any)?.taskId || (payload.old as any)?.taskId;

            console.log(`👥 Événement TaskMember ${eventType} pour la tâche:`, taskId);

            if (eventType === 'INSERT' && (payload.new as any)?.userId !== userId) {
              toast.info('Vous avez été ajouté à une tâche', {
                duration: 3000,
              });
            }

            stableOnChange('UPDATE', taskId);
          }
        )
        // Écouter les changements sur TaskActivity (historique)
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'TaskActivity'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const taskId = (payload.new as any)?.taskId;

            console.log(`📜 Nouvelle activité pour la tâche:`, taskId);

            // Pas de notification pour les activités (trop fréquentes)
            stableOnChange('UPDATE', taskId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log('✅ Subscription real-time active pour les tâches');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            isSubscribedRef.current = false;
            console.warn('⚠️ Erreur de connexion real-time, tentative de reconnexion...');

            // Backoff exponentiel
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
              console.warn('⚠️ Connexion real-time Tasks en mode dégradé (fonctionnement sans temps réel)');
              // Ne pas afficher de toast d'erreur - le fonctionnement continue par polling
            }
          }
        });
    };

    setupChannel();

    // Nettoyer la subscription lors du démontage
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channelRef.current) {
        console.log('🧹 Nettoyage de la subscription real-time...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [stableOnChange, userId]);
}
