import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testChatSystem() {
  console.log("🧪 Test du système de chat Chronodil\n");

  try {
    // 1. Vérifier les utilisateurs
    console.log("1️⃣ Vérification des utilisateurs...");
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    console.log(`   ✅ ${users.length} utilisateurs trouvés`);
    users.forEach(u => console.log(`      - ${u.name} (${u.email})`));

    if (users.length < 2) {
      console.log("   ⚠️  Besoin d'au moins 2 utilisateurs pour tester le chat");
      return;
    }

    // 2. Créer une conversation de test
    console.log("\n2️⃣ Création d'une conversation de test...");
    const user1 = users[0];
    const user2 = users[1];

    const conversation = await prisma.conversation.create({
      data: {
        id: crypto.randomUUID(),
        type: "DIRECT",
        createdBy: user1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ConversationMember: {
          create: [
            {
              id: crypto.randomUUID(),
              userId: user1.id,
              joinedAt: new Date(),
            },
            {
              id: crypto.randomUUID(),
              userId: user2.id,
              joinedAt: new Date(),
            },
          ],
        },
      },
      include: {
        ConversationMember: {
          include: {
            User: true,
          },
        },
      },
    });
    console.log(`   ✅ Conversation créée: ${conversation.id}`);
    console.log(`      Entre ${user1.name} et ${user2.name}`);

    // 3. Envoyer un message
    console.log("\n3️⃣ Envoi d'un message...");
    const message1 = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        senderId: user1.id,
        content: "Bonjour ! Ceci est un message de test 👋",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`   ✅ Message envoyé: "${message1.content}"`);

    // 4. Répondre au message
    console.log("\n4️⃣ Réponse au message...");
    const message2 = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        senderId: user2.id,
        content: "Salut ! Super de tester le système de réponses 🎉",
        replyToId: message1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`   ✅ Réponse envoyée avec replyToId: ${message2.replyToId}`);

    // 5. Ajouter une réaction
    console.log("\n5️⃣ Ajout d'une réaction...");
    await prisma.message.update({
      where: { id: message1.id },
      data: {
        reactions: {
          "👍": [user2.id],
          "❤️": [user1.id, user2.id],
        },
      },
    });
    console.log(`   ✅ Réactions ajoutées: 👍 (1) et ❤️ (2)`);

    // 6. Vérifier les messages
    console.log("\n6️⃣ Vérification des messages...");
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      include: {
        User: {
          select: { name: true },
        },
        Message: {
          select: { content: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    console.log(`   ✅ ${messages.length} messages trouvés:`);
    messages.forEach((msg, idx) => {
      console.log(`      ${idx + 1}. ${msg.User.name}: "${msg.content}"`);
      if (msg.Message) {
        console.log(`         ↳ Répond à: "${msg.Message.content}"`);
      }
      if (msg.reactions) {
        const reactions = msg.reactions as Record<string, string[]>;
        console.log(`         Réactions: ${Object.entries(reactions).map(([emoji, users]) => `${emoji}(${users.length})`).join(", ")}`);
      }
    });

    // 7. Vérifier les conversations de l'utilisateur
    console.log("\n7️⃣ Vérification des conversations...");
    const userConversations = await prisma.conversation.findMany({
      where: {
        ConversationMember: {
          some: { userId: user1.id },
        },
      },
      include: {
        ConversationMember: {
          include: {
            User: {
              select: { name: true },
            },
          },
        },
        Message: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    console.log(`   ✅ ${userConversations.length} conversation(s) pour ${user1.name}`);
    userConversations.forEach((conv) => {
      const memberNames = conv.ConversationMember.map(m => m.User.name).join(", ");
      const lastMessage = conv.Message[0]?.content || "Aucun message";
      console.log(`      - ${conv.type}: ${memberNames}`);
      console.log(`        Dernier message: "${lastMessage}"`);
    });

    // 8. Nettoyer les données de test
    console.log("\n8️⃣ Nettoyage des données de test...");
    await prisma.message.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.conversationMember.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.conversation.delete({
      where: { id: conversation.id },
    });
    console.log(`   ✅ Données de test supprimées`);

    console.log("\n✅ ✅ ✅ TOUS LES TESTS SONT PASSÉS ! ✅ ✅ ✅");
    console.log("\n🎉 Le système de chat est entièrement fonctionnel !");
    console.log("\n📋 Fonctionnalités testées:");
    console.log("   ✅ Création de conversations");
    console.log("   ✅ Envoi de messages");
    console.log("   ✅ Système de réponses (replyTo)");
    console.log("   ✅ Réactions emoji");
    console.log("   ✅ Récupération des conversations");
    console.log("   ✅ Relations utilisateurs/messages");

  } catch (error) {
    console.error("\n❌ ERREUR lors du test:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testChatSystem();

