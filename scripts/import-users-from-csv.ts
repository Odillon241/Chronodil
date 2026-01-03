/**
 * Script pour importer les utilisateurs depuis l'ancienne base de données
 * Les mots de passe doivent être réinitialisés car ils ne sont pas exportables
 * 
 * Usage: npx tsx scripts/import-users-from-csv.ts
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient, Role } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Mot de passe temporaire pour tous les utilisateurs importés
const TEMP_PASSWORD = "Chronodil2026!";

// Données des utilisateurs à importer (extraites du CSV)
const usersToImport = [
  {
    email: "vanessamboumba@odillon.fr",
    name: "M'BOUMBA NDOMBI Vanessa",
    role: "EMPLOYEE" as Role,
    position: "Assistante Audit",
    accentColor: "ou-crimson",
    fontSize: 13,
  },
  {
    email: "nathaliebingangoye@odillon.fr",
    name: "BINGANGOYE Nathalie",
    role: "DIRECTEUR" as Role,
    position: "DIRECTEUR GENERALE",
    accentColor: "rusty-red",
    fontSize: 12,
  },
  {
    email: "elianetale@odillon.fr",
    name: "Tale Eliane",
    role: "MANAGER" as Role,
    position: "Manager / Administrative support & Team Lead",
    accentColor: "rusty-red",
    fontSize: 12,
  },
  {
    email: "dereckdanel@odillon.fr",
    name: "NEXON Déreck Danel",
    role: "EMPLOYEE" as Role,
    position: "IT-Digital helpdesk support",
    accentColor: "green-teal",
    fontSize: 12,
  },
  {
    email: "finaladmin@chronodil.com",
    name: "Administrator",
    role: "ADMIN" as Role,
    position: null,
    accentColor: "green-teal",
    fontSize: 12,
  },
  {
    email: "fethiabicke@odillon.fr",
    name: "Fethia BICKE-BI-NGUEMA",
    role: "EMPLOYEE" as Role,
    position: null,
    accentColor: "rusty-red",
    fontSize: 12,
  },
  {
    email: "abigaelnfono@odillon.fr",
    name: "NFONO Abigael",
    role: "EMPLOYEE" as Role,
    position: "Assistante Administrative et Logistique",
    accentColor: "green-teal",
    fontSize: 13,
  },
  {
    email: "test@chronodil.com",
    name: "Test User",
    role: "DIRECTEUR" as Role,
    position: null,
    accentColor: "green-teal",
    fontSize: 12,
  },
  {
    email: "egawanekono75@gmail.com",
    name: "EGAWAN BONIFACE EKONO",
    role: "EMPLOYEE" as Role,
    position: null,
    accentColor: "rusty-red",
    fontSize: 12,
  },
  {
    email: "glwadys.as@gmail.com",
    name: "Glwadys AS",
    role: "EMPLOYEE" as Role,
    position: null,
    accentColor: "rusty-red",
    fontSize: 12,
  },
  {
    email: "nadiataty@odillon.fr",
    name: "Taty Annick Nadia",
    role: "EMPLOYEE" as Role,
    position: "BUSINESS ADMINISTRATIVE AND CLIENT RELATIONS ASSISTANT",
    accentColor: "ou-crimson",
    fontSize: 14,
  },
  {
    email: "manager@odillon.fr",
    name: "Manager Odillon",
    role: "MANAGER" as Role,
    position: null,
    accentColor: "green-teal",
    fontSize: 12,
  },
];

async function importUsers() {
  console.log("📥 Importation des utilisateurs depuis l'ancienne base...\n");

  // Vérifier les variables d'environnement
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
  }

  // Créer le client Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results = {
    created: [] as string[],
    skipped: [] as string[],
    errors: [] as { email: string; error: string }[],
  };

  for (const user of usersToImport) {
    console.log(`\n👤 Traitement de ${user.email}...`);

    try {
      // Vérifier si l'utilisateur existe déjà dans Prisma
      const existingPrismaUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingPrismaUser) {
        console.log(`   ⚠️ Existe déjà dans Prisma (ID: ${existingPrismaUser.id})`);
        results.skipped.push(user.email);
        continue;
      }

      // Créer dans Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      });

      if (authError) {
        // Si l'utilisateur existe déjà dans Auth, récupérer son ID
        if (authError.message.includes("already been registered")) {
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingAuthUser = existingUsers?.users.find(u => u.email === user.email);
          
          if (existingAuthUser) {
            console.log(`   ℹ️ Existe déjà dans Supabase Auth, création dans Prisma...`);
            
            await prisma.user.create({
              data: {
                id: existingAuthUser.id,
                email: user.email,
                name: user.name,
                role: user.role,
                position: user.position,
                accentColor: user.accentColor,
                fontSize: user.fontSize,
                emailVerified: true,
                updatedAt: new Date(),
              },
            });
            
            results.created.push(user.email);
            console.log(`   ✅ Créé dans Prisma`);
            continue;
          }
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Utilisateur non créé dans Supabase Auth");
      }

      console.log(`   ✅ Créé dans Supabase Auth (ID: ${authData.user.id})`);

      // Créer dans Prisma
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          position: user.position,
          accentColor: user.accentColor,
          fontSize: user.fontSize,
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      console.log(`   ✅ Créé dans Prisma`);
      results.created.push(user.email);

    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}`);
      results.errors.push({ email: user.email, error: error.message });
    }
  }

  // Afficher le résumé
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DE L'IMPORTATION");
  console.log("=".repeat(60));
  console.log(`✅ Créés: ${results.created.length}`);
  results.created.forEach(email => console.log(`   - ${email}`));
  
  console.log(`\n⚠️ Ignorés (déjà existants): ${results.skipped.length}`);
  results.skipped.forEach(email => console.log(`   - ${email}`));
  
  console.log(`\n❌ Erreurs: ${results.errors.length}`);
  results.errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));

  console.log("\n" + "=".repeat(60));
  console.log(`🔑 Mot de passe temporaire pour tous: ${TEMP_PASSWORD}`);
  console.log("⚠️ Les utilisateurs devront réinitialiser leur mot de passe!");
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

importUsers().catch(console.error);
