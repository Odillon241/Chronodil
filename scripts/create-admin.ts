import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Configuration de l\'utilisateur admin...');

  // Chercher si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@chronodil.com' },
  });

  if (existingUser) {
    console.log('Utilisateur admin existe déjà. Suppression de l\'ancien compte...');
    // Supprimer les comptes et sessions existants
    await prisma.account.deleteMany({
      where: { userId: existingUser.id },
    });
    await prisma.session.deleteMany({
      where: { userId: existingUser.id },
    });
    await prisma.user.delete({
      where: { id: existingUser.id },
    });
    console.log('Ancien compte supprimé.');
  }

  // Créer un nouvel utilisateur avec Better Auth
  console.log('Création du nouvel utilisateur admin avec Better Auth...');

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: 'Administrateur',
        email: 'admin@chronodil.com',
        password: 'Admin2025!',
      },
    });

    if (result && 'user' in result) {
      // Mettre à jour le rôle et emailVerified
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          role: 'ADMIN',
          emailVerified: true,
        },
      });

      console.log('\n✅ Utilisateur admin configuré avec succès!');
      console.log('\n📋 Informations de connexion:');
      console.log('   Email        : admin@chronodil.com');
      console.log('   Mot de passe : Admin2025!');
      console.log('\n🔗 Connectez-vous sur: http://localhost:3000');
    } else {
      throw new Error('Échec de la création de l\'utilisateur');
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la création:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
