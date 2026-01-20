'use server'

import { getSession, getUserRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { Prisma } from '../generated/prisma/client'

// Jours fériés
const holidaySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  date: z.coerce.date(), // coerce permet de convertir string -> Date automatiquement
  description: z.string().optional().default(''),
  isRecurring: z.boolean().default(false),
})

const updateHolidaySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  date: z.coerce.date().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
})

export const getHolidays = actionClient
  .schema(z.object({ year: z.number().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Si aucune année n'est spécifiée, charger TOUS les jours fériés
    // Sinon, filtrer par année
    const whereClause = parsedInput.year
      ? {
          date: {
            gte: new Date(parsedInput.year, 0, 1),
            lte: new Date(parsedInput.year, 11, 31, 23, 59, 59),
          },
        }
      : {}

    const holidays = await prisma.holiday.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc',
      },
    })

    return holidays
  })

export const createHoliday = actionClient.schema(holidaySchema).action(async ({ parsedInput }) => {
  const session = await getSession()

  if (!session || (getUserRole(session) !== 'ADMIN' && getUserRole(session) !== 'HR')) {
    throw new Error('Accès non autorisé')
  }

  try {
    const holiday = await prisma.holiday.create({
      data: {
        id: nanoid(),
        ...parsedInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return holiday
  } catch (error) {
    // Gérer les erreurs de contrainte unique (jour férié déjà existant)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Ce jour férié existe déjà pour cette date')
      }
    }
    throw error
  }
})

export const updateHoliday = actionClient
  .schema(updateHolidaySchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session || (getUserRole(session) !== 'ADMIN' && getUserRole(session) !== 'HR')) {
      throw new Error('Accès non autorisé')
    }

    const { id, ...data } = parsedInput

    const holiday = await prisma.holiday.update({
      where: { id },
      data,
    })

    return holiday
  })

export const deleteHoliday = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session || (getUserRole(session) !== 'ADMIN' && getUserRole(session) !== 'HR')) {
      throw new Error('Accès non autorisé')
    }

    await prisma.holiday.delete({
      where: { id: parsedInput.id },
    })

    return { success: true }
  })

// Paramètres de l'entreprise
const settingSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
})

export const getSettings = actionClient.schema(z.object({})).action(async () => {
  const session = await getSession()

  if (!session || (getUserRole(session) !== 'ADMIN' && getUserRole(session) !== 'HR')) {
    throw new Error('Accès non autorisé')
  }

  const settings = await prisma.companySetting.findMany({
    orderBy: {
      key: 'asc',
    },
  })

  return settings
})

export const updateSetting = actionClient.schema(settingSchema).action(async ({ parsedInput }) => {
  const session = await getSession()

  if (!session || getUserRole(session) !== 'ADMIN') {
    throw new Error('Accès non autorisé')
  }

  const existing = await prisma.companySetting.findUnique({
    where: { key: parsedInput.key },
  })

  if (existing) {
    const setting = await prisma.companySetting.update({
      where: { key: parsedInput.key },
      data: {
        value: parsedInput.value,
        type: parsedInput.type,
        description: parsedInput.description,
        updatedAt: new Date(),
      },
    })
    return setting
  } else {
    const setting = await prisma.companySetting.create({
      data: {
        id: nanoid(),
        key: parsedInput.key,
        value: parsedInput.value,
        type: parsedInput.type || 'string',
        description: parsedInput.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    return setting
  }
})

// Départements
const departmentSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().min(1, 'Le code est requis'),
  description: z.string().optional(),
})

export const getDepartments = actionClient.schema(z.object({})).action(async () => {
  const session = await getSession()

  if (!session) {
    throw new Error('Non authentifié')
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          User: true,
          Project: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return departments
})

export const createDepartment = actionClient
  .schema(departmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session || (getUserRole(session) !== 'ADMIN' && getUserRole(session) !== 'HR')) {
      throw new Error('Accès non autorisé')
    }

    const department = await prisma.department.create({
      data: {
        id: nanoid(),
        ...parsedInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return department
  })

export const deleteDepartment = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session || (getUserRole(session) !== 'ADMIN' && getUserRole(session) !== 'HR')) {
      throw new Error('Accès non autorisé')
    }

    await prisma.department.delete({
      where: { id: parsedInput.id },
    })

    return { success: true }
  })
