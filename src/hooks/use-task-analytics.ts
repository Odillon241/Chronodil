import { useQuery } from "@tanstack/react-query";
import {
  getTaskMetrics,
  getUserPerformanceMetrics,
  getProjectPerformanceMetrics,
  getProductivityTrends,
  getTaskInsights,
  getAnalyticsDashboard,
} from "@/actions/analytics.actions";

/**
 * Hooks React Query pour les analytics de tâches
 *
 * ⚡ Bénéfices :
 * - Cache automatique (5 minutes par défaut)
 * - Refetch automatique en arrière-plan
 * - Loading states gérés
 * - Retry automatique en cas d'erreur
 */

export interface UseTaskMetricsOptions {
  userId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

/**
 * Hook pour récupérer les métriques globales
 */
export function useTaskMetrics(options: UseTaskMetricsOptions = {}) {
  return useQuery({
    queryKey: [
      "task-metrics",
      options.userId,
      options.projectId,
      options.startDate?.toISOString(),
      options.endDate?.toISOString(),
    ],
    queryFn: async () => {
      const result = await getTaskMetrics({
        userId: options.userId,
        projectId: options.projectId,
        startDate: options.startDate,
        endDate: options.endDate,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch toutes les 10 minutes
  });
}

export interface UseUserPerformanceOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook pour récupérer la performance par utilisateur
 * (Réservé aux managers)
 */
export function useUserPerformance(options: UseUserPerformanceOptions = {}) {
  return useQuery({
    queryKey: [
      "user-performance",
      options.startDate?.toISOString(),
      options.endDate?.toISOString(),
      options.limit,
    ],
    queryFn: async () => {
      const result = await getUserPerformanceMetrics({
        startDate: options.startDate,
        endDate: options.endDate,
        limit: options.limit,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000, // Refetch toutes les 15 minutes
  });
}

export interface UseProjectPerformanceOptions {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

/**
 * Hook pour récupérer la performance par projet
 */
export function useProjectPerformance(
  options: UseProjectPerformanceOptions = {}
) {
  return useQuery({
    queryKey: [
      "project-performance",
      options.startDate?.toISOString(),
      options.endDate?.toISOString(),
    ],
    queryFn: async () => {
      const result = await getProjectPerformanceMetrics({
        startDate: options.startDate,
        endDate: options.endDate,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}

export interface UseProductivityTrendsOptions {
  userId?: string;
  days?: number;
  enabled?: boolean;
}

/**
 * Hook pour récupérer les tendances de productivité
 */
export function useProductivityTrends(
  options: UseProductivityTrendsOptions = {}
) {
  return useQuery({
    queryKey: ["productivity-trends", options.userId, options.days],
    queryFn: async () => {
      const result = await getProductivityTrends({
        userId: options.userId,
        days: options.days,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    staleTime: 10 * 60 * 1000, // 10 minutes (données moins volatiles)
    refetchInterval: 30 * 60 * 1000, // Refetch toutes les 30 minutes
  });
}

export interface UseTaskInsightsOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Hook pour récupérer les insights intelligents
 */
export function useTaskInsights(options: UseTaskInsightsOptions = {}) {
  return useQuery({
    queryKey: ["task-insights", options.userId],
    queryFn: async () => {
      const result = await getTaskInsights({
        userId: options.userId,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export interface UseAnalyticsDashboardOptions {
  userId?: string;
  days?: number;
  enabled?: boolean;
}

/**
 * Hook pour récupérer le dashboard complet d'analytics
 * (Optimisé - Une seule requête pour toutes les données)
 */
export function useAnalyticsDashboard(
  options: UseAnalyticsDashboardOptions = {}
) {
  return useQuery({
    queryKey: ["analytics-dashboard", options.userId, options.days],
    queryFn: async () => {
      const result = await getAnalyticsDashboard({
        userId: options.userId,
        days: options.days || 30,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
