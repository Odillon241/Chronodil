import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Test des actions de chat...\n');

  try {
    // Simuler une session admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@chronodil.com' },
    });

    if (!adminUser) {
      console.error('❌ Admin non trouvé');
      return;
    }

    console.log(`✅ Utilisateur connecté: ${adminUser.name} (${adminUser.role})\n`);

    // Test de la récupération des utilisateurs pour le chat
    console.log('📋 Test getAllUsersForChat...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        image: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`✅ ${users.length} utilisateurs récupérés pour le chat:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n📁 Test de récupération des projets...');
    
    const projects = await prisma.project.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`✅ ${projects.length} projets récupérés:`);
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.code}) - ${project.color}`);
    });

    console.log('\n💬 Test de récupération des conversations...');
    
    const conversations = await prisma.conversation.findMany({
      where: {
        Members: {
          some: { userId: adminUser.id },
        },
      },
      include: {
        Members: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                image: true,
                role: true,
              },
            },
          },
        },
        Project: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        Messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            Sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            Messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`✅ ${conversations.length} conversations récupérées pour l'admin:`);
    conversations.forEach((conv, index) => {
      const otherUsers = conv.Members.filter(m => m.User.id !== adminUser.id);
      const otherUserNames = otherUsers.map(m => m.User.name).join(', ');
      console.log(`   ${index + 1}. ${conv.type} - ${conv.name || otherUserNames || 'Conversation'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
