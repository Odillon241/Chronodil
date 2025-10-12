import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testProjects = [
  {
    name: 'Projet Alpha',
    code: 'ALPHA',
    description: 'Projet de développement Alpha',
    color: '#3b82f6',
  },
  {
    name: 'Projet Beta',
    code: 'BETA',
    description: 'Projet de développement Beta',
    color: '#10b981',
  },
  {
    name: 'Projet Gamma',
    code: 'GAMMA',
    description: 'Projet de développement Gamma',
    color: '#f59e0b',
  },
];

async function main() {
  console.log('📁 Création des projets de test...\n');

  // Récupérer l'admin pour être le créateur
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@chronodil.com' },
    select: { id: true, name: true },
  });

  if (!admin) {
    console.error('❌ Admin non trouvé. Veuillez d\'abord créer l\'utilisateur admin.');
    return;
  }

  for (const projectData of testProjects) {
    try {
      // Vérifier si le projet existe
      const existingProject = await prisma.project.findUnique({
        where: { code: projectData.code },
      });

      if (existingProject) {
        console.log(`⚠️  ${projectData.name} existe déjà`);
        continue;
      }

      // Créer le projet
      const project = await prisma.project.create({
        data: {
          id: crypto.randomUUID(),
          name: projectData.name,
          code: projectData.code,
          description: projectData.description,
          color: projectData.color,
          createdBy: admin.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      });

      console.log(`✅ ${project.name} créé avec succès`);
      console.log(`   Code: ${project.code}`);
      console.log(`   Couleur: ${project.color}\n`);
    } catch (error: any) {
      console.error(`❌ Erreur lors de la création de ${projectData.name}:`, error.message);
    }
  }

  console.log('✅ Tous les projets de test ont été créés!');
  console.log('\n📋 Projets disponibles pour les chats:');
  console.log('   1. Projet Alpha (ALPHA) - Bleu');
  console.log('   2. Projet Beta (BETA) - Vert');
  console.log('   3. Projet Gamma (GAMMA) - Orange');
  console.log('\n🎉 Vous pouvez maintenant créer des chats de projet!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
