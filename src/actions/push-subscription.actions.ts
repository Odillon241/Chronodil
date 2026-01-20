'use server'

import { prisma } from '@/lib/db'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'

/**
 * Schéma pour une subscription push
 */
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

/**
 * Sauvegarder une subscription push pour l'utilisateur connecté
 */
export const savePushSubscription = authActionClient
  .schema(pushSubscriptionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { endpoint, keys } = parsedInput

    // Vérifier si une subscription existe déjà avec ce endpoint
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (existingSubscription) {
      // Si c'est pour le même utilisateur, mettre à jour
      if (existingSubscription.userId === userId) {
        const updated = await prisma.pushSubscription.update({
          where: { endpoint },
          data: {
            p256dh: keys.p256dh,
            auth: keys.auth,
            updatedAt: new Date(),
          },
        })
        return { success: true, subscription: updated, action: 'updated' }
      }

      // Si c'est pour un autre utilisateur, supprimer l'ancienne et créer une nouvelle
      await prisma.pushSubscription.delete({
        where: { endpoint },
      })
    }

    // Créer une nouvelle subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    return { success: true, subscription, action: 'created' }
  })

/**
 * Supprimer une subscription push
 */
export const deletePushSubscription = authActionClient
  .schema(z.object({ endpoint: z.string().url() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { endpoint } = parsedInput

    // Vérifier que la subscription appartient à l'utilisateur
    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (!subscription) {
      return { success: true, message: 'Subscription déjà supprimée' }
    }

    if (subscription.userId !== userId) {
      throw new Error('Non autorisé')
    }

    await prisma.pushSubscription.delete({
      where: { endpoint },
    })

    return { success: true, message: 'Subscription supprimée' }
  })

/**
 * Vérifier si l'utilisateur a une subscription active
 */
export const checkPushSubscription = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      hasSubscription: subscriptions.length > 0,
      count: subscriptions.length,
      subscriptions,
    }
  })

/**
 * Récupérer toutes les subscriptions d'un utilisateur (pour l'envoi de notifications)
 * Utilisée en interne par notification-helpers
 */
export async function getUserPushSubscriptions(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  })
}

/**
 * Supprimer une subscription invalide (endpoint 404/410)
 * Utilisée en interne par notification-helpers lors d'échecs d'envoi
 */
export async function removeInvalidPushSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    })
    console.log(`[Push] Subscription invalide supprimée: ${endpoint.substring(0, 50)}...`)
    return true
  } catch (_error) {
    // La subscription n'existe peut-être plus
    return false
  }
}

/**
 * Envoyer une notification push de test à l'utilisateur connecté
 */
export const sendTestPushNotification = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx

    try {
      // Import dynamique pour éviter les problèmes avec web-push
      const { createAndSendNotification } = await import('@/lib/notification-helpers')

      // Créer et envoyer une notification de test
      const result = await createAndSendNotification({
        userId,
        title: '🔔 Test de notification push',
        message:
          "Si vous voyez ce message, les notifications push fonctionnent correctement ! Vous recevrez des alertes même quand l'application est fermée.",
        type: 'info',
        link: '/dashboard/notifications',
        sendPush: true,
      })

      if (result.pushResult?.sent > 0) {
        return {
          success: true,
          message: `Notification envoyée avec succès à ${result.pushResult.sent} appareil(s)`,
          sent: result.pushResult.sent,
        }
      } else if (result.pushResult?.failed > 0) {
        return {
          success: false,
          message: "Échec de l'envoi de la notification",
          error: "Aucun appareil n'a reçu la notification",
        }
      } else {
        return {
          success: false,
          message: 'Aucune subscription active trouvée',
          error: 'Veuillez vous réabonner aux notifications push',
        }
      }
    } catch (error: any) {
      console.error('[Push Test] Erreur:', error)
      return {
        success: false,
        message: "Erreur lors de l'envoi",
        error: error.message || 'Erreur inconnue',
      }
    }
  })
