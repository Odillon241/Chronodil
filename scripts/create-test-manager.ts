import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function createTestManager() {
  try {
    console.log('🔧 Création d\'un compte Manager de test...\n');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'manager@chronodil.com' },
    });

    if (existingUser) {
      console.log('⚠️  L\'utilisateur manager@chronodil.com existe déjà');
      console.log('   Mise à jour du rôle en MANAGER...\n');

      const updatedUser = await prisma.user.update({
        where: { email: 'manager@chronodil.com' },
        data: { role: 'MANAGER' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      console.log('✅ Utilisateur mis à jour:');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Nom: ${updatedUser.name}`);
      console.log(`   Rôle: ${updatedUser.role}`);
      console.log(`   ID: ${updatedUser.id}`);
    } else {
      console.log('📝 Création d\'un nouveau manager...\n');

      // Créer d'abord l'utilisateur dans la table user
      const now = new Date();
      const newUser = await prisma.user.create({
        data: {
          id: nanoid(),
          email: 'manager@chronodil.com',
          name: 'Manager Test',
          role: 'MANAGER',
          updatedAt: now,
        },
      });

      console.log('✅ Manager créé avec succès:');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Nom: ${newUser.name}`);
      console.log(`   Rôle: ${newUser.role}`);
      console.log(`   ID: ${newUser.id}`);

      // Créer le compte Better Auth
      console.log('\n📝 Création du compte Better Auth...');

      const betterAuthAccount = await prisma.account.create({
        data: {
          id: nanoid(),
          userId: newUser.id,
          accountId: newUser.id,
          providerId: 'credential',
          password: 'manager123', // Note: sera hashé par Better Auth lors de la première connexion
          updatedAt: now,
        },
      });

      console.log('✅ Compte Better Auth créé');
    }

    console.log('\n🎉 Configuration terminée!');
    console.log('\n📌 Vous pouvez maintenant vous connecter avec:');
    console.log('   Email: manager@chronodil.com');
    console.log('   Mot de passe: manager123');
    console.log('\n💡 Ce compte a accès à la page de validation.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestManager();

