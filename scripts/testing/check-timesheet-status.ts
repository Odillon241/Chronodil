import { prisma } from '../src/lib/db';

async function checkTimesheetStatus() {
  console.log('🔍 Vérification des feuilles de temps...\n');

  // Récupérer TOUTES les feuilles de temps
  const allTimesheets = await prisma.hRTimesheet.findMany({
    select: {
      id: true,
      status: true,
      employeeName: true,
      userId: true,
      weekStartDate: true,
      weekEndDate: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total de feuilles de temps : ${allTimesheets.length}\n`);

  if (allTimesheets.length === 0) {
    console.log('❌ Aucune feuille de temps trouvée dans la base de données\n');
    return;
  }

  // Afficher chaque feuille de temps
  allTimesheets.forEach((ts, index) => {
    console.log(`${index + 1}. ${ts.employeeName}`);
    console.log(`   ID: ${ts.id}`);
    console.log(`   Statut: ${ts.status}`);
    console.log(`   Semaine: ${ts.weekStartDate.toISOString().split('T')[0]} → ${ts.weekEndDate.toISOString().split('T')[0]}`);
    console.log(`   Créée le: ${ts.createdAt.toISOString()}\n`);
  });

  // Compter par statut
  const byStatus = allTimesheets.reduce((acc, ts) => {
    acc[ts.status] = (acc[ts.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📈 Répartition par statut:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  await prisma.$disconnect();
}

checkTimesheetStatus().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
