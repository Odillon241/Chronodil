/**
 * Script pour créer un utilisateur administrateur initial
 * Utilise Supabase Auth Admin API
 * 
 * Usage: npx tsx scripts/create-admin-user.ts
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration de l'utilisateur admin
const ADMIN_USER = {
  email: "admin@chronodil.com",
  password: "Admin@2026!", // À changer après la première connexion
  name: "Administrateur",
  role: "ADMIN" as const,
};

async function createAdminUser() {
  console.log("🔐 Création de l'utilisateur administrateur...\n");

  // Vérifier les variables d'environnement
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Variables d'environnement manquantes:");
    console.error("   - NEXT_PUBLIC_SUPABASE_URL");
    console.error("   - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Créer le client Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Vérifier si l'utilisateur existe déjà dans Prisma
    const existingPrismaUser = await prisma.user.findUnique({
      where: { email: ADMIN_USER.email },
    });

    if (existingPrismaUser) {
      console.log("⚠️  Un utilisateur avec cet email existe déjà dans Prisma");
      console.log(`   ID: ${existingPrismaUser.id}`);
      console.log(`   Role: ${existingPrismaUser.role}`);
      
      // Vérifier s'il existe aussi dans Supabase Auth
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users.find(u => u.email === ADMIN_USER.email);
      
      if (existingAuthUser) {
        console.log("\n✅ L'utilisateur existe également dans Supabase Auth");
        console.log(`   Auth ID: ${existingAuthUser.id}`);
      } else {
        console.log("\n⚠️  L'utilisateur n'existe pas dans Supabase Auth");
        console.log("   Création dans Supabase Auth...");
        
        const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_USER.email,
          password: ADMIN_USER.password,
          email_confirm: true,
          user_metadata: {
            name: ADMIN_USER.name,
            role: ADMIN_USER.role,
          },
        });
        
        if (authError) {
          throw authError;
        }
        
        // Mettre à jour l'ID dans Prisma si différent
        if (newAuthUser?.user && newAuthUser.user.id !== existingPrismaUser.id) {
          console.log("   Mise à jour de l'ID Prisma...");
          // Supprimer l'ancien et créer avec le nouvel ID
          await prisma.user.delete({ where: { id: existingPrismaUser.id } });
          await prisma.user.create({
            data: {
              id: newAuthUser.user.id,
              email: ADMIN_USER.email,
              name: ADMIN_USER.name,
              role: ADMIN_USER.role,
              emailVerified: true,
              updatedAt: new Date(),
            },
          });
          console.log("   ✅ ID Prisma mis à jour");
        }
      }
      
      console.log("\n📧 Connexion avec:");
      console.log(`   Email: ${ADMIN_USER.email}`);
      console.log(`   Mot de passe: ${ADMIN_USER.password}`);
      return;
    }

    // Créer l'utilisateur dans Supabase Auth
    console.log("📝 Création dans Supabase Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_USER.name,
        role: ADMIN_USER.role,
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Utilisateur non créé dans Supabase Auth");
    }

    console.log(`   ✅ Créé avec ID: ${authData.user.id}`);

    // Créer l'utilisateur dans Prisma
    console.log("\n📝 Création dans Prisma...");
    const prismaUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: ADMIN_USER.email,
        name: ADMIN_USER.name,
        role: ADMIN_USER.role,
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Créé avec ID: ${prismaUser.id}`);

    console.log("\n🎉 Utilisateur administrateur créé avec succès!\n");
    console.log("📧 Connexion avec:");
    console.log(`   Email: ${ADMIN_USER.email}`);
    console.log(`   Mot de passe: ${ADMIN_USER.password}`);
    console.log("\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!");

  } catch (error) {
    console.error("\n❌ Erreur lors de la création:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
