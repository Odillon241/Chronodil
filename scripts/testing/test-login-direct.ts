import { prisma } from '@/lib/db';
import { compare } from '@node-rs/bcrypt';

async function testLogin() {
  try {
    console.log('🔐 Test de connexion directe...\n');

    const email = 'finaladmin@chronodil.com';
    const password = 'Admin2025!';

    // 1. Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:', user.email);

    // 2. Trouver le compte (c'est là que le mot de passe est stocké pour Better Auth)
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
    });

    if (!account) {
      console.log('❌ Compte credential non trouvé');
      return;
    }

    console.log('✅ Compte credential trouvé');

    if (!account.password) {
      console.log('❌ Pas de mot de passe dans le compte');
      return;
    }

    console.log('✅ Mot de passe présent dans le compte');

    // 3. Vérifier le mot de passe
    const isValid = await compare(password, account.password);

    if (isValid) {
      console.log('\n🎉 ✅ SUCCÈS ! Le mot de passe est correct !\n');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email:         ' + email);
      console.log('🔑 Mot de passe:  ' + password);
      console.log('👤 Nom:           ' + user.name);
      console.log('👔 Rôle:          ' + user.role);
      console.log('═══════════════════════════════════════\n');
      console.log('✨ Vous pouvez maintenant vous connecter via le navigateur !\n');
    } else {
      console.log('\n❌ ÉCHEC ! Le mot de passe ne correspond pas.\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
