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
      name: 'Développement',
      code: 'DEV',
      description: 'Équipe de développement logiciel',
    },
  });

  const designDept = await prisma.department.create({
    data: {
      name: 'Design',
      code: 'DES',
      description: 'Équipe de design et UX',
    },
  });

  const rhDept = await prisma.department.create({
    data: {
      name: 'Ressources Humaines',
      code: 'RH',
      description: 'Département des ressources humaines',
    },
  });

  console.log('✅ Départements créés');

  // Créer les utilisateurs
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Système',
      email: 'admin@chronodil.com',
      emailVerified: true,
      role: 'ADMIN',
      departmentId: devDept.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sophie Martin',
      email: 'manager@chronodil.com',
      emailVerified: true,
      role: 'MANAGER',
      departmentId: devDept.id,
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      name: 'Marie Dupont',
      email: 'rh@chronodil.com',
      emailVerified: true,
      role: 'HR',
      departmentId: rhDept.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      name: 'Jean Dubois',
      email: 'employe@chronodil.com',
      emailVerified: true,
      role: 'EMPLOYEE',
      departmentId: devDept.id,
      managerId: manager.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Claire Laurent',
      email: 'claire.laurent@chronodil.com',
      emailVerified: true,
      role: 'EMPLOYEE',
      departmentId: devDept.id,
      managerId: manager.id,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: 'Pierre Durand',
      email: 'pierre.durand@chronodil.com',
      emailVerified: true,
      role: 'EMPLOYEE',
      departmentId: designDept.id,
      managerId: manager.id,
    },
  });

  console.log('✅ Utilisateurs créés');

  // Créer les projets
  const project1 = await prisma.project.create({
    data: {
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
    },
  });

  const project2 = await prisma.project.create({
    data: {
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
    },
  });

  const project3 = await prisma.project.create({
    data: {
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
    },
  });

  const project4 = await prisma.project.create({
    data: {
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
    },
  });

  console.log('✅ Projets créés');

  // Affecter des membres aux projets
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: employee1.id, role: 'developer' },
      { projectId: project1.id, userId: employee2.id, role: 'developer' },
      { projectId: project1.id, userId: manager.id, role: 'lead' },
      { projectId: project2.id, userId: employee2.id, role: 'developer' },
      { projectId: project2.id, userId: employee3.id, role: 'designer' },
      { projectId: project3.id, userId: employee1.id, role: 'developer' },
      { projectId: project3.id, userId: manager.id, role: 'architect' },
      { projectId: project4.id, userId: employee1.id, role: 'developer' },
      { projectId: project4.id, userId: employee2.id, role: 'developer' },
      { projectId: project4.id, userId: employee3.id, role: 'designer' },
    ],
  });

  console.log('✅ Membres de projets affectés');

  // Créer des tâches
  const task1 = await prisma.task.create({
    data: {
      name: 'Développement frontend',
      description: 'Interface utilisateur et composants React',
      projectId: project1.id,
      estimatedHours: 120,
      isActive: true,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      name: 'Tests unitaires',
      description: 'Écriture des tests pour le frontend',
      projectId: project1.id,
      estimatedHours: 40,
      isActive: true,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      name: 'Code review',
      description: 'Revue de code des pull requests',
      projectId: project1.id,
      estimatedHours: 20,
      isActive: true,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      name: 'Documentation',
      description: 'Documentation technique du projet',
      projectId: project2.id,
      estimatedHours: 30,
      isActive: true,
    },
  });

  console.log('✅ Tâches créées');

  // Créer des entrées de temps (derniers 7 jours)
  const today = new Date();
  const timesheetEntries = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Entrées pour employee1
    timesheetEntries.push(
      {
        userId: employee1.id,
        projectId: project1.id,
        taskId: task1.id,
        date,
        duration: 6,
        type: 'NORMAL' as const,
        description: 'Développement des composants de la page de connexion',
        status: i < 2 ? 'DRAFT' as const : i < 4 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 4,
      },
      {
        userId: employee1.id,
        projectId: project3.id,
        date,
        duration: 2,
        type: 'NORMAL' as const,
        description: 'Documentation API endpoints',
        status: i < 2 ? 'DRAFT' as const : i < 4 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 4,
      }
    );

    // Entrées pour employee2
    timesheetEntries.push(
      {
        userId: employee2.id,
        projectId: project1.id,
        taskId: task2.id,
        date,
        duration: 5,
        type: 'NORMAL' as const,
        description: 'Écriture des tests unitaires',
        status: i < 3 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 3,
      },
      {
        userId: employee2.id,
        projectId: project2.id,
        date,
        duration: 3,
        type: 'NORMAL' as const,
        description: 'Intégration du design dans React',
        status: i < 3 ? 'SUBMITTED' as const : 'APPROVED' as const,
        isLocked: i >= 3,
      }
    );

    // Entrées pour employee3
    timesheetEntries.push({
      userId: employee3.id,
      projectId: project2.id,
      date,
      duration: 7,
      type: 'NORMAL' as const,
      description: 'Design des mockups pour les nouvelles pages',
      status: i < 2 ? 'SUBMITTED' as const : 'APPROVED' as const,
      isLocked: i >= 2,
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
        name: 'Jour de l\'an',
        date: new Date('2025-01-01'),
        description: 'Nouvel An',
        isRecurring: true,
      },
      {
        name: 'Fête du Travail',
        date: new Date('2025-05-01'),
        description: 'Fête du Travail',
        isRecurring: true,
      },
      {
        name: 'Fête Nationale',
        date: new Date('2025-07-14'),
        description: 'Fête Nationale Française',
        isRecurring: true,
      },
      {
        name: 'Noël',
        date: new Date('2025-12-25'),
        description: 'Noël',
        isRecurring: true,
      },
    ],
  });

  console.log('✅ Jours fériés créés');

  // Créer des paramètres de l\'entreprise
  await prisma.companySetting.createMany({
    data: [
      {
        key: 'working_hours_per_day',
        value: '8',
        type: 'number',
        description: 'Nombre d\'heures de travail par jour',
      },
      {
        key: 'working_days_per_week',
        value: '5',
        type: 'number',
        description: 'Nombre de jours de travail par semaine',
      },
      {
        key: 'overtime_multiplier',
        value: '1.5',
        type: 'number',
        description: 'Multiplicateur pour les heures supplémentaires',
      },
      {
        key: 'night_shift_multiplier',
        value: '1.25',
        type: 'number',
        description: 'Multiplicateur pour les heures de nuit',
      },
      {
        key: 'weekend_multiplier',
        value: '2',
        type: 'number',
        description: 'Multiplicateur pour le travail le week-end',
      },
      {
        key: 'company_name',
        value: 'Chronodil SAS',
        type: 'string',
        description: 'Nom de l\'entreprise',
      },
    ],
  });

  console.log('✅ Paramètres de l\'entreprise créés');

  // Créer quelques notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: employee1.id,
        title: 'Bienvenue sur Chronodil',
        message: 'Bienvenue ! N\'oubliez pas de saisir vos temps quotidiennement.',
        type: 'info',
        link: '/dashboard/timesheet',
      },
      {
        userId: employee2.id,
        title: 'Temps approuvés',
        message: 'Vos temps de la semaine dernière ont été approuvés.',
        type: 'success',
        link: '/dashboard/timesheet',
      },
    ],
  });

  console.log('✅ Notifications créées');

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\n📋 Comptes créés :');
  console.log('   Admin     : admin@chronodil.com / password');
  console.log('   Manager   : manager@chronodil.com / password');
  console.log('   RH        : rh@chronodil.com / password');
  console.log('   Employé 1 : employe@chronodil.com / password');
  console.log('   Employé 2 : claire.laurent@chronodil.com / password');
  console.log('   Employé 3 : pierre.durand@chronodil.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
