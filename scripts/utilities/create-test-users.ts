import { PrismaClient } from '@prisma/client';
import { auth } from '../../src/lib/auth';

const prisma = new PrismaClient();

const testUsers = [
  {
    name: 'Manager Test',
    email: 'manager@chronodil.com',
    password: 'Manager2025!',
    role: 'MANAGER',
  },
  {
    name: 'Employé Test',
    email: 'employe@chronodil.com',
    password: 'Employe2025!',
    role: 'EMPLOYEE',
  },
  {
    name: 'RH Test',
    email: 'rh@chronodil.com',
    password: 'RHTest2025!',
    role: 'HR',
  },
];

async function main() {
  console.log('👥 Création des utilisateurs de test...\n');

  for (const userData of testUsers) {
    try {
      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⚠️  ${userData.name} existe déjà, suppression...`);
        await prisma.account.deleteMany({ where: { userId: existingUser.id } });
        await prisma.session.deleteMany({ where: { userId: existingUser.id } });
        await prisma.user.delete({ where: { id: existingUser.id } });
      }

      // Créer l'utilisateur avec Better Auth
      const result = await auth.api.signUpEmail({
        body: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      });

      if (result && 'user' in result) {
        // Mettre à jour le rôle
        await prisma.user.update({
          where: { id: result.user.id },
          data: {
            role: userData.role as any,
            emailVerified: true,
          },
        });

        console.log(`✅ ${userData.name} créé avec succès`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Mot de passe: ${userData.password}`);
        console.log(`   Rôle: ${userData.role}\n`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la création de ${userData.name}:`, error.message);
    }
  }

  console.log('\n✅ Tous les utilisateurs de test ont été créés!');
  console.log('\n📋 Récapitulatif des comptes:');
  console.log('   1. admin@chronodil.com / Admin2025! (ADMIN)');
  console.log('   2. manager@chronodil.com / Manager2025! (MANAGER)');
  console.log('   3. employe@chronodil.com / Employe2025! (EMPLOYEE)');
  console.log('   4. rh@chronodil.com / RHTest2025! (HR)');
  console.log('\n🎉 Vous pouvez maintenant tester le système de chat!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

