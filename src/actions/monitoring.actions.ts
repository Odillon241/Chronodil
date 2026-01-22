'use server'

import { prisma } from '@/lib/db'
import { adminOrDirecteurActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import type {
  MonitoringStats,
  DepartmentStats,
  SecuritySummary,
  AuditLogWithUser,
  AlertConfig,
  HourlyActivity,
} from '@/types/monitoring'

// ============================================
// SCHEMAS
// ============================================

const getMonitoringStatsSchema = z.object({})

const getDepartmentStatsSchema = z.object({
  departmentId: z.string().optional(),
})

const getRecentActivitySchema = z.object({
  limit: z.number().optional().default(50),
  entity: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const saveAlertConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['threshold', 'anomaly', 'security']),
  enabled: z.boolean(),
  threshold: z.number().optional(),
  metric: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
})

// ============================================
// ACTIONS
// ============================================

/**
 * Obtenir les statistiques globales de monitoring
 */
export const getMonitoringStats = adminOrDirecteurActionClient
  .schema(getMonitoringStatsSchema)
  .action(async (): Promise<MonitoringStats> => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)

    // Utiliser Promise.all pour paralléliser les requêtes
    const [eventsLast24h, eventsLastHour, totalUsers, activeSessions, securityEventsCount] =
      await Promise.all([
        // Events dans les dernières 24h
        prisma.auditLog.count({
          where: {
            createdAt: { gte: last24h },
          },
        }),
        // Events dans la dernière heure
        prisma.auditLog.count({
          where: {
            createdAt: { gte: lastHour },
          },
        }),
        // Total des utilisateurs
        prisma.user.count(),
        // Sessions actives (non expirées)
        prisma.session.count({
          where: {
            expiresAt: { gt: now },
          },
        }),
        // Événements de sécurité (auth failures, etc.) dans les 24h
        prisma.auditLog.count({
          where: {
            createdAt: { gte: last24h },
            action: {
              in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT'],
            },
          },
        }),
      ])

    return {
      eventsLast24h,
      eventsLastHour,
      usersOnline: activeSessions,
      activeAlerts: 0, // À implémenter avec table Alerts
      securityEvents: securityEventsCount,
      totalUsers,
    }
  })

/**
 * Obtenir l'activité horaire des dernières 24h
 */
export const getHourlyActivity = adminOrDirecteurActionClient
  .schema(z.object({}))
  .action(async (): Promise<HourlyActivity[]> => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Récupérer les logs et grouper par heure côté application
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: last24h },
      },
      select: {
        createdAt: true,
      },
    })

    // Grouper par heure
    const hourlyMap = new Map<number, number>()
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0)
    }

    logs.forEach((log) => {
      const hour = new Date(log.createdAt).getHours()
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
    })

    return Array.from(hourlyMap.entries()).map(([hour, count]) => ({
      hour,
      count,
    }))
  })

/**
 * Obtenir les statistiques par département
 */
export const getDepartmentActivityStats = adminOrDirecteurActionClient
  .schema(getDepartmentStatsSchema)
  .action(async ({ parsedInput }): Promise<DepartmentStats[]> => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Récupérer tous les départements avec leurs utilisateurs
    const departments = await prisma.department.findMany({
      where: parsedInput.departmentId ? { id: parsedInput.departmentId } : undefined,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Pour chaque département, récupérer les stats
    const stats = await Promise.all(
      departments.map(async (dept) => {
        const userIds = dept.User.map((u) => u.id)

        // Sessions actives pour ce département
        const activeSessions = await prisma.session.count({
          where: {
            userId: { in: userIds },
            expiresAt: { gt: now },
          },
        })

        // Événements des dernières 24h pour ce département
        const events = await prisma.auditLog.findMany({
          where: {
            userId: { in: userIds },
            createdAt: { gte: last24h },
          },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })

        // Top performers (utilisateurs avec le plus d'événements)
        const userEventCounts = new Map<string, { user: (typeof dept.User)[0]; count: number }>()
        events.forEach((event) => {
          if (event.userId && event.User) {
            const existing = userEventCounts.get(event.userId)
            if (existing) {
              existing.count++
            } else {
              userEventCounts.set(event.userId, {
                user: event.User,
                count: 1,
              })
            }
          }
        })

        const topPerformers = Array.from(userEventCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((item) => ({
            userId: item.user.id,
            userName: item.user.name,
            userEmail: item.user.email,
            eventCount: item.count,
          }))

        // Activité récente
        const recentActivity = events.slice(0, 10).map((e) => ({
          id: e.id,
          action: e.action,
          entity: e.entity,
          userId: e.userId || '',
          userName: e.User?.name || 'Système',
          createdAt: e.createdAt,
        }))

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          userCount: dept.User.length,
          activeUsers: activeSessions,
          eventsLast24h: events.length,
          topPerformers,
          recentActivity,
        }
      }),
    )

    return stats
  })

/**
 * Obtenir le résumé de sécurité
 */
export const getSecuritySummary = adminOrDirecteurActionClient
  .schema(z.object({}))
  .action(async (): Promise<SecuritySummary> => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Compter les différents types d'événements de sécurité
    const [authFailures, rateLimitHits, unauthorizedAccess, lastSecurityEvent] = await Promise.all([
      prisma.auditLog.count({
        where: {
          createdAt: { gte: last24h },
          action: { in: ['LOGIN_FAILED', 'AUTH_FAILURE'] },
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: last24h },
          action: 'RATE_LIMIT',
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: last24h },
          action: 'UNAUTHORIZED_ACCESS',
        },
      }),
      prisma.auditLog.findFirst({
        where: {
          action: {
            in: [
              'LOGIN_FAILED',
              'AUTH_FAILURE',
              'RATE_LIMIT',
              'UNAUTHORIZED_ACCESS',
              'XSS_ATTEMPT',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ])

    return {
      authFailures,
      rateLimitHits,
      unauthorizedAccess,
      xssAttempts: 0, // Ces événements sont loggés dans la console, pas en DB pour l'instant
      criticalEvents: authFailures + unauthorizedAccess,
      lastSecurityEvent: lastSecurityEvent?.createdAt || null,
    }
  })

/**
 * Obtenir l'activité récente avec filtres
 */
export const getRecentActivity = adminOrDirecteurActionClient
  .schema(getRecentActivitySchema)
  .action(async ({ parsedInput }): Promise<AuditLogWithUser[]> => {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(parsedInput.entity && { entity: parsedInput.entity }),
        ...(parsedInput.action && { action: parsedInput.action }),
        ...(parsedInput.userId && { userId: parsedInput.userId }),
        ...((parsedInput.startDate || parsedInput.endDate) && {
          createdAt: {
            ...(parsedInput.startDate && { gte: new Date(parsedInput.startDate) }),
            ...(parsedInput.endDate && {
              lte: new Date(new Date(parsedInput.endDate).setHours(23, 59, 59, 999)),
            }),
          },
        }),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            departmentId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parsedInput.limit,
    })

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      changes: log.changes as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      User: log.User
        ? {
            id: log.User.id,
            name: log.User.name,
            email: log.User.email,
            departmentId: log.User.departmentId,
          }
        : null,
    }))
  })

/**
 * Obtenir le nombre d'utilisateurs en ligne
 */
export const getOnlineUsersCount = adminOrDirecteurActionClient
  .schema(z.object({}))
  .action(
    async (): Promise<{ count: number; users: { id: string; name: string; email: string }[] }> => {
      const now = new Date()

      // Sessions actives (non expirées)
      const activeSessions = await prisma.session.findMany({
        where: {
          expiresAt: { gt: now },
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        distinct: ['userId'],
        orderBy: { updatedAt: 'desc' },
      })

      return {
        count: activeSessions.length,
        users: activeSessions.map((s) => ({
          id: s.User.id,
          name: s.User.name,
          email: s.User.email,
        })),
      }
    },
  )

/**
 * Sauvegarder une configuration d'alerte
 */
export const saveAlertConfig = adminOrDirecteurActionClient
  .schema(saveAlertConfigSchema)
  .action(async ({ parsedInput }): Promise<AlertConfig> => {
    // Pour l'instant, on stocke en mémoire/cache
    // TODO: Créer une table AlertConfig dans Prisma si nécessaire

    const now = new Date()
    const alertConfig: AlertConfig = {
      id: parsedInput.id || crypto.randomUUID(),
      name: parsedInput.name,
      type: parsedInput.type,
      enabled: parsedInput.enabled,
      threshold: parsedInput.threshold,
      metric: parsedInput.metric,
      severity: parsedInput.severity,
      createdAt: now,
      updatedAt: now,
    }

    return alertConfig
  })

/**
 * Obtenir les statistiques d'actions par type
 */
export const getActionTypeStats = adminOrDirecteurActionClient
  .schema(z.object({ days: z.number().optional().default(7) }))
  .action(async ({ parsedInput }) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parsedInput.days)

    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    })

    const total = stats.reduce((sum, s) => sum + s._count.action, 0)

    return stats.map((s) => ({
      action: s.action,
      count: s._count.action,
      percentage: total > 0 ? Math.round((s._count.action / total) * 100) : 0,
    }))
  })

/**
 * Obtenir les statistiques d'entités
 */
export const getEntityStats = adminOrDirecteurActionClient
  .schema(z.object({ days: z.number().optional().default(7) }))
  .action(async ({ parsedInput }) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parsedInput.days)

    const stats = await prisma.auditLog.groupBy({
      by: ['entity'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { entity: true },
      orderBy: { _count: { entity: 'desc' } },
      take: 10,
    })

    const total = stats.reduce((sum, s) => sum + s._count.entity, 0)

    return stats.map((s) => ({
      entity: s.entity,
      count: s._count.entity,
      percentage: total > 0 ? Math.round((s._count.entity / total) * 100) : 0,
    }))
  })
