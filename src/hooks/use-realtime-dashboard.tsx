"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeDashboardProps {
  onDataChange: (source: 'project' | 'task' | 'hrTimesheet', eventType?: 'INSERT' | 'UPDATE' | 'DELETE', id?: string) => void;
  userId?: string;
}

// ⚡ Hook optimisé pour Realtime Dashboard
// Surveille Project, ProjectMember, Task, HRTimesheet pour le tableau de bord
export function useRealtimeDashboard({ onDataChange, userId }: UseRealtimeDashboardProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);

  const stableOnChange = useCallback(onDataChange, [onDataChange]);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour le dashboard...');

      channelRef.current = supabase
        .channel('dashboard-realtime-channel', {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' }
          }
        })
        // Écouter les changements sur Project
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
            stableOnChange('project', eventType, projectId);
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
            const projectId = (payload.new as any)?.projectId || (payload.old as any)?.projectId;
            stableOnChange('project', 'UPDATE', projectId);
          }
        )
        // Écouter les changements sur Task
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Task'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
            stableOnChange('task', eventType, taskId);
          }
        )
        // Écouter les changements sur HRTimesheet
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'HRTimesheet'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            const eventType = payload.eventType;
            const hrTimesheetId = (payload.new as any)?.id || (payload.old as any)?.id;
            stableOnChange('hrTimesheet', eventType, hrTimesheetId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time Dashboard:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log('✅ Subscription real-time active pour le dashboard');
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
        console.log('🧹 Nettoyage de la subscription real-time Dashboard...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [stableOnChange, userId]);
}
