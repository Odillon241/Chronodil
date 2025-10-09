import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed simplifié - Uniquement la structure de données...');

  // Nettoyer
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timesheetValidation.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.companySetting.deleteMany();

  console.log('✅ Base de données nettoyée');

  // Créer les départements
  const devDept = await prisma.department.create({
    data: {
      id: 'dept-dev-001',
      name: 'Développement',
      code: 'DEV',
      description: 'Équipe de développement logiciel',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Département créé');

  // Créer les utilisateurs SANS comptes (Better Auth les créera)
  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-001',
      name: 'Admin Système',
      email: 'admin@chronodil.com',
      emailVerified: true,
      role: 'ADMIN',
      departmentId: devDept.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Utilisateur admin créé');
  console.log('\n🎉 Seed terminé !');
  console.log('\n📋 Pour créer le compte admin, utilisez la page d\'inscription avec :');
  console.log('   Email: admin@chronodil.com');
  console.log('   Mot de passe: Admin2025!');
  console.log('\nOu utilisez Better Auth CLI pour créer le compte.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
