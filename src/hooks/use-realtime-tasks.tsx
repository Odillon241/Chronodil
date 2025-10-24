"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

interface UseRealtimeTasksProps {
  onTaskChange: () => void;
}

export function useRealtimeTasks({ onTaskChange }: UseRealtimeTasksProps) {
  useEffect(() => {
    const supabase = createClient();

    // Créer un channel pour écouter les changements sur la table Task
    const channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'Task'
        },
        (payload) => {
          console.log('Changement détecté sur la table Task:', payload);
          // Recharger les tâches quand un changement est détecté
          onTaskChange();
        }
      )
      .subscribe((status) => {
        console.log('Statut de la subscription Realtime:', status);
      });

    // Nettoyer la subscription lors du démontage
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onTaskChange]);
}
