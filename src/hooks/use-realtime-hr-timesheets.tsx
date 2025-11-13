"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeHRTimesheetsProps {
  onHRTimesheetChange: (eventType?: 'INSERT' | 'UPDATE' | 'DELETE', hrTimesheetId?: string) => void;
  userId?: string;
}

// ⚡ Hook optimisé pour Realtime HR Timesheets
export function useRealtimeHRTimesheets({ onHRTimesheetChange, userId }: UseRealtimeHRTimesheetsProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const isSubscribedRef = useRef(false);

  const stableOnChange = useCallback(onHRTimesheetChange, [onHRTimesheetChange]);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      if (channelRef.current || isSubscribedRef.current) {
        return;
      }

      console.log('🔄 Configuration du real-time Supabase pour les HR Timesheets...');

      channelRef.current = supabase
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

            stableOnChange(eventType, hrTimesheetId);
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
            const hrTimesheetId = (payload.new as any)?.hrTimesheetId || (payload.old as any)?.hrTimesheetId;

            console.log(`📋 Événement HRActivity pour HRTimesheet:`, hrTimesheetId);

            // Rafraîchissement silencieux pour les activités
            stableOnChange('UPDATE', hrTimesheetId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time HR Timesheets:', status);

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
            console.log('✅ Subscription real-time active pour les HR Timesheets');
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
        console.log('🧹 Nettoyage de la subscription real-time HR Timesheets...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [stableOnChange, userId]);
}
