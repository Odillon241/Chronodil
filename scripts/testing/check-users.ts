import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 Vérification des utilisateurs dans la base de données...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        image: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`✅ ${users.length} utilisateurs trouvés dans la base de données:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Créé: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé. Veuillez exécuter le script create-test-users.ts');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des utilisateurs:', error);
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
