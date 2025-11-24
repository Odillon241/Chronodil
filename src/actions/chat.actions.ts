"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { authActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ========================================
// SCHÉMAS DE VALIDATION
// ========================================

const createConversationSchema = z.object({
  type: z.enum(["DIRECT", "GROUP", "PROJECT"]),
  name: z.string().optional(),
  projectId: z.string().optional(),
  memberIds: z.array(z.string()),
}).refine((data) => {
  // Pour les conversations directes et de groupe, memberIds doit contenir au moins 1 élément
  if (data.type === "DIRECT" || data.type === "GROUP") {
    return data.memberIds.length >= 1;
  }
  // Pour les conversations de projet, projectId est requis
  if (data.type === "PROJECT") {
    return !!data.projectId;
  }
  return true;
}, {
  message: "Les conversations directes et de groupe nécessitent au moins un membre, les conversations de projet nécessitent un projectId"
});

const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  attachments: z.any().optional(),
  replyToId: z.string().optional(),
});

const updateMessageSchema = z.object({
  messageId: z.string(),
  content: z.string().min(1),
});

const deleteMessageSchema = z.object({
  messageId: z.string(),
});

const toggleReactionSchema = z.object({
  messageId: z.string(),
  emoji: z.string(),
});

const markAsReadSchema = z.object({
  conversationId: z.string(),
});

const leaveConversationSchema = z.object({
  conversationId: z.string(),
});

const deleteConversationSchema = z.object({
  conversationId: z.string(),
});

const addMembersSchema = z.object({
  conversationId: z.string(),
  memberIds: z.array(z.string()).min(1),
});

const removeMemberSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
});

const pinMessageSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
});

const unpinMessageSchema = z.object({
  messageId: z.string(),
});

// ========================================
// ACTIONS POUR LES CONVERSATIONS
// ========================================

/**
 * Créer ou récupérer une conversation
 */
export const createOrGetConversation = authActionClient
  .schema(createConversationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { type, name, projectId, memberIds } = parsedInput;
    const userId = ctx.userId;

    // Pour les conversations directes, vérifier si elle existe déjà
    if (type === "DIRECT") {
      if (memberIds.length !== 1) {
        throw new Error("Une conversation directe nécessite exactement 1 autre utilisateur");
      }

      const otherUserId = memberIds[0];
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          ConversationMember: {
            every: {
              userId: { in: [userId, otherUserId] },
            },
          },
        },
        include: {
          ConversationMember: {
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
          Message: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return { conversation: existingConversation };
      }

      // Créer une nouvelle conversation directe
      const conversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          type: "DIRECT",
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          ConversationMember: {
            create: [
              { id: crypto.randomUUID(), userId },
              { id: crypto.randomUUID(), userId: otherUserId },
            ],
          },
        },
        include: {
          ConversationMember: {
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
          Message: true,
        },
      });

      revalidatePath("/dashboard/chat");
      return { conversation };
    }

    // Pour les conversations de groupe ou de projet
    let allMemberIds = [...new Set([userId, ...memberIds])];

    // Pour les conversations de projet, récupérer automatiquement tous les membres du projet
    if (type === "PROJECT" && projectId) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      });
      
      const projectMemberIds = projectMembers.map((pm) => pm.userId);
      allMemberIds = [...new Set([userId, ...projectMemberIds])];
    }

    const conversation = await prisma.conversation.create({
      data: {
        id: crypto.randomUUID(),
        type,
        name,
        projectId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ConversationMember: {
          create: allMemberIds.map((memberId) => ({
            id: crypto.randomUUID(),
            userId: memberId,
            isAdmin: memberId === userId,
          })),
        },
      },
      include: {
        ConversationMember: {
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
        Project: true,
        Message: true,
      },
    });

    revalidatePath("/dashboard/chat");
    return { conversation };
  });

/**
 * Récupérer toutes les conversations de l'utilisateur
 */
export const getUserConversations = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const userId = ctx.userId;

  const conversations = await prisma.conversation.findMany({
    where: {
      ConversationMember: {
        some: { userId },
      },
    },
    include: {
      ConversationMember: {
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
      Message: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          User: {
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
          Message: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Calculer les messages non lus pour chaque conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const member = conv.ConversationMember.find((m) => m.userId === userId);
      const unreadCount = member?.lastReadAt
        ? await prisma.message.count({
            where: {
              conversationId: conv.id,
              createdAt: { gt: member.lastReadAt },
              senderId: { not: userId },
            },
          })
        : conv._count.Message;

      return {
        ...conv,
        unreadCount,
      };
    })
  );

  return { conversations: conversationsWithUnread };
});

/**
 * Récupérer une conversation par ID
 */
export const getConversationById = authActionClient
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ConversationMember: {
          some: { userId },
        },
      },
      include: {
        ConversationMember: {
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
        Project: true,
        Message: {
          orderBy: { createdAt: "asc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                avatar: true,
                image: true,
              },
            },
            Message: {
              select: {
                id: true,
                content: true,
                senderId: true,
                User: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation introuvable");
    }

    return { conversation };
  });

// ========================================
// ACTIONS POUR LES MESSAGES
// ========================================

/**
 * Envoyer un message
 */
export const sendMessage = authActionClient
  .schema(sendMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, content, attachments, replyToId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre de la conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderId: userId,
        content,
        attachments,
        replyToId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
    });

    // Mettre à jour la date de dernière activité de la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Créer des notifications pour les autres membres
    const otherMembers = await prisma.conversationMember.findMany({
      where: {
        conversationId,
        userId: { not: userId },
        isMuted: false,
      },
      include: {
        User: true,
        Conversation: {
          include: {
            Project: true,
          },
        },
      },
    });

    // Créer les notifications
    await Promise.all(
      otherMembers.map(async (member) => {
        const conversation = member.Conversation;
        let conversationName = "Message direct";

        if (conversation.type === "PROJECT" && conversation.Project) {
          conversationName = conversation.Project.name;
        } else if (conversation.type === "GROUP" && conversation.name) {
          conversationName = conversation.name;
        } else if (conversation.type === "DIRECT") {
          const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });
          conversationName = sender?.name || "Message direct";
        }

        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: member.userId,
            title: `Nouveau message dans ${conversationName}`,
            message: content.substring(0, 100),
            type: "chat",
            link: `/dashboard/chat?conversation=${conversationId}`,
          },
        });
      })
    );

    revalidatePath("/dashboard/chat");
    return { message };
  });

/**
 * Modifier un message
 */
export const updateMessage = authActionClient
  .schema(updateMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, content } = parsedInput;
    const userId = ctx.userId;

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      throw new Error("Message introuvable");
    }

    if (existingMessage.senderId !== userId) {
      throw new Error("Vous ne pouvez modifier que vos propres messages");
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/chat");
    return { message };
  });

/**
 * Supprimer un message
 */
export const deleteMessage = authActionClient
  .schema(deleteMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput;
    const userId = ctx.userId;

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      throw new Error("Message introuvable");
    }

    if (existingMessage.senderId !== userId) {
      throw new Error("Vous ne pouvez supprimer que vos propres messages");
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: "Message supprimé",
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/chat");
    return { message };
  });

/**
 * Toggle une réaction emoji sur un message
 */
export const toggleReaction = authActionClient
  .schema(toggleReactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, emoji } = parsedInput;
    const userId = ctx.userId;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message introuvable");
    }

    // Les réactions sont stockées comme: { "👍": ["userId1", "userId2"], "❤️": ["userId3"] }
    const reactions = (message.reactions as Record<string, string[]>) || {};

    if (!reactions[emoji]) {
      // Nouvelle réaction
      reactions[emoji] = [userId];
    } else {
      // Toggle la réaction
      const index = reactions[emoji].indexOf(userId);
      if (index > -1) {
        // Retirer la réaction
        reactions[emoji].splice(index, 1);
        // Supprimer l'emoji s'il n'y a plus de réactions
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        // Ajouter la réaction
        reactions[emoji].push(userId);
      }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        reactions: Object.keys(reactions).length > 0 ? reactions : Prisma.JsonNull,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true, reactions };
  });

/**
 * Marquer les messages comme lus
 */
export const markAsRead = authActionClient
  .schema(markAsReadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    await prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

// ========================================
// ACTIONS POUR LA GESTION DES MEMBRES
// ========================================

/**
 * Ajouter des membres à une conversation
 */
export const addMembersToConversation = authActionClient
  .schema(addMembersSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, memberIds } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est admin de la conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        isAdmin: true,
      },
    });

    if (!membership) {
      throw new Error("Seuls les administrateurs peuvent ajouter des membres");
    }

    // Ajouter les nouveaux membres
    await Promise.all(
      memberIds.map(async (memberId) => {
        const exists = await prisma.conversationMember.findFirst({
          where: { conversationId, userId: memberId },
        });

        if (!exists) {
          await prisma.conversationMember.create({
            data: {
              id: crypto.randomUUID(),
              conversationId,
              userId: memberId,
            },
          });
        }
      })
    );

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Retirer un membre d'une conversation
 */
export const removeMemberFromConversation = authActionClient
  .schema(removeMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, userId: memberToRemove } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est admin de la conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        isAdmin: true,
      },
    });

    if (!membership && memberToRemove !== userId) {
      throw new Error("Seuls les administrateurs peuvent retirer des membres");
    }

    await prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId: memberToRemove,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Quitter une conversation
 */
export const leaveConversation = authActionClient
  .schema(leaveConversationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (conversation?.type === "DIRECT") {
      throw new Error("Vous ne pouvez pas quitter une conversation directe");
    }

    await prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Supprimer une conversation
 */
export const deleteConversation = authActionClient
  .schema(deleteConversationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre de la conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Récupérer la conversation pour vérifier les permissions
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ConversationMember: {
          where: { userId },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation introuvable");
    }

    // Pour les conversations directes, seul le créateur peut supprimer
    if (conversation.type === "DIRECT") {
      if (conversation.createdBy !== userId) {
        throw new Error("Seul le créateur peut supprimer une conversation directe");
      }
    }

    // Pour les groupes et projets, seuls les admins peuvent supprimer
    if (conversation.type === "GROUP" || conversation.type === "PROJECT") {
      const userMembership = conversation.ConversationMember[0];
      if (!userMembership?.isAdmin) {
        throw new Error("Seuls les administrateurs peuvent supprimer cette conversation");
      }
    }

    // Supprimer la conversation (cascade supprimera automatiquement les membres et messages)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

// ========================================
// ACTIONS POUR LES MESSAGES ÉPINGLÉS
// ========================================

/**
 * Épingler un message dans une conversation
 * Limite : 3 messages épinglés maximum par conversation
 */
export const pinMessage = authActionClient
  .schema(pinMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, conversationId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre de la conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Vérifier que l'utilisateur est admin (pour les groupes/projets) ou créateur (pour les directs)
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ConversationMember: {
          where: { userId },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation introuvable");
    }

    // Vérifier les permissions
    const isAdmin = conversation.ConversationMember[0]?.isAdmin;
    const isCreator = conversation.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Seuls les administrateurs ou le créateur peuvent épingler des messages");
    }

    // Vérifier le nombre de messages épinglés
    const pinnedMessagesCount = await prisma.message.count({
      where: {
        conversationId,
        pinnedAt: { not: null },
      },
    });

    if (pinnedMessagesCount >= 3) {
      throw new Error("Maximum 3 messages épinglés par conversation. Désépinglez un message pour en épingler un nouveau.");
    }

    // Épingler le message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        pinnedAt: new Date(),
        pinnedById: userId,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Désépingler un message
 */
export const unpinMessage = authActionClient
  .schema(unpinMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput;
    const userId = ctx.userId;

    // Récupérer le message pour avoir la conversationId
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        Conversation: {
          include: {
            ConversationMember: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message) {
      throw new Error("Message introuvable");
    }

    // Vérifier que l'utilisateur est membre de la conversation
    if (message.Conversation.ConversationMember.length === 0) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Vérifier les permissions
    const isAdmin = message.Conversation.ConversationMember[0]?.isAdmin;
    const isCreator = message.Conversation.createdBy === userId;
    const isPinner = message.pinnedById === userId;

    if (!isAdmin && !isCreator && !isPinner) {
      throw new Error("Seuls les administrateurs, le créateur ou celui qui a épinglé peuvent désépingler ce message");
    }

    // Désépingler le message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        pinnedAt: null,
        pinnedById: null,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Récupérer tous les messages épinglés d'une conversation
 * Utilise l'index Message_conversationId_pinnedAt_idx pour des performances optimales
 */
export const getPinnedMessages = authActionClient
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre de la conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Récupérer les messages épinglés triés par date d'épinglage (les plus récents en premier)
    // Cette requête utilise l'index composite Message_conversationId_pinnedAt_idx
    const pinnedMessages = await prisma.message.findMany({
      where: {
        conversationId,
        pinnedAt: { not: null },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
        Message: {
          select: {
            id: true,
            content: true,
            senderId: true,
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        pinnedAt: "desc",
      },
    });

    return { pinnedMessages };
  });

/**
 * Récupérer toutes les réponses à un message
 * Utilise l'index Message_replyToId_idx pour des performances optimales
 */
export const getMessageReplies = authActionClient
  .schema(z.object({ messageId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput;
    const userId = ctx.userId;

    // Récupérer le message parent pour vérifier l'accès
    const parentMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        Conversation: {
          include: {
            ConversationMember: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!parentMessage) {
      throw new Error("Message introuvable");
    }

    // Vérifier que l'utilisateur est membre de la conversation
    if (parentMessage.Conversation.ConversationMember.length === 0) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Récupérer toutes les réponses au message
    // Cette requête utilise l'index Message_replyToId_idx
    const replies = await prisma.message.findMany({
      where: {
        replyToId: messageId,
        isDeleted: false,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { replies, totalReplies: replies.length };
  });

