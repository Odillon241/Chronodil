/**
 * Script pour tester la connexion à la nouvelle base de données Supabase
 * Projet: Chronodil
 * ID: kucajoobtwptpdanuvnj
 */

import { PrismaClient } from '@prisma/client'

const DATABASE_URL = `postgresql://postgres.kucajoobtwptpdanuvnj:Odillon-ga2026%40@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10`

async function testConnection() {
  console.log('🔄 Test de connexion à la base de données Supabase...')
  console.log(`📍 Project ID: kucajoobtwptpdanuvnj`)
  console.log(`🌍 Region: West Europe (London)`)
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    }
  })

  try {
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Connexion réussie!')
    console.log('📊 Résultat du test:', result)
    
    // Afficher les informations de connexion pour .env.local
    console.log('\n📋 Variables d\'environnement pour .env.local:\n')
    console.log('# Supabase Database')
    console.log(`DATABASE_URL="postgresql://postgres.kucajoobtwptpdanuvnj:Odillon-ga2026%40@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"`)
    console.log(`DIRECT_URL="postgresql://postgres.kucajoobtwptpdanuvnj:Odillon-ga2026%40@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"`)
    console.log('')
    console.log('# Supabase API')
    console.log(`NEXT_PUBLIC_SUPABASE_URL="https://kucajoobtwptpdanuvnj.supabase.co"`)
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Y2Fqb29idHdwdHBkYW51dm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODU1NDMsImV4cCI6MjA4Mjk2MTU0M30.j_F9y_DmKYSNS3wW1RAPTb5t-QMNqnCP0UfO1U4Ruzk"`)
    console.log(`SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Y2Fqb29idHdwdHBkYW51dm5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM4NTU0MywiZXhwIjoyMDgyOTYxNTQzfQ.MTk5CGX_9xVG5v9VFY-SGN42D48a4kxP2OLnpR2ivLg"`)
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
