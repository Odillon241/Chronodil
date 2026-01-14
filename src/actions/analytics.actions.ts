"use server";

import { getSession, getUserRole } from "@/lib/auth";
import { actionClient, authActionClient } from "@/lib/safe-action";
import { z } from "zod";
import {
  calculateTaskMetrics,
  calculateUserPerformance,
  calculateProjectPerformance,
  calculateProductivityTrends,
  calculateInsights,
} from "@/lib/task-analytics";
import { cacheTag } from "next/cache";

/**
 * Server Actions pour les analytics de tâches
 *
 * ⚡ Optimisations :
 * - Utilise cacheTag() pour cache Next.js 16
 * - Requêtes parallèles dans les fonctions analytics
 * - Filtrage par utilisateur/projet pour permissions
 */

const analyticsParamsSchema = z.object({
  userId: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Récupère les métriques globales des tâches
 */
export const getTaskMetrics = authActionClient
  .schema(analyticsParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    // "use cache";
    cacheTag("analytics");
    cacheTag(`analytics-metrics-${ctx.userId}`);

    // Par défaut, afficher les métriques de l'utilisateur connecté
    const targetUserId = parsedInput.userId || ctx.userId;

    // Vérifier les permissions : seul l'utilisateur ou un admin peut voir ses métriques
    const session = await getSession();
    const userRole = getUserRole(session);
    if (
      targetUserId !== ctx.userId &&
      !["ADMIN", "MANAGER", "DIRECTEUR"].includes(userRole as string)
    ) {
      throw new Error("Permission refusée");
    }

    const metrics = await calculateTaskMetrics(
      targetUserId,
      parsedInput.projectId,
      parsedInput.startDate,
      parsedInput.endDate
    );

    return metrics;
  });

/**
 * Récupère la performance par utilisateur
 * Accessible uniquement aux managers et admins
 */
export const getUserPerformanceMetrics = authActionClient
  .schema(
    z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    // "use cache";
    cacheTag("analytics");
    cacheTag("analytics-user-performance");

    const session = await getSession();
    const userRole = getUserRole(session);

    // Vérifier les permissions
    if (!["ADMIN", "MANAGER", "DIRECTEUR"].includes(userRole as string)) {
      throw new Error("Permission refusée - Réservé aux managers");
    }

    const performance = await calculateUserPerformance(
      parsedInput.startDate,
      parsedInput.endDate,
      parsedInput.limit
    );

    return performance;
  });

/**
 * Récupère la performance par projet
 */
export const getProjectPerformanceMetrics = authActionClient
  .schema(
    z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    // "use cache";
    cacheTag("analytics");
    cacheTag("analytics-project-performance");

    const performance = await calculateProjectPerformance(
      parsedInput.startDate,
      parsedInput.endDate
    );

    return performance;
  });

/**
 * Récupère les tendances de productivité
 */
export const getProductivityTrends = authActionClient
  .schema(
    z.object({
      userId: z.string().optional(),
      days: z.number().min(7).max(365).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    // "use cache";
    cacheTag("analytics");
    cacheTag(`analytics-trends-${ctx.userId}`);

    // Par défaut, afficher les tendances de l'utilisateur connecté
    const targetUserId = parsedInput.userId || ctx.userId;

    // Vérifier les permissions
    const session = await getSession();
    const userRole = getUserRole(session);
    if (
      targetUserId !== ctx.userId &&
      !["ADMIN", "MANAGER", "DIRECTEUR"].includes(userRole as string)
    ) {
      throw new Error("Permission refusée");
    }

    const trends = await calculateProductivityTrends(
      targetUserId,
      parsedInput.days || 30
    );

    return trends;
  });

/**
 * Récupère les insights intelligents
 */
export const getTaskInsights = authActionClient
  .schema(
    z.object({
      userId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    // "use cache";
    cacheTag("analytics");
    cacheTag(`analytics-insights-${ctx.userId}`);

    const targetUserId = parsedInput.userId || ctx.userId;

    // Vérifier les permissions
    const session = await getSession();
    const userRole = getUserRole(session);
    if (
      targetUserId !== ctx.userId &&
      !["ADMIN", "MANAGER", "DIRECTEUR"].includes(userRole as string)
    ) {
      throw new Error("Permission refusée");
    }

    const insights = await calculateInsights(targetUserId);

    return insights;
  });

/**
 * Récupère un dashboard complet avec toutes les métriques
 * (Optimisé avec requêtes parallèles)
 */
export const getAnalyticsDashboard = authActionClient
  .schema(
    z.object({
      userId: z.string().optional(),
      days: z.number().min(7).max(90).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    // "use cache";
    cacheTag("analytics");
    cacheTag(`analytics-dashboard-${ctx.userId}`);

    const targetUserId = parsedInput.userId || ctx.userId;
    const days = parsedInput.days || 30;

    // Vérifier les permissions
    const session = await getSession();
    const userRole = getUserRole(session);
    if (
      targetUserId !== ctx.userId &&
      !["ADMIN", "MANAGER", "DIRECTEUR"].includes(userRole as string)
    ) {
      throw new Error("Permission refusée");
    }

    // Calculer les dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ⚡ Requêtes parallèles pour optimiser les performances
    const [metrics, trends, insights, projectPerformance] = await Promise.all([
      calculateTaskMetrics(targetUserId, undefined, startDate, endDate),
      calculateProductivityTrends(targetUserId, days),
      calculateInsights(targetUserId),
      calculateProjectPerformance(startDate, endDate),
    ]);

    // Optionnel : Performance utilisateurs (si manager)
    let userPerformance = null;
    if (["ADMIN", "MANAGER", "DIRECTEUR"].includes(userRole as string)) {
      userPerformance = await calculateUserPerformance(startDate, endDate, 10);
    }

    return {
      metrics,
      trends,
      insights,
      projectPerformance,
      userPerformance,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
    };
  });
