"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "../generated/prisma/client";
import { authActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
// TODO: Implémenter l'audit de chat (module chat-audit manquant)
// import { createChatAuditLog } from "@/lib/audit/chat-audit";

// ========================================
// SCHÉMAS DE VALIDATION
// ========================================

const createConversationSchema = z.object({
  type: z.enum(["DIRECT", "GROUP", "PROJECT", "CHANNEL"]),
  name: z.string().optional(),
  projectId: z.string().optional(),
  memberIds: z.array(z.string()),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
  category: z.string().optional(),
  purpose: z.string().optional(),
}).refine((data) => {
  // Pour les conversations directes et de groupe, memberIds doit contenir au moins 1 élément
  if (data.type === "DIRECT" || data.type === "GROUP") {
    return data.memberIds.length >= 1;
  }
  // Pour les conversations de projet, projectId est requis
  if (data.type === "PROJECT") {
    return !!data.projectId;
  }
  // Pour les canaux, name est requis
  if (data.type === "CHANNEL") {
    return !!data.name && data.name.length > 0;
  }
  return true;
}, {
  message: "Les conversations directes et de groupe nécessitent au moins un membre, les conversations de projet nécessitent un projectId, les canaux nécessitent un nom"
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

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  category: z.string().max(50).optional(),
  purpose: z.string().max(500).optional(),
  memberIds: z.array(z.string()).optional(),
});

const updateChannelSchema = z.object({
  conversationId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  topic: z.string().max(250).optional(),
  purpose: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
});

const joinChannelSchema = z.object({
  conversationId: z.string(),
});

const updateChannelPermissionSchema = z.object({
  conversationId: z.string(),
  userId: z.string().optional(), // null = permission par défaut
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]).optional(),
  canPost: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canAddMembers: z.boolean().optional(),
  canRemoveMembers: z.boolean().optional(),
  canPinMessages: z.boolean().optional(),
  canMentionAll: z.boolean().optional(),
});

const sendMessageWithThreadSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  attachments: z.any().optional(),
  replyToId: z.string().optional(),
  threadId: z.string().optional(), // Répondre dans un thread existant
});

const scheduleMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  attachments: z.any().optional(),
  scheduledFor: z.coerce.date(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});

const createReminderSchema = z.object({
  messageId: z.string(),
  remindAt: z.coerce.date(),
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
 * Récupérer toutes les conversations de l'utilisateur avec pagination
 */
export const getUserConversations = authActionClient
  .schema(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId;
    const { page, limit } = parsedInput;
    const skip = (page - 1) * limit;

    // ⚡ PAGINATION: Récupérer les conversations avec limite
    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
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
        skip,
        take: limit,
      }),
      prisma.conversation.count({
        where: {
          ConversationMember: {
            some: { userId },
          },
        },
      }),
    ]);

    // ⚡ FIX N+1: Calculer tous les unreadCount en 1 seule requête groupée
    const conversationIds = conversations.map((c) => c.id);

    // Récupérer tous les membres avec lastReadAt pour cet utilisateur
    const userMembers = await prisma.conversationMember.findMany({
      where: {
        userId,
        conversationId: { in: conversationIds },
      },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    // Créer une map pour accès rapide
    const memberMap = new Map(
      userMembers.map((m) => [m.conversationId, m.lastReadAt])
    );

    // Batch query: Compter tous les messages non lus en 1 seule requête
    const unreadCountsRaw = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        OR: userMembers
          .filter((m) => m.lastReadAt)
          .map((m) => ({
            conversationId: m.conversationId,
            createdAt: { gt: m.lastReadAt! },
          })),
      },
      _count: {
        id: true,
      },
    });

    // Mapper les résultats pour accès rapide
    const unreadCountMap = new Map(
      unreadCountsRaw.map((u) => [u.conversationId, u._count.id])
    );

    // ⚡ OPTIMISÉ: Mapper les conversations avec leur unreadCount (pas de requête supplémentaire)
    const conversationsWithUnread = conversations.map((conv) => {
      const lastReadAt = memberMap.get(conv.id);
      const unreadCount = lastReadAt
        ? unreadCountMap.get(conv.id) || 0
        : conv._count.Message;

      return {
        ...conv,
        unreadCount,
      };
    });

    return {
      conversations: conversationsWithUnread,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    };
  });

/**
 * Récupérer une conversation par ID avec pagination des messages
 */
export const getConversationById = authActionClient
  .schema(
    z.object({
      conversationId: z.string(),
      messagesLimit: z.number().min(1).max(100).default(50),
      messagesCursor: z.string().optional(), // Pour infinite scroll
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, messagesLimit, messagesCursor } = parsedInput;
    const userId = ctx.userId;

    // ⚡ OPTIMISÉ: Récupérer la conversation sans les messages (séparé pour pagination)
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ConversationMember: {
          some: { userId },
        },
      },
      include: {
        User: {
          // Créateur du canal
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
          },
        },
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
        _count: {
          select: {
            Message: true,
            ConversationMember: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation introuvable");
    }

    // ⚡ PAGINATION: Charger uniquement les N derniers messages (cursor-based)
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: "desc" }, // Derniers messages d'abord
      take: messagesLimit + 1, // +1 pour détecter hasMore
      ...(messagesCursor && {
        cursor: { id: messagesCursor },
        skip: 1, // Skip le cursor lui-même
      }),
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
          // Message parent (si reply)
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
    });

    // Détecter si plus de messages disponibles
    const hasMoreMessages = messages.length > messagesLimit;
    const paginatedMessages = hasMoreMessages
      ? messages.slice(0, messagesLimit)
      : messages;

    // Inverser l'ordre pour affichage chronologique (plus ancien → plus récent)
    const messagesAsc = paginatedMessages.reverse();

    return {
      conversation: {
        ...conversation,
        Message: messagesAsc,
      },
      pagination: {
        hasMore: hasMoreMessages,
        nextCursor: hasMoreMessages
          ? messages[messagesLimit - 1].id
          : undefined,
      },
    };
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

    // Broadcast realtime (faible latence) pour informer immédiatement les clients
    // On n'attend pas le résultat pour ne pas bloquer la réponse.
    createSupabaseServerClient()
      .then((supabase) =>
        supabase
          .channel("chat-realtime")
          .send({
            type: "broadcast",
            event: "message:new",
            payload: {
              conversationId,
              messageId: message.id,
              senderId: userId,
              createdAt: message.createdAt,
            },
            // ack true pour garantir l'envoi côté serveur
            opts: { ack: true },
          })
          .catch((err) => console.warn("[Chat] Broadcast realtime échoué", err))
      )
      .catch((err) => console.warn("[Chat] Init supabase broadcast échouée", err));

    // Log d'audit
    // TODO: Implémenter l'audit de chat (module chat-audit manquant)
    // await createChatAuditLog({
    //   userId,
    //   action: "CREATE_MESSAGE",
    //   entityType: "MESSAGE",
    //   entityId: message.id,
    //   conversationId,
    // });

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
    const createdNotifications = await Promise.all(
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

        return await prisma.notification.create({
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

    // Envoyer les push notifications (fire and forget)
    if (createdNotifications.length > 0) {
      import('@/lib/notification-helpers').then(({ sendPushNotificationsForNotifications }) => {
        sendPushNotificationsForNotifications(
          createdNotifications.map((n) => ({
            userId: n.userId,
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
          }))
        ).catch(console.error);
      }).catch(console.error);
    }

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

    // Log d'audit
    // TODO: Implémenter l'audit de chat (module chat-audit manquant)
    // await createChatAuditLog({
    //   userId,
    //   action: "DELETE_MESSAGE",
    //   entityType: "MESSAGE",
    //   entityId: message.id,
    //   conversationId: existingMessage.conversationId,
    // });

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

const toggleMuteSchema = z.object({
  conversationId: z.string(),
});

/**
 * Activer/Désactiver les notifications pour une conversation
 */
export const toggleMuteConversation = authActionClient
  .schema(toggleMuteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    await prisma.conversationMember.update({
      where: {
        id: membership.id,
      },
      data: {
        isMuted: !membership.isMuted,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true, isMuted: !membership.isMuted };
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

// ========================================
// RECHERCHE GLOBALE DE MESSAGES
// ========================================

const searchMessagesSchema = z.object({
  query: z.string().min(1).max(200),
  conversationId: z.string().optional(), // Si fourni, recherche uniquement dans cette conversation
  limit: z.number().min(1).max(100).optional().default(50),
});

/**
 * Rechercher des messages dans toutes les conversations de l'utilisateur
 */
export const searchMessages = authActionClient
  .schema(searchMessagesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { query, conversationId, limit } = parsedInput;
    const userId = ctx.userId;

    // Récupérer les IDs des conversations dont l'utilisateur est membre
    const userConversations = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = conversationId
      ? [conversationId]
      : userConversations.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return { messages: [], total: 0 };
    }

    // Rechercher les messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        isDeleted: false,
        content: {
          contains: query,
          mode: "insensitive",
        },
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
        Conversation: {
          select: {
            id: true,
            type: true,
            name: true,
            Project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            ConversationMember: {
              include: {
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
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Compter le total
    const total = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        isDeleted: false,
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
    });

    return { messages, total };
  });

// ========================================
// ACCUSÉS DE LECTURE PAR MESSAGE
// ========================================

const markMessageAsReadSchema = z.object({
  messageId: z.string(),
});

/**
 * Marquer un message spécifique comme lu
 * Crée ou met à jour un enregistrement MessageRead
 */
export const markMessageAsRead = authActionClient
  .schema(markMessageAsReadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que le message existe et que l'utilisateur est membre de la conversation
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

    if (message.Conversation.ConversationMember.length === 0) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Ne pas créer d'accusé de lecture pour ses propres messages
    if (message.senderId === userId) {
      return { success: true, isOwnMessage: true };
    }

    // Créer ou mettre à jour l'accusé de lecture
    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });

    return { success: true };
  });

const getMessageReadReceiptsSchema = z.object({
  messageId: z.string(),
});

/**
 * Récupérer les accusés de lecture d'un message
 */
export const getMessageReadReceipts = authActionClient
  .schema(getMessageReadReceiptsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur a accès au message
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

    if (message.Conversation.ConversationMember.length === 0) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Récupérer les accusés de lecture
    const readReceipts = await prisma.messageRead.findMany({
      where: { messageId },
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
        readAt: "asc",
      },
    });

    return { readReceipts };
  });

// ========================================
// ARCHIVAGE DES CONVERSATIONS
// ========================================

const archiveConversationSchema = z.object({
  conversationId: z.string(),
});

/**
 * Archiver une conversation pour l'utilisateur
 */
export const archiveConversation = authActionClient
  .schema(archiveConversationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Archiver (mettre à jour isArchived sur le membership)
    await prisma.conversationMember.update({
      where: {
        id: membership.id,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Désarchiver une conversation pour l'utilisateur
 */
export const unarchiveConversation = authActionClient
  .schema(archiveConversationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Désarchiver
    await prisma.conversationMember.update({
      where: {
        id: membership.id,
      },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Récupérer les conversations archivées de l'utilisateur
 */
export const getArchivedConversations = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const userId = ctx.userId;

    const archivedMemberships = await prisma.conversationMember.findMany({
      where: {
        userId,
        isArchived: true,
      },
      include: {
        Conversation: {
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
          },
        },
      },
      orderBy: {
        archivedAt: "desc",
      },
    });

    const conversations = archivedMemberships.map((m) => ({
      ...m.Conversation,
      archivedAt: m.archivedAt,
    }));

    return { conversations };
  });

// ========================================
// ACTIONS POUR LES CANAUX
// ========================================

/**
 * Créer un canal (public ou privé)
 */
export const createChannel = authActionClient
  .schema(createChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, description, isPrivate, category, purpose, memberIds = [] } = parsedInput;
    const userId = ctx.userId;

    const conversationId = crypto.randomUUID();

    // Créer le canal
    const conversation = await prisma.conversation.create({
      data: {
        id: conversationId,
        type: "CHANNEL",
        name,
        description,
        isPrivate: isPrivate || false,
        isShared: false,
        category,
        purpose,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ConversationMember: {
          create: [
            {
              id: crypto.randomUUID(),
              userId,
              isAdmin: true, // Le créateur est admin
            },
            ...memberIds.map((memberId) => ({
              id: crypto.randomUUID(),
              userId: memberId,
              isAdmin: false,
            })),
          ],
        },
        ChannelPermission: {
          create: {
            id: crypto.randomUUID(),
            userId: userId,
            role: "OWNER",
            canPost: true,
            canEdit: true,
            canDelete: true,
            canAddMembers: true,
            canRemoveMembers: true,
            canPinMessages: true,
            canMentionAll: true,
            createdAt: new Date(),
            updatedAt: new Date(),
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
              },
            },
          },
        },
        Project: true,
      },
    });

    revalidatePath("/dashboard/chat");
    return { conversation };
  });

/**
 * Mettre à jour les informations d'un canal
 */
export const updateChannel = authActionClient
  .schema(updateChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, name, description, topic, purpose, category } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que c'est un canal
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.type !== "CHANNEL") {
      throw new Error("Cette conversation n'est pas un canal");
    }

    // Vérifier les permissions (admin ou owner)
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        isAdmin: true,
      },
    });

    if (!membership) {
      // Vérifier les permissions via ChannelPermission
      const permission = await prisma.channelPermission.findFirst({
        where: {
          conversationId,
          userId,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!permission) {
        throw new Error("Vous n'avez pas les permissions pour modifier ce canal");
      }
    }

    // Mettre à jour
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(topic !== undefined && { topic }),
        ...(purpose !== undefined && { purpose }),
        ...(category !== undefined && { category }),
        updatedAt: new Date(),
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
              },
            },
          },
        },
        Project: true,
      },
    });

    revalidatePath("/dashboard/chat");
    return { conversation: updated };
  });

/**
 * Rejoindre un canal public
 */
export const joinChannel = authActionClient
  .schema(joinChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que c'est un canal
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.type !== "CHANNEL") {
      throw new Error("Cette conversation n'est pas un canal");
    }

    // Vérifier que le canal n'est pas privé
    if (conversation.isPrivate) {
      throw new Error("Ce canal est privé. Vous devez être invité pour le rejoindre.");
    }

    // Vérifier si l'utilisateur est déjà membre
    const existing = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (existing) {
      return { success: true, alreadyMember: true };
    }

    // Ajouter l'utilisateur
    await prisma.conversationMember.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        userId,
        isAdmin: false,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  });

/**
 * Mettre à jour les permissions d'un canal
 */
export const updateChannelPermission = authActionClient
  .schema(updateChannelPermissionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, userId: targetUserId, ...permissions } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que c'est un canal
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.type !== "CHANNEL") {
      throw new Error("Cette conversation n'est pas un canal");
    }

    // Vérifier que l'utilisateur a les permissions (admin ou owner)
    const userPermission = await prisma.channelPermission.findFirst({
      where: {
        conversationId,
        userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!userPermission) {
      throw new Error("Vous n'avez pas les permissions pour modifier les permissions de ce canal");
    }

    // Créer ou mettre à jour la permission
    const permission = await prisma.channelPermission.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId || userId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        conversationId,
        userId: targetUserId,
        ...permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        ...permissions,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/chat");
    return { permission };
  });

// ========================================
// ACTIONS POUR LES THREADS
// ========================================

/**
 * Envoyer un message avec support des threads
 */
export const sendMessageWithThread = authActionClient
  .schema(sendMessageWithThreadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, content, attachments, replyToId, threadId } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Déterminer le threadId
    let finalThreadId = threadId;
    if (replyToId && !threadId) {
      // Si on répond à un message, récupérer son threadId ou créer un nouveau thread
      const parentMessage = await prisma.message.findUnique({
        where: { id: replyToId },
        select: { threadId: true, id: true, isThreadRoot: true },
      });

      if (parentMessage) {
        // Si le message parent est une racine de thread, utiliser son ID
        if (parentMessage.isThreadRoot) {
          finalThreadId = parentMessage.id;
        } else {
          // Sinon, utiliser le threadId du parent
          finalThreadId = parentMessage.threadId || parentMessage.id;
        }
      }
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderId: userId,
        content,
        attachments,
        replyToId,
        threadId: finalThreadId,
        isThreadRoot: !finalThreadId && !!replyToId, // Si pas de threadId mais replyToId, c'est une nouvelle racine
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

    // Mettre à jour le compteur de thread si nécessaire
    if (finalThreadId) {
      await prisma.message.updateMany({
        where: {
          id: finalThreadId,
        },
        data: {
          threadCount: {
            increment: 1,
          },
        },
      });
    }

    // Mettre à jour la date de dernière activité
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    revalidatePath("/dashboard/chat");
    return { message };
  });

/**
 * Récupérer les messages d'un thread
 */
export const getThreadMessages = authActionClient
  .schema(z.object({ threadId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { threadId } = parsedInput;
    const userId = ctx.userId;

    // Récupérer le message racine
    const rootMessage = await prisma.message.findUnique({
      where: { id: threadId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
        Conversation: {
          include: {
            ConversationMember: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!rootMessage) {
      throw new Error("Thread introuvable");
    }

    if (rootMessage.Conversation.ConversationMember.length === 0) {
      throw new Error("Vous n'avez pas accès à ce thread");
    }

    // Récupérer toutes les réponses du thread
    const threadMessages = await prisma.message.findMany({
      where: {
        threadId,
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
          include: {
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
        createdAt: "asc",
      },
    });

    return {
      rootMessage,
      messages: threadMessages,
    };
  });

// ========================================
// ACTIONS POUR LES MESSAGES PROGRAMMÉS
// ========================================

/**
 * Programmer un message
 */
export const scheduleMessage = authActionClient
  .schema(scheduleMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, content, attachments, scheduledFor, isRecurring, recurrenceRule } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur est membre
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette conversation");
    }

    // Vérifier que la date est dans le futur
    if (scheduledFor <= new Date()) {
      throw new Error("La date d'envoi doit être dans le futur");
    }

    const scheduled = await prisma.scheduledMessage.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderId: userId,
        content,
        attachments,
        scheduledFor,
        isRecurring: isRecurring || false,
        recurrenceRule,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/chat");
    return { scheduledMessage: scheduled };
  });

/**
 * Créer un rappel pour un message
 */
export const createReminder = authActionClient
  .schema(createReminderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, remindAt } = parsedInput;
    const userId = ctx.userId;

    // Vérifier que l'utilisateur a accès au message
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

    if (message.Conversation.ConversationMember.length === 0) {
      throw new Error("Vous n'avez pas accès à ce message");
    }

    // Vérifier que la date est dans le futur
    if (remindAt <= new Date()) {
      throw new Error("La date de rappel doit être dans le futur");
    }

    const reminder = await prisma.messageReminder.upsert({
      where: {
        messageId_userId_remindAt: {
          messageId,
          userId,
          remindAt,
        },
      },
      create: {
        id: crypto.randomUUID(),
        messageId,
        userId,
        remindAt,
        createdAt: new Date(),
      },
      update: {
        remindAt,
      },
    });

    revalidatePath("/dashboard/chat");
    return { reminder };
  });

// ========================================
// ACTIONS POUR LA RECHERCHE GLOBALE
// ========================================

const globalSearchSchema = z.object({
  query: z.string().min(2),
  type: z.enum(["all", "messages", "files", "conversations"]).optional(),
  userId: z.string().optional(),
  dateRange: z.enum(["all", "today", "week", "month"]).optional(),
  conversationId: z.string().optional(),
});

/**
 * Recherche globale dans les messages, fichiers et conversations
 */
export const globalSearch = authActionClient
  .schema(globalSearchSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { query, type = "all", userId, dateRange, conversationId } = parsedInput;
    const currentUserId = ctx.userId;

    // Construire les conditions de date
    let dateFilter: { gte?: Date } = {};
    if (dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.gte = today;
    } else if (dateRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.gte = weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter.gte = monthAgo;
    }

    const results: any[] = [];

    // Recherche dans les messages
    if (type === "all" || type === "messages") {
      const messages = await prisma.message.findMany({
        where: {
          content: {
            contains: query,
            mode: "insensitive",
          },
          ...(conversationId && { conversationId }),
          ...(userId && { senderId: userId }),
          ...(dateRange !== "all" && { createdAt: dateFilter }),
          Conversation: {
            ConversationMember: {
              some: {
                userId: currentUserId,
              },
            },
          },
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
          Conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

      results.push(
        ...messages.map((msg) => ({
          id: msg.id,
          type: "message" as const,
          content: msg.content,
          conversationId: msg.conversationId,
          conversationName:
            msg.Conversation.name ||
            `Conversation ${msg.Conversation.type}`,
          conversationType: msg.Conversation.type,
          senderName: msg.User.name,
          createdAt: msg.createdAt,
        }))
      );
    }

    // Recherche dans les conversations
    if (type === "all" || type === "conversations") {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
          ConversationMember: {
            some: {
              userId: currentUserId,
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
                },
              },
            },
          },
        },
        take: 20,
      });

      results.push(
        ...conversations.map((conv) => ({
          id: conv.id,
          type: "conversation" as const,
          content: conv.description || conv.name || "",
          conversationId: conv.id,
          conversationName: conv.name || `Conversation ${conv.type}`,
          conversationType: conv.type,
          createdAt: conv.createdAt,
        }))
      );
    }

    // Recherche dans les fichiers (attachments)
    if (type === "all" || type === "files") {
      const messagesWithFiles = await prisma.message.findMany({
        where: {
          attachments: {
            not: Prisma.DbNull,
          },
          Conversation: {
            ConversationMember: {
              some: {
                userId: currentUserId,
              },
            },
          },
          ...(conversationId && { conversationId }),
          ...(dateRange !== "all" && { createdAt: dateFilter }),
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
          Conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      });

      // Filtrer les fichiers qui correspondent à la recherche
      messagesWithFiles.forEach((msg) => {
        if (msg.attachments && typeof msg.attachments === "object") {
          const attachments = Array.isArray(msg.attachments)
            ? msg.attachments
            : [msg.attachments];

          attachments.forEach((attachment: any) => {
            const fileName = attachment.name || attachment.filename || "";
            if (
              fileName.toLowerCase().includes(query.toLowerCase()) ||
              attachment.type?.toLowerCase().includes(query.toLowerCase())
            ) {
              results.push({
                id: `${msg.id}-${attachment.name || attachment.filename}`,
                type: "file" as const,
                content: fileName,
                conversationId: msg.conversationId,
                conversationName:
                  msg.Conversation.name ||
                  `Conversation ${msg.Conversation.type}`,
                conversationType: msg.Conversation.type,
                senderName: msg.User.name,
                createdAt: msg.createdAt,
                fileData: attachment,
              });
            }
          });
        }
      });
    }

    // Trier par date (plus récent en premier)
    results.sort((a, b) => {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return { results: results.slice(0, 100) }; // Limiter à 100 résultats
  });

