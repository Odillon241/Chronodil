"use client";

// ============================================
// REACT QUERY PROVIDER
// ============================================
// Provider pour React Query avec configuration optimisée
// Cache les requêtes côté client pour éviter les re-fetches inutiles

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // ⚡ OPTIMISATION: Créer une instance unique de QueryClient
  // Ne pas créer de nouveau QueryClient à chaque render!
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ⚡ Cache les données pendant 5 minutes
            staleTime: 5 * 60 * 1000, // 5 minutes
            // ⚡ Garde les données inactives pendant 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (ancien cacheTime)
            // ⚡ Retry 3 fois en cas d'erreur avec backoff exponentiel
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // ⚡ Refetch automatiquement quand la fenêtre reprend le focus
            refetchOnWindowFocus: true,
            // ⚡ Refetch quand la connexion est rétablie
            refetchOnReconnect: true,
            // ⚡ Ne pas refetch automatiquement au mount (économise des requêtes)
            refetchOnMount: false,
          },
          mutations: {
            // ⚡ Retry 2 fois pour les mutations
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools seulement en développement */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

// ============================================
// CACHE KEYS - CENTRALISER LES CLÉS DE CACHE
// ============================================
// Évite les typos et facilite l'invalidation du cache
export const QUERY_KEYS = {
  // Tasks
  tasks: {
    all: ["tasks"] as const,
    lists: () => [...QUERY_KEYS.tasks.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.tasks.lists(), filters] as const,
    details: () => [...QUERY_KEYS.tasks.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.details(), id] as const,
    myTasks: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.tasks.all, "my", filters] as const,
    projectTasks: (projectId: string, filters: Record<string, unknown>) =>
      [...QUERY_KEYS.tasks.all, "project", projectId, filters] as const,
  },
  // HR Timesheets
  hrTimesheets: {
    all: ["hrTimesheets"] as const,
    lists: () => [...QUERY_KEYS.hrTimesheets.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.hrTimesheets.lists(), filters] as const,
    details: () => [...QUERY_KEYS.hrTimesheets.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.hrTimesheets.details(), id] as const,
  },
  // Projects
  projects: {
    all: ["projects"] as const,
    lists: () => [...QUERY_KEYS.projects.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.projects.lists(), filters] as const,
    details: () => [...QUERY_KEYS.projects.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.projects.details(), id] as const,
  },
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...QUERY_KEYS.users.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.users.lists(), filters] as const,
    details: () => [...QUERY_KEYS.users.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.users.details(), id] as const,
    availableForSharing: (projectId?: string) =>
      [...QUERY_KEYS.users.all, "sharing", projectId] as const,
  },
  // Notifications
  notifications: {
    all: ["notifications"] as const,
    unread: () => [...QUERY_KEYS.notifications.all, "unread"] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.notifications.all, "list", filters] as const,
  },
} as const;

// ============================================
// NOTES D'UTILISATION
// ============================================
// 1. Wrapper votre app avec <QueryProvider> dans src/app/layout.tsx
// 2. Utiliser les QUERY_KEYS pour toutes vos requêtes React Query
// 3. Exemple d'utilisation:
//
//    const { data, isLoading } = useQuery({
//      queryKey: QUERY_KEYS.tasks.myTasks({ projectId: "123" }),
//      queryFn: () => getMyTasksOptimized({ projectId: "123" }),
//    });
//
// 4. Pour invalider le cache après une mutation:
//
//    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
//
// 5. DevTools React Query disponibles en dev (icône en bas de l'écran)
