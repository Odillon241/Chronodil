import { PrismaClient, Role } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function updateUserRole() {
  try {
    console.log('🔧 Changement de rôle utilisateur\n');

    // Lister tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      rl.close();
      return;
    }

    console.log('📋 Utilisateurs disponibles:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sans nom'} (${user.email})`);
      console.log(`   Rôle actuel: ${user.role}\n`);
    });

    const userChoice = await question('Entrez le numéro de l\'utilisateur à modifier: ');
    const userIndex = parseInt(userChoice) - 1;

    if (userIndex < 0 || userIndex >= users.length) {
      console.log('❌ Choix invalide');
      rl.close();
      return;
    }

    const selectedUser = users[userIndex];

    console.log('\n📌 Rôles disponibles:');
    console.log('1. EMPLOYEE - Employé standard');
    console.log('2. MANAGER - Manager (accès validation)');
    console.log('3. HR - Ressources Humaines (accès validation et RH)');
    console.log('4. ADMIN - Administrateur (accès complet)');

    const roleChoice = await question('\nEntrez le numéro du nouveau rôle: ');

    let newRole: Role;
    switch (roleChoice) {
      case '1':
        newRole = Role.EMPLOYEE;
        break;
      case '2':
        newRole = Role.MANAGER;
        break;
      case '3':
        newRole = Role.HR;
        break;
      case '4':
        newRole = Role.ADMIN;
        break;
      default:
        console.log('❌ Choix invalide');
        rl.close();
        return;
    }

    if (selectedUser.role === newRole) {
      console.log(`\n⚠️  L'utilisateur a déjà le rôle ${newRole}`);
      rl.close();
      return;
    }

    // Protection pour l'admin
    if (selectedUser.email === 'admin@chronodil.com' && newRole !== Role.ADMIN) {
      const confirm = await question(
        '\n⚠️  ATTENTION: Vous êtes sur le point de modifier le rôle du compte admin principal.\n' +
        '   Êtes-vous sûr ? (oui/non): '
      );
      
      if (confirm.toLowerCase() !== 'oui') {
        console.log('\n❌ Opération annulée');
        rl.close();
        return;
      }
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id: selectedUser.id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('\n✅ Rôle mis à jour avec succès!');
    console.log(`   Utilisateur: ${updatedUser.name} (${updatedUser.email})`);
    console.log(`   Ancien rôle: ${selectedUser.role}`);
    console.log(`   Nouveau rôle: ${updatedUser.role}`);

    // Afficher les permissions
    console.log('\n📝 Permissions:');
    if (newRole === Role.EMPLOYEE) {
      console.log('   ✓ Saisie des temps');
      console.log('   ✓ Projets (lecture seule)');
      console.log('   ✓ Chat');
      console.log('   ✗ Validation');
      console.log('   ✗ Rapports avancés');
      console.log('   ✗ Gestion utilisateurs');
    } else if (newRole === Role.MANAGER) {
      console.log('   ✓ Toutes les permissions EMPLOYEE');
      console.log('   ✓ Validation des temps de l\'équipe');
      console.log('   ✓ Rapports de l\'équipe');
      console.log('   ✗ Gestion utilisateurs');
    } else if (newRole === Role.HR) {
      console.log('   ✓ Toutes les permissions MANAGER');
      console.log('   ✓ Validation de tous les temps');
      console.log('   ✓ Timesheets RH');
      console.log('   ✓ Rapports globaux');
      console.log('   ✗ Gestion utilisateurs (limitée)');
    } else if (newRole === Role.ADMIN) {
      console.log('   ✓ Accès complet à toutes les fonctionnalités');
      console.log('   ✓ Gestion des utilisateurs');
      console.log('   ✓ Configuration système');
      console.log('   ✓ Audit');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

updateUserRole();

