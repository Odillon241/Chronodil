import { unstable_cache } from "next/cache";
import { cache } from "react";

/**
 * 🚀 Cache utilities pour Next.js 16
 *
 * Utilise unstable_cache pour le caching côté serveur avec revalidation
 * et React cache pour la déduplication des requêtes dans le même render
 */

// Tags de cache pour invalidation ciblée
export const CacheTags = {
  PROJECTS: "projects",
  USERS: "users",
  TASKS: "tasks",
  REPORTS: "reports",
  VALIDATIONS: "validations",
  DEPARTMENTS: "departments",
  NOTIFICATIONS: "notifications",
} as const;

// Durées de revalidation (en secondes)
export const CacheDuration = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 heure
  VERY_LONG: 86400, // 24 heures
} as const;

/**
 * Wrapper pour créer des fonctions cachées avec Next.js unstable_cache
 *
 * @example
 * const getCachedProjects = createCachedFunction(
 *   async (userId: string) => await prisma.project.findMany({ where: { userId } }),
 *   ['projects'],
 *   { revalidate: CacheDuration.MEDIUM, tags: [CacheTags.PROJECTS] }
 * );
 */
export function createCachedFunction<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
  options: {
    revalidate?: number;
    tags?: string[];
  } = {}
) {
  return unstable_cache(fn, keyParts, {
    revalidate: options.revalidate,
    tags: options.tags,
  });
}

/**
 * Wrapper React cache pour déduplication dans le même render
 * Combine avec unstable_cache pour une stratégie de caching complète
 */
export function createDeduplicatedFunction<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  return cache(fn);
}
