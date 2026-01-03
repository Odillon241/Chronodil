"use client";

import { useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeHRTimesheetsProps {
  onHRTimesheetChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', hrTimesheetId?: string) => void;
  userId?: string;
  enabled?: boolean;
}

// ⚡ Hook optimisé pour Realtime HR Timesheets
export function useRealtimeHRTimesheets({ onHRTimesheetChange, userId, enabled = true }: UseRealtimeHRTimesheetsProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10; // Augmenté pour plus de résilience
  const isSubscribedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownErrorRef = useRef(false);

  // Utiliser le singleton Supabase
  const supabase = useMemo(() => createClient(), []);
  
  // Garder une référence stable du callback
  const onHRTimesheetChangeRef = useRef(onHRTimesheetChange);
  useEffect(() => {
    onHRTimesheetChangeRef.current = onHRTimesheetChange;
  }, [onHRTimesheetChange]);

  useEffect(() => {
    if (!enabled) {
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

      console.log('🔄 Configuration du real-time Supabase pour les HR Timesheets...');

      const channel = supabase
        .channel('hr-timesheet-realtime-channel', {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' }
          }
        })
        // Écouter les changements sur la table HRTimesheet
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'HRTimesheet'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            hasShownErrorRef.current = false;
            const eventType = payload.eventType;
            const hrTimesheetId = (payload.new as any)?.id || (payload.old as any)?.id;
            const employeeName = (payload.new as any)?.employeeName || (payload.old as any)?.employeeName;
            const status = (payload.new as any)?.status || (payload.old as any)?.status;

            console.log(`🔄 Événement HRTimesheet ${eventType}:`, { hrTimesheetId, employeeName, status });

            // Notifications pour les événements importants
            if (eventType === 'INSERT') {
              toast.info(`Nouvelle feuille de temps RH créée: ${employeeName}`, {
                duration: 3000,
              });
            } else if (eventType === 'UPDATE') {
              // Notifier seulement les changements de statut importants
              if (status && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(status)) {
                toast.info(`Feuille de temps RH mise à jour: ${employeeName} (${status})`, {
                  duration: 3000,
                });
              }
            } else if (eventType === 'DELETE') {
              toast.info(`Feuille de temps RH supprimée: ${employeeName}`, {
                duration: 3000,
              });
            }

            onHRTimesheetChangeRef.current?.(eventType, hrTimesheetId);
          }
        )
        // Écouter les changements sur HRActivity
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'HRActivity'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0;
            hasShownErrorRef.current = false;
            const hrTimesheetId = (payload.new as any)?.hrTimesheetId || (payload.old as any)?.hrTimesheetId;

            console.log(`📋 Événement HRActivity pour HRTimesheet:`, hrTimesheetId);

            // Rafraîchissement silencieux pour les activités
            onHRTimesheetChangeRef.current?.('UPDATE', hrTimesheetId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time HR Timesheets:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            hasShownErrorRef.current = false;
            console.log('✅ Subscription real-time active pour les HR Timesheets');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            isSubscribedRef.current = false;
            console.warn(`⚠️ Erreur de connexion real-time HR Timesheets (${status}), tentative ${retryCountRef.current + 1}/${maxRetries}...`);

            if (retryCountRef.current < maxRetries && isMounted) {
              // Backoff exponentiel avec jitter
              const baseDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000);
              const jitter = Math.random() * 1000;
              const delay = baseDelay + jitter;
              retryCountRef.current++;

              console.log(`🔄 Reconnexion HR Timesheets dans ${Math.round(delay / 1000)}s...`);

              reconnectTimeoutRef.current = setTimeout(async () => {
                if (!isMounted) return;
                await cleanupChannel();
                if (isMounted) {
                  setupChannel();
                }
              }, delay);
            } else if (isMounted && !hasShownErrorRef.current) {
              hasShownErrorRef.current = true;
              console.warn('⚠️ Connexion real-time HR Timesheets en mode dégradé (fonctionnement sans temps réel)');
              // Ne pas afficher de toast d'erreur - le fonctionnement continue par polling
            }
          }
        });

      channelRef.current = channel;
    };

    setupChannel();

    // Reconnexion quand la page redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSubscribedRef.current && isMounted) {
        console.log('👁️ Page visible, tentative de reconnexion HR Timesheets...');
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
        console.log('🌐 Connexion réseau rétablie, reconnexion HR Timesheets...');
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
        console.log('🧹 Nettoyage de la subscription real-time HR Timesheets...');
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [supabase, userId, enabled]);
}
