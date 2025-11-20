import { prisma } from '@/lib/db';
import { compare } from '@node-rs/bcrypt';

async function testPassword() {
  try {
    console.log('🔐 Test du mot de passe pour finaladmin@chronodil.com...\n');

    // Récupérer l'utilisateur avec le hash du mot de passe
    const user = await prisma.user.findUnique({
      where: { email: 'finaladmin@chronodil.com' },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé');
    console.log('📧 Email:', user.email);
    console.log('🔑 Hash stocké:', user.password ? 'Oui (présent)' : 'Non (absent!)');

    if (!user.password) {
      console.log('\n❌ PROBLÈME: Le champ password est vide !');
      console.log('💡 Solution: Exécuter le script set-admin-password.ts\n');
      return;
    }

    // Tester le mot de passe
    const testPassword = 'Admin2025!';
    console.log('\n🧪 Test du mot de passe:', testPassword);

    const isValid = await compare(testPassword, user.password);

    if (isValid) {
      console.log('✅ Mot de passe VALIDE ! Le hash correspond.\n');
    } else {
      console.log('❌ Mot de passe INVALIDE ! Le hash ne correspond pas.\n');
      console.log('💡 Solutions possibles:');
      console.log('  1. Vérifier que le mot de passe est bien "Admin2025!"');
      console.log('  2. Réinitialiser le mot de passe avec set-admin-password.ts');
      console.log('  3. Vérifier l\'algorithme de hashing (bcrypt)\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
