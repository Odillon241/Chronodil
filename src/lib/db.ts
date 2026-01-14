import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Charger les variables d'environnement si pas déjà fait
if (!process.env.DATABASE_URL) {
  try {
    const path = require('path')
    const fs = require('fs')
    const envPath = path.resolve(process.cwd(), '.env.development')
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath })
    }
    // Fallback sur .env
    if (!process.env.DATABASE_URL) {
      require('dotenv').config()
    }
  } catch {
    // dotenv peut ne pas être disponible dans tous les environnements
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Utiliser connectionString directement avec PrismaPg (recommandé par la doc Prisma)
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
