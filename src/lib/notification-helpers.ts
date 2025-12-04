/**
 * Module d'aide pour l'envoi de notifications push
 * Utilise web-push pour envoyer des notifications aux navigateurs
 * Note: web-push est importé dynamiquement pour éviter les problèmes avec Turbopack
 */

import { prisma } from "@/lib/db";
import {
  getUserPushSubscriptions,
  removeInvalidPushSubscription,
} from "@/actions/push-subscription.actions";

// Configuration VAPID
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@chronodil.com";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

// Vérifier si les clés VAPID sont configurées
const isVapidConfigured =
  VAPID_PUBLIC_KEY.length > 0 && VAPID_PRIVATE_KEY.length > 0;

// Variable pour stocker l'instance web-push configurée
let webpushInstance: typeof import("web-push") | null = null;

/**
 * Obtenir l'instance web-push configurée (lazy loading)
 */
async function getWebPush(): Promise<typeof import("web-push") | null> {
  if (!isVapidConfigured) {
    return null;
  }

  if (!webpushInstance) {
    try {
      // Import dynamique pour éviter les problèmes avec Turbopack
      const webpush = await import("web-push");
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      webpushInstance = webpush;
      console.log("[Push] VAPID configuré avec succès");
    } catch (error) {
      console.error("[Push] Erreur lors du chargement de web-push:", error);
      return null;
    }
  }

  return webpushInstance;
}

/**
 * Interface pour les données d'une notification
 */
export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
}

/**
 * Données à envoyer dans le payload push
 */
interface PushPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  data: {
    url: string;
    notificationId: string;
    type: string;
  };
}

/**
 * Envoyer une notification push à un utilisateur
 * @param userId - ID de l'utilisateur destinataire
 * @param notification - Données de la notification
 * @returns Résultat de l'envoi
 */
export async function sendPushNotificationForNotification(
  userId: string,
  notification: Omit<NotificationData, "userId">
): Promise<{ success: boolean; sent: number; failed: number }> {
  const webpush = await getWebPush();
  
  if (!webpush) {
    console.log("[Push] Skip - VAPID non configuré ou web-push non disponible");
    return { success: false, sent: 0, failed: 0 };
  }

  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log(`[Push] Aucune subscription pour l'utilisateur ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const payload: PushPayload = {
      title: notification.title,
      body: notification.message,
      icon: "/assets/media/logo-icon.svg",
      badge: "/assets/media/logo-icon.svg",
      tag: `chronodil-${notification.type}-${notification.id}`,
      data: {
        url: notification.link || "/dashboard/notifications",
        notificationId: notification.id,
        type: notification.type,
      },
    };

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            {
              TTL: 24 * 60 * 60, // 24 heures
              urgency: notification.type === "error" ? "high" : "normal",
            }
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // Si la subscription est invalide (410 ou 404), la supprimer
          if (error.statusCode === 410 || error.statusCode === 404) {
            await removeInvalidPushSubscription(sub.endpoint);
            console.log(
              `[Push] Subscription expirée supprimée: ${sub.endpoint.substring(0, 50)}...`
            );
          }
          throw error;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[Push] Envoyé ${sent}/${subscriptions.length} notifications pour l'utilisateur ${userId}`
    );

    return { success: true, sent, failed };
  } catch (error) {
    console.error("[Push] Erreur lors de l'envoi:", error);
    return { success: false, sent: 0, failed: 1 };
  }
}

/**
 * Envoyer des notifications push à plusieurs utilisateurs
 * @param notifications - Liste des notifications avec userId
 * @returns Résultat global
 */
export async function sendPushNotificationsForNotifications(
  notifications: NotificationData[]
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  const webpush = await getWebPush();
  
  if (!webpush) {
    console.log("[Push] Skip - VAPID non configuré ou web-push non disponible");
    return { success: false, totalSent: 0, totalFailed: 0 };
  }

  let totalSent = 0;
  let totalFailed = 0;

  // Grouper les notifications par userId pour optimiser les requêtes
  const notificationsByUser = notifications.reduce(
    (acc, notif) => {
      if (!acc[notif.userId]) {
        acc[notif.userId] = [];
      }
      acc[notif.userId].push(notif);
      return acc;
    },
    {} as Record<string, NotificationData[]>
  );

  // Envoyer les notifications pour chaque utilisateur
  const results = await Promise.allSettled(
    Object.entries(notificationsByUser).map(async ([userId, userNotifs]) => {
      // Envoyer chaque notification séparément pour ce user
      for (const notif of userNotifs) {
        const result = await sendPushNotificationForNotification(userId, {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link,
        });
        totalSent += result.sent;
        totalFailed += result.failed;
      }
    })
  );

  console.log(
    `[Push] Batch envoyé: ${totalSent} réussis, ${totalFailed} échoués`
  );

  return { success: true, totalSent, totalFailed };
}

/**
 * Créer une notification en base de données et envoyer la push notification
 * Fonction utilitaire centralisée
 */
export async function createAndSendNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  sendPush?: boolean;
}): Promise<{ notification: any; pushResult?: any }> {
  const { nanoid } = await import("nanoid");

  const notification = await prisma.notification.create({
    data: {
      id: nanoid(),
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      link: params.link || null,
    },
  });

  let pushResult = undefined;
  if (params.sendPush !== false) {
    // Par défaut, envoyer la push notification
    pushResult = await sendPushNotificationForNotification(params.userId, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
    });
  }

  return { notification, pushResult };
}

/**
 * Créer des notifications pour plusieurs utilisateurs
 * Utile pour les notifications de groupe (partage de tâche, etc.)
 */
export async function createAndSendNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string | null;
  }>,
  sendPush: boolean = true
): Promise<{ count: number; pushResult?: any }> {
  const { nanoid } = await import("nanoid");

  // Créer toutes les notifications en batch
  const result = await prisma.notification.createMany({
    data: notifications.map((n) => ({
      id: nanoid(),
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type || "info",
      link: n.link || null,
    })),
  });

  let pushResult = undefined;
  if (sendPush && result.count > 0) {
    // Récupérer les notifications créées pour les push
    const createdNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: notifications.map((n) => n.userId) },
      },
      orderBy: { createdAt: "desc" },
      take: result.count,
    });

    pushResult = await sendPushNotificationsForNotifications(
      createdNotifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
      }))
    );
  }

  return { count: result.count, pushResult };
}

/**
 * Vérifier si les push notifications sont configurées
 */
export function isPushConfigured(): boolean {
  return isVapidConfigured;
}

/**
 * Obtenir la clé publique VAPID pour le client
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
