import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentUserRole() {
  try {
    console.log('🔍 Vérification des utilisateurs et de leurs rôles...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sans nom'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // Vérifier combien ont accès à la validation
    const validationUsers = users.filter(u => 
      ['MANAGER', 'HR', 'ADMIN'].includes(u.role)
    );

    console.log(`\n📊 Utilisateurs avec accès à la validation: ${validationUsers.length}/${users.length}`);
    
    if (validationUsers.length > 0) {
      console.log('\nUtilisateurs autorisés:');
      validationUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
    } else {
      console.log('\n⚠️  AUCUN utilisateur n\'a accès à la page de validation!');
      console.log('   Vous devez avoir un rôle MANAGER, HR ou ADMIN.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUserRole();

