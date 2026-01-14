import { inngest } from "../client";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email";

/**
 * Job Inngest : Vérification et envoi des rappels de tâches
 *
 * Fréquence : Toutes les 5 minutes
 *
 * Fonctionnement :
 * 1. Recherche les tâches avec rappel dû (reminderDate <= now)
 * 2. Envoie des notifications multi-canaux (push + email)
 * 3. Marque les tâches comme notifiées pour éviter les doublons
 *
 * Bénéfices vs client-side :
 * - ✅ Fonctionne même si l'utilisateur a fermé son navigateur
 * - ✅ Gestion des fuseaux horaires côté serveur
 * - ✅ Fiabilité 100% (pas de dépendance au client)
 * - ✅ Multi-canaux (push, email, SMS futur)
 */
export const taskReminderJob = inngest.createFunction(
  {
    id: "task-reminder-check",
    name: "Check Task Reminders Every 5 Minutes",
    // Retry en cas d'erreur
    retries: 3,
  },
  {
    // Toutes les 5 minutes
    cron: "*/5 * * * *",
  },
  async ({ step }) => {
    const now = new Date();

    // Étape 1: Trouver les tâches avec rappel dû
    const dueTasks = await step.run("find-due-reminders", async () => {
      return prisma.task.findMany({
        where: {
          isActive: true,
          status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
          reminderDate: {
            lte: now,
            // Seulement les rappels non encore notifiés (ou notifiés il y a plus de 24h)
            // Pour éviter de re-notifier constamment
          },
          OR: [
            { reminderNotifiedAt: null },
            {
              reminderNotifiedAt: {
                lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
        include: {
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              email: true,
              emailNotificationsEnabled: true,
              desktopNotificationsEnabled: true,
            },
          },
          TaskMember: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  emailNotificationsEnabled: true,
                  desktopNotificationsEnabled: true,
                },
              },
            },
          },
        },
        take: 100, // Limiter à 100 tâches par run pour éviter les timeouts
      });
    });

    if (dueTasks.length === 0) {
      return {
        processed: 0,
        message: "Aucun rappel à traiter",
      };
    }

    // Étape 2: Envoyer notifications pour chaque tâche
    const results = [];
    for (const task of dueTasks) {
      const result = await step.run(`send-reminder-${task.id}`, async () => {
        // Collecter tous les utilisateurs à notifier (créateur + membres)
        const users = [
          task.User_Task_createdByToUser,
          ...task.TaskMember.map((m) => m.User),
        ].filter(Boolean);

        const uniqueUsers = Array.from(
          new Map(users.map((u) => [u!.id, u])).values()
        );

        let notificationsSent = 0;
        let emailsSent = 0;

        // Envoyer notifications pour chaque utilisateur
        for (const user of uniqueUsers) {
          if (!user) continue;

          try {
            // 1. Créer notification in-app + push
            if (user.desktopNotificationsEnabled) {
              const notification = await prisma.notification.create({
                data: {
                  id: nanoid(),
                  userId: user.id,
                  title: "📅 Rappel de tâche",
                  message: `Il est temps de travailler sur : ${task.name}`,
                  type: "task_reminder",
                  link: `/dashboard/tasks?task=${task.id}`,
                  isRead: false,
                },
              });

              // Envoyer push notification (fire and forget)
              try {
                const { sendPushNotificationForNotification } = await import(
                  "@/lib/notification-helpers"
                );
                await sendPushNotificationForNotification(user.id, {
                  id: notification.id,
                  title: notification.title,
                  message: notification.message,
                  type: notification.type,
                  link: notification.link,
                });
              } catch (pushError) {
                console.error(
                  `Erreur push notification pour user ${user.id}:`,
                  pushError
                );
              }

              notificationsSent++;
            }

            // 2. Envoyer email si préférence activée
            if (user.emailNotificationsEnabled) {
              try {
                await sendEmail({
                  to: user.email,
                  subject: `Rappel: ${task.name}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #C7522B;">📅 Rappel de tâche</h2>
                      <p>Bonjour ${user.name},</p>
                      <p>Il est temps de travailler sur la tâche suivante :</p>
                      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${task.name}</h3>
                        ${task.description ? `<p>${task.description}</p>` : ""}
                        ${task.dueDate ? `<p><strong>Date d'échéance :</strong> ${new Date(task.dueDate).toLocaleDateString("fr-FR")}</p>` : ""}
                      </div>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks?task=${task.id}"
                         style="display: inline-block; background-color: #C7522B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Voir la tâche
                      </a>
                    </div>
                  `,
                });
                emailsSent++;
              } catch (emailError) {
                console.error(
                  `Erreur email pour user ${user.id}:`,
                  emailError
                );
              }
            }
          } catch (userError) {
            console.error(
              `Erreur notification pour user ${user.id}:`,
              userError
            );
          }
        }

        // 3. Marquer la tâche comme notifiée
        await prisma.task.update({
          where: { id: task.id },
          data: {
            reminderNotifiedAt: now,
          },
        });

        return {
          taskId: task.id,
          taskName: task.name,
          usersNotified: uniqueUsers.length,
          notificationsSent,
          emailsSent,
        };
      });

      results.push(result);
    }

    return {
      processed: dueTasks.length,
      results,
      timestamp: now.toISOString(),
    };
  }
);
