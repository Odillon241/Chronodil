#!/usr/bin/env tsx
/**
 * Script pour appliquer la migration de changement de taille de police
 * Ce script peut être exécuté quand la base de données est accessible
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyFontSizeMigration() {
  try {
    console.log('🔄 Application de la migration de taille de police...');
    
    // Changer la valeur par défaut
    await prisma.$executeRaw`
      ALTER TABLE "User" ALTER COLUMN "fontSize" SET DEFAULT 12;
    `;
    console.log('✅ Valeur par défaut changée à 12');
    
    // Mettre à jour les utilisateurs existants avec l'ancienne valeur par défaut
    const result = await prisma.$executeRaw`
      UPDATE "User" SET "fontSize" = 12 WHERE "fontSize" = 16;
    `;
    console.log(`✅ Utilisateurs mis à jour: ${result}`);
    
    console.log('🎉 Migration appliquée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyFontSizeMigration()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

