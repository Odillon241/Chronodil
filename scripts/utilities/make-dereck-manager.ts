import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeDereckManager() {
  try {
    console.log('🔧 Changement du rôle de Déreck en MANAGER...\n');

    const user = await prisma.user.findUnique({
      where: { email: 'dereckdanel01@chronodil.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ Utilisateur Déreck non trouvé');
      return;
    }

    console.log('📌 Utilisateur actuel:');
    console.log(`   Nom: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle actuel: ${user.role}\n`);

    if (user.role === 'MANAGER') {
      console.log('✅ L\'utilisateur est déjà MANAGER');
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email: 'dereckdanel01@chronodil.com' },
      data: { role: 'MANAGER' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('✅ Rôle mis à jour avec succès!');
    console.log(`   Ancien rôle: ${user.role}`);
    console.log(`   Nouveau rôle: ${updatedUser.role}\n`);

    console.log('📝 Nouvelles permissions pour Déreck:');
    console.log('   ✓ Saisie des temps');
    console.log('   ✓ Validation des temps de l\'équipe');
    console.log('   ✓ Projets');
    console.log('   ✓ Tâches');
    console.log('   ✓ Chat');
    console.log('   ✓ Rapports de l\'équipe');
    console.log('   ✗ Gestion utilisateurs\n');

    console.log('🎉 Déreck peut maintenant accéder à la page de validation!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeDereckManager();

