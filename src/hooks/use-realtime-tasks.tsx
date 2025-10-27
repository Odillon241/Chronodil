"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeTasksProps {
  onTaskChange: () => void;
}

// ⚡ Hook optimisé pour Realtime avec:
// - Prévention des reconnexions inutiles
// - Backoff exponentiel en cas d'erreur
// - Cleanup approprié
export function useRealtimeTasks({ onTaskChange }: UseRealtimeTasksProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // Stabiliser la callback avec useCallback
  const stableOnChange = useCallback(onTaskChange, []);

  useEffect(() => {
    const supabase = createClient();
    let reconnectTimeout: NodeJS.Timeout;

    const setupChannel = () => {
      // Éviter les doublons de channel
      if (channelRef.current) {
        return;
      }

      // Créer un channel pour écouter les changements sur la table Task
      channelRef.current = supabase
        .channel('task-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'Task'
          },
          (payload) => {
            // Reset retry count on successful message
            retryCountRef.current = 0;
            stableOnChange();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            retryCountRef.current = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Backoff exponentiel
            if (retryCountRef.current < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
              retryCountRef.current++;

              reconnectTimeout = setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                  channelRef.current = null;
                }
                setupChannel();
              }, delay);
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
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stableOnChange]);
}
