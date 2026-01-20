'use server'

import { getSession, getUserRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'

const getAuditLogsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const getAuditLogs = actionClient
  .schema(getAuditLogsSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()
    const userRole = getUserRole(session)

    // Seul l'administrateur peut voir les audits
    if (!session || userRole !== 'ADMIN') {
      throw new Error('Accès non autorisé - Rôle ADMIN requis')
    }

    // Récupérer TOUS les audits (tous les utilisateurs), pas seulement ceux de l'admin
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(parsedInput.entity && { entity: parsedInput.entity }),
        ...(parsedInput.userId && { userId: parsedInput.userId }),
        ...(parsedInput.action && { action: parsedInput.action }),
        ...((parsedInput.startDate || parsedInput.endDate) && {
          createdAt: {
            ...(parsedInput.startDate && { gte: new Date(parsedInput.startDate) }),
            ...(parsedInput.endDate && {
              lte: new Date(new Date(parsedInput.endDate).setHours(23, 59, 59, 999)),
            }), // Fin de journée
          },
        }),
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parsedInput.limit || 100,
      skip: parsedInput.offset || 0,
    })

    return logs
  })

export const getAuditStats = actionClient.schema(z.object({})).action(async () => {
  const session = await getSession()
  const userRole = getUserRole(session)

  // Seul l'administrateur peut voir les statistiques d'audit
  if (!session || userRole !== 'ADMIN') {
    throw new Error('Accès non autorisé - Rôle ADMIN requis')
  }

  const total = await prisma.auditLog.count()

  const byAction = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: {
      action: true,
    },
    orderBy: {
      _count: {
        action: 'desc',
      },
    },
    take: 5,
  })

  const byEntity = await prisma.auditLog.groupBy({
    by: ['entity'],
    _count: {
      entity: true,
    },
    orderBy: {
      _count: {
        entity: 'desc',
      },
    },
    take: 5,
  })

  return {
    total,
    byAction: byAction.map((item) => ({
      action: item.action,
      count: item._count.action,
    })),
    byEntity: byEntity.map((item) => ({
      entity: item.entity,
      count: item._count.entity,
    })),
  }
})
