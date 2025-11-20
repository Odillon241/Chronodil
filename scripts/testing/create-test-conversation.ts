import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function createTestConversation() {
  try {
    console.log('🧪 Création de la conversation de test...');

    // Vérifier si la conversation existe déjà
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: 'test-conversation-123' },
    });

    if (existingConversation) {
      console.log('✅ La conversation de test existe déjà');

      // Afficher les membres
      const members = await prisma.conversationMember.findMany({
        where: { conversationId: 'test-conversation-123' },
        include: { User: { select: { name: true, email: true } } },
      });

      console.log(`📋 Membres (${members.length}):`);
      members.forEach((member) => {
        console.log(`  - ${member.User.name} (${member.User.email})`);
      });

      return;
    }

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      take: 5, // Prendre jusqu'à 5 utilisateurs pour la conversation de test
    });

    if (users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé dans la base de données');
      console.log('💡 Créez d\'abord un utilisateur en vous inscrivant sur l\'application');
      return;
    }

    console.log(`📋 ${users.length} utilisateur(s) trouvé(s)`);

    // Créer la conversation
    await prisma.conversation.create({
      data: {
        id: 'test-conversation-123',
        type: 'GROUP',
        name: '🧪 Conversation de Test Socket.IO',
        createdBy: users[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Conversation créée');

    // Ajouter tous les utilisateurs comme membres
    const memberPromises = users.map((user) =>
      prisma.conversationMember.create({
        data: {
          id: nanoid(),
          conversationId: 'test-conversation-123',
          userId: user.id,
          joinedAt: new Date(),
          isAdmin: user.id === users[0].id, // Premier utilisateur est admin
        },
      })
    );

    await Promise.all(memberPromises);

    console.log(`✅ ${users.length} membre(s) ajouté(s)`);
    console.log('\n🎉 Configuration terminée !');
    console.log('\n📍 Accédez à la page de test:');
    console.log('   http://localhost:3000/dashboard/test/socketio');
    console.log('\n👥 Membres ajoutés:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})${index === 0 ? ' [Admin]' : ''}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestConversation();
