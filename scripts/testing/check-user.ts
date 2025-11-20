import { prisma } from '@/lib/db';

async function checkUser() {
  try {
    console.log('🔍 Recherche de l\'utilisateur finaladmin@chronodil.com...\n');

    const user = await prisma.user.findUnique({
      where: { email: 'finaladmin@chronodil.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    if (user) {
      console.log('✅ Utilisateur trouvé !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Nom:', user.name || '(non défini)');
      console.log('Rôle:', user.role);
      console.log('Email vérifié:', user.emailVerified ? 'Oui' : 'Non');
      console.log('Créé le:', user.createdAt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Vérifier les sessions actives
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { expiresAt: 'desc' },
        take: 5,
      });

      console.log(`📊 Sessions actives: ${sessions.length}`);
      if (sessions.length > 0) {
        sessions.forEach((session, index) => {
          console.log(`  Session ${index + 1}:`);
          console.log(`    - ID: ${session.id}`);
          console.log(`    - Expire le: ${session.expiresAt}`);
          console.log(`    - Token: ${session.token.substring(0, 20)}...`);
        });
      }

    } else {
      console.log('❌ Utilisateur NON trouvé dans la base de données !');
      console.log('\n💡 Suggestions:');
      console.log('  1. Vérifier que l\'utilisateur a bien été créé');
      console.log('  2. Exécuter le script set-admin-password.ts pour créer/réinitialiser le compte');
      console.log('  3. Vérifier la connexion à la base de données\n');
    }

    // Tester la connexion à la base de données
    console.log('\n🔗 Test de connexion à la base de données...');
    const userCount = await prisma.user.count();
    console.log(`✅ Connexion réussie ! Total utilisateurs: ${userCount}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
