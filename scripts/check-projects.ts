import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    console.log('🔍 Vérification des projets en base...\n');

    const projects = await prisma.project.findMany({
      include: {
        Department: true,
        ProjectMember: true,
      },
    });

    console.log(`✅ Nombre de projets trouvés: ${projects.length}\n`);

    if (projects.length === 0) {
      console.log('❌ Aucun projet en base de données!');
    } else {
      projects.forEach((project, index) => {
        console.log(`\n📦 Projet ${index + 1}:`);
        console.log(`  - ID: ${project.id}`);
        console.log(`  - Nom: ${project.name}`);
        console.log(`  - Code: ${project.code}`);
        console.log(`  - isActive: ${project.isActive}`);
        console.log(`  - Département: ${project.Department?.name || 'Aucun'}`);
        console.log(`  - Membres: ${project.ProjectMember?.length || 0}`);
        console.log(`  - Créé le: ${project.createdAt}`);
      });
    }
  } catch (error) {
    console.error('🚨 Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
