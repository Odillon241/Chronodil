import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed de la base de données...');

  // Nettoyer la base de données
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timesheetValidation.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
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

  const designDept = await prisma.department.create({
    data: {
      id: 'dept-des-001',
      name: 'Design',
      code: 'DES',
      description: 'Équipe de design et UX',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const rhDept = await prisma.department.create({
    data: {
      id: 'dept-rh-001',
      name: 'Ressources Humaines',
      code: 'RH',
      description: 'Département des ressources humaines',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Départements créés');

  // Créer les utilisateurs
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

  const manager = await prisma.user.create({
    data: {
      id: 'user-manager-001',
      name: 'Sophie Martin',
      email: 'manager@chronodil.com',
      emailVerified: true,
      role: 'MANAGER',
      departmentId: devDept.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      id: 'user-hr-001',
      name: 'Marie Dupont',
      email: 'rh@chronodil.com',
      emailVerified: true,
      role: 'HR',
      departmentId: rhDept.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      id: 'user-emp-001',
      name: 'Jean Dubois',
      email: 'employe@chronodil.com',
      emailVerified: true,
      role: 'EMPLOYEE',
      departmentId: devDept.id,
      managerId: manager.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      id: 'user-emp-002',
      name: 'Claire Laurent',
      email: 'claire.laurent@chronodil.com',
      emailVerified: true,
      role: 'EMPLOYEE',
      departmentId: devDept.id,
      managerId: manager.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      id: 'user-emp-003',
      name: 'Pierre Durand',
      email: 'pierre.durand@chronodil.com',
      emailVerified: true,
      role: 'EMPLOYEE',
      departmentId: designDept.id,
      managerId: manager.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Utilisateurs créés');

  // NOTE: Les mots de passe doivent être créés via l'interface Better Auth
  // pour utiliser le bon format de hashing
  console.log('✅ Utilisateurs créés (utilisez l\'inscription pour créer les mots de passe)');

  // Créer les projets
  const project1 = await prisma.project.create({
    data: {
      id: 'proj-001',
      name: 'Application Mobile',
      code: 'APP-MOB',
      description: 'Développement de l\'application mobile iOS et Android',
      color: '#dd2d4a',
      departmentId: devDept.id,
      budgetHours: 500,
      hourlyRate: 75,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      id: 'proj-002',
      name: 'Site Web Corporate',
      code: 'WEB-CORP',
      description: 'Refonte du site web corporate de l\'entreprise',
      color: '#f26a8d',
      departmentId: devDept.id,
      budgetHours: 300,
      hourlyRate: 70,
      isActive: true,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-05-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const project3 = await prisma.project.create({
    data: {
      id: 'proj-003',
      name: 'API Backend',
      code: 'API-BACK',
      description: 'Développement de l\'API REST pour les services',
      color: '#f49cbb',
      departmentId: devDept.id,
      budgetHours: 400,
      hourlyRate: 80,
      isActive: true,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-07-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const project4 = await prisma.project.create({
    data: {
      id: 'proj-004',
      name: 'Refonte Intranet',
      code: 'INTRA-V2',
      description: 'Modernisation de l\'intranet d\'entreprise',
      color: '#cbeef3',
      departmentId: devDept.id,
      budgetHours: 600,
      hourlyRate: 65,
      isActive: true,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Projets créés');

  // Affecter des membres aux projets
  await prisma.projectMember.createMany({
    data: [
      { id: 'pm-001', projectId: project1.id, userId: employee1.id, role: 'developer', createdAt: new Date() },
      { id: 'pm-002', projectId: project1.id, userId: employee2.id, role: 'developer', createdAt: new Date() },
      { id: 'pm-003', projectId: project1.id, userId: manager.id, role: 'lead', createdAt: new Date() },
      { id: 'pm-004', projectId: project2.id, userId: employee2.id, role: 'developer', createdAt: new Date() },
      { id: 'pm-005', projectId: project2.id, userId: employee3.id, role: 'designer', createdAt: new Date() },
      { id: 'pm-006', projectId: project3.id, userId: employee1.id, role: 'developer', createdAt: new Date() },
      { id: 'pm-007', projectId: project3.id, userId: manager.id, role: 'architect', createdAt: new Date() },
      { id: 'pm-008', projectId: project4.id, userId: employee1.id, role: 'developer', createdAt: new Date() },
      { id: 'pm-009', projectId: project4.id, userId: employee2.id, role: 'developer', createdAt: new Date() },
      { id: 'pm-010', projectId: project4.id, userId: employee3.id, role: 'designer', createdAt: new Date() },
    ],
  });

  console.log('✅ Membres de projets affectés');

  // Créer des tâches
  const task1 = await prisma.task.create({
    data: {
      id: 'task-001',
      name: 'Développement frontend',
      description: 'Interface utilisateur et composants React',
      projectId: project1.id,
      estimatedHours: 120,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      id: 'task-002',
      name: 'Tests unitaires',
      description: 'Écriture des tests pour le frontend',
      projectId: project1.id,
      estimatedHours: 40,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      id: 'task-003',
      name: 'Code review',
      description: 'Revue de code des pull requests',
      projectId: project1.id,
      estimatedHours: 20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      id: 'task-004',
      name: 'Documentation',
      description: 'Documentation technique du projet',
      projectId: project2.id,
      estimatedHours: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Tâches créées');

  // Créer des entrées de temps (derniers 7 jours)
  const today = new Date();
  const timesheetEntries = [];
  let entryCounter = 1;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Entrées pour employee1
    timesheetEntries.push(
      {
        id: `ts-${String(entryCounter++).padStart(3, '0')}`,
        userId: employee1.id,
        projectId: project1.id,
        taskId: task1.id,
        date,
        duration: 6,
        type: 'NORMAL' as const,
        description: 'Développement des composants de la page de connexion',
        status: i < 2 ? 'DRAFT' as const : i < 4 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `ts-${String(entryCounter++).padStart(3, '0')}`,
        userId: employee1.id,
        projectId: project3.id,
        date,
        duration: 2,
        type: 'NORMAL' as const,
        description: 'Documentation API endpoints',
        status: i < 2 ? 'DRAFT' as const : i < 4 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Entrées pour employee2
    timesheetEntries.push(
      {
        id: `ts-${String(entryCounter++).padStart(3, '0')}`,
        userId: employee2.id,
        projectId: project1.id,
        taskId: task2.id,
        date,
        duration: 5,
        type: 'NORMAL' as const,
        description: 'Écriture des tests unitaires',
        status: i < 3 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `ts-${String(entryCounter++).padStart(3, '0')}`,
        userId: employee2.id,
        projectId: project2.id,
        date,
        duration: 3,
        type: 'NORMAL' as const,
        description: 'Intégration du design dans React',
        status: i < 3 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Entrées pour employee3
    timesheetEntries.push({
      id: `ts-${String(entryCounter++).padStart(3, '0')}`,
      userId: employee3.id,
      projectId: project2.id,
      date,
      duration: 7,
      type: 'NORMAL' as const,
      description: 'Design des mockups pour les nouvelles pages',
      status: i < 2 ? 'SUBMITTED' as const : 'APPROVED' as const,
      isLocked: i >= 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await prisma.timesheetEntry.createMany({
    data: timesheetEntries,
  });

  console.log('✅ Entrées de temps créées');

  // Créer des jours fériés
  await prisma.holiday.createMany({
    data: [
      {
        id: 'hol-001',
        name: 'Jour de l\'an',
        date: new Date('2025-01-01'),
        description: 'Nouvel An',
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'hol-002',
        name: 'Fête du Travail',
        date: new Date('2025-05-01'),
        description: 'Fête du Travail',
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'hol-003',
        name: 'Fête Nationale',
        date: new Date('2025-07-14'),
        description: 'Fête Nationale Française',
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'hol-004',
        name: 'Noël',
        date: new Date('2025-12-25'),
        description: 'Noël',
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  console.log('✅ Jours fériés créés');

  // Créer des paramètres de l\'entreprise
  await prisma.companySetting.createMany({
    data: [
      {
        id: 'setting-001',
        key: 'working_hours_per_day',
        value: '8',
        type: 'number',
        description: 'Nombre d\'heures de travail par jour',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'setting-002',
        key: 'working_days_per_week',
        value: '5',
        type: 'number',
        description: 'Nombre de jours de travail par semaine',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'setting-003',
        key: 'overtime_multiplier',
        value: '1.5',
        type: 'number',
        description: 'Multiplicateur pour les heures supplémentaires',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'setting-004',
        key: 'night_shift_multiplier',
        value: '1.25',
        type: 'number',
        description: 'Multiplicateur pour les heures de nuit',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'setting-005',
        key: 'weekend_multiplier',
        value: '2',
        type: 'number',
        description: 'Multiplicateur pour le travail le week-end',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'setting-006',
        key: 'company_name',
        value: 'Chronodil SAS',
        type: 'string',
        description: 'Nom de l\'entreprise',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  console.log('✅ Paramètres de l\'entreprise créés');

  // Créer quelques notifications
  await prisma.notification.createMany({
    data: [
      {
        id: 'notif-001',
        userId: employee1.id,
        title: 'Bienvenue sur Chronodil',
        message: 'Bienvenue ! N\'oubliez pas de saisir vos temps quotidiennement.',
        type: 'info',
        link: '/dashboard/timesheet',
        createdAt: new Date(),
      },
      {
        id: 'notif-002',
        userId: employee2.id,
        title: 'Temps approuvés',
        message: 'Vos temps de la semaine dernière ont été approuvés.',
        type: 'success',
        link: '/dashboard/timesheet',
        createdAt: new Date(),
      },
    ],
  });

  console.log('✅ Notifications créées');

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\n📋 Utilisateurs créés - Inscrivez-vous via /auth/register avec :');
  console.log('   Admin     : admin@chronodil.com');
  console.log('   Manager   : manager@chronodil.com');
  console.log('   RH        : rh@chronodil.com');
  console.log('   Employé 1 : employe@chronodil.com');
  console.log('   Employé 2 : claire.laurent@chronodil.com');
  console.log('   Employé 3 : pierre.durand@chronodil.com');
  console.log('\n⚠️  IMPORTANT: Allez sur http://localhost:3001/auth/register');
  console.log('   et créez les comptes avec les mots de passe souhaités.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
