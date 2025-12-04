"use client";

// ============================================
// REACT QUERY PROVIDER
// ============================================
// Provider pour React Query avec configuration optimisée
// Cache les requêtes côté client pour éviter les re-fetches inutiles

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

// ⚡ Instance singleton du QueryClient pour un accès global
// Utilisé par les hooks real-time pour invalider le cache
let _queryClientInstance: QueryClient | null = null;

// ⚡ Durées de cache optimisées par type de données
export const CACHE_TIMES = {
  // Données qui changent peu
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
  },
  // Données utilisateur (projets, utilisateurs)
  USER_DATA: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Données dynamiques (tâches, timesheets, notifications)
  DYNAMIC: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  // Données temps réel (chat, notifications non lues)
  REALTIME: {
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
} as const;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ⚡ Par défaut: cache données dynamiques
        staleTime: CACHE_TIMES.DYNAMIC.staleTime,
        gcTime: CACHE_TIMES.DYNAMIC.gcTime,
        // ⚡ Retry 3 fois en cas d'erreur avec backoff exponentiel
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // ⚡ Refetch automatiquement quand la fenêtre reprend le focus
        refetchOnWindowFocus: true,
        // ⚡ Refetch quand la connexion est rétablie
        refetchOnReconnect: true,
        // ⚡ Ne pas refetch automatiquement au mount (économise des requêtes)
        refetchOnMount: false,
        // ⚡ Refetch en arrière-plan quand les données sont stale
        refetchIntervalInBackground: false,
      },
      mutations: {
        // ⚡ Retry 2 fois pour les mutations
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
}

// ⚡ Getter pour l'instance globale (utilisé par les hooks real-time)
// Fonction qui retourne l'instance singleton côté client, null côté serveur
export function getQueryClient(): QueryClient | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!_queryClientInstance) {
    _queryClientInstance = createQueryClient();
  }
  return _queryClientInstance;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // ⚡ OPTIMISATION: Utiliser l'instance singleton ou en créer une nouvelle
  const [queryClient] = useState(() => {
    if (typeof window !== 'undefined') {
      // Côté client: utiliser/créer l'instance singleton
      if (!_queryClientInstance) {
        _queryClientInstance = createQueryClient();
      }
      return _queryClientInstance;
    }
    // Côté serveur: créer une nouvelle instance (ne sera pas utilisée)
    return createQueryClient();
  });

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
  // Reports
  reports: {
    all: ["reports"] as const,
    lists: () => [...QUERY_KEYS.reports.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.reports.lists(), filters] as const,
    details: () => [...QUERY_KEYS.reports.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.reports.details(), id] as const,
  },
  // Chat
  chat: {
    all: ["chat"] as const,
    conversations: () => [...QUERY_KEYS.chat.all, "conversations"] as const,
    conversation: (id: string) => [...QUERY_KEYS.chat.conversations(), id] as const,
    messages: (conversationId: string) =>
      [...QUERY_KEYS.chat.all, "messages", conversationId] as const,
  },
  // Departments
  departments: {
    all: ["departments"] as const,
    list: () => [...QUERY_KEYS.departments.all, "list"] as const,
  },
} as const;

// ============================================
// PREFETCH HELPERS
// ============================================
// Fonctions pour prefetcher les données probables

/**
 * Prefetch des données pour une route spécifique
 * Appeler lors de hover sur un lien ou anticipation de navigation
 */
export async function prefetchRoute(
  queryClient: QueryClient,
  route: "tasks" | "projects" | "hrTimesheets" | "reports",
  queryFn: () => Promise<unknown>
) {
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS[route].all,
    queryFn,
    staleTime: CACHE_TIMES.DYNAMIC.staleTime,
  });
}

/**
 * Prefetch des données utilisateur (projets, profil)
 * Appeler au chargement initial du dashboard
 */
export async function prefetchUserData(
  queryClient: QueryClient,
  queries: Array<{ key: readonly unknown[]; fn: () => Promise<unknown> }>
) {
  await Promise.all(
    queries.map(({ key, fn }) =>
      queryClient.prefetchQuery({
        queryKey: key,
        queryFn: fn,
        staleTime: CACHE_TIMES.USER_DATA.staleTime,
      })
    )
  );
}

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
