"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeProjectsProps {
  onProjectChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', projectId?: string) => void;
  userId?: string;
}

// ⚡ Hook optimisé pour Realtime Projects
export function useRealtimeProjects({ onProjectChange, userId }: UseRealtimeProjectsProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);

  const stableOnChange = useCallback(onProjectChange, [onProjectChange]);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour les projets...');

      channelRef.current = supabase
        .channel('project-realtime-channel', {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' }
          }
        })
        // Écouter les changements sur la table Project
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Project'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const projectId = (payload.new as any)?.id || (payload.old as any)?.id;
            const projectName = (payload.new as any)?.name || (payload.old as any)?.name;

            console.log(`🔄 Événement Project ${eventType}:`, { projectId, projectName });

            if (eventType === 'INSERT') {
              toast.info(`Nouveau projet créé: ${projectName}`, {
                duration: 3000,
              });
            } else if (eventType === 'UPDATE') {
              // Notification silencieuse pour les mises à jour (trop fréquentes)
              const changedFields = Object.keys((payload.new as any) || {});
              if (changedFields.includes('isActive') || changedFields.includes('status')) {
                toast.info(`Projet mis à jour: ${projectName}`, {
                  duration: 2000,
                });
              }
            } else if (eventType === 'DELETE') {
              toast.info(`Projet supprimé: ${projectName}`, {
                duration: 3000,
              });
            }

            stableOnChange(eventType, projectId);
          }
        )
        // Écouter les changements sur ProjectMember
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ProjectMember'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const projectId = (payload.new as any)?.projectId || (payload.old as any)?.projectId;
            const memberUserId = (payload.new as any)?.userId || (payload.old as any)?.userId;

            console.log(`👥 Événement ProjectMember ${eventType} pour projet:`, projectId);

            // Notifier seulement si c'est l'utilisateur actuel qui a été ajouté
            if (eventType === 'INSERT' && memberUserId === userId) {
              toast.info('Vous avez été ajouté à un projet', {
                duration: 3000,
              });
            }

            stableOnChange('UPDATE', projectId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time Projects:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log('✅ Subscription real-time active pour les projets');
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
              console.warn('⚠️ Connexion real-time Projects en mode dégradé (fonctionnement sans temps réel)');
              // Ne pas afficher de toast d'erreur - le fonctionnement continue par polling
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
        console.log('🧹 Nettoyage de la subscription real-time Projects...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [stableOnChange, userId]);
}
