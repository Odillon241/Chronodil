import { inngest } from "../client";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email";

/**
 * Job Inngest : Détection et escalade des tâches en retard
 *
 * Fréquence : Chaque jour à 9h00 (heure serveur)
 *
 * Fonctionnement :
 * 1. Détecte toutes les tâches avec dueDate < now
 * 2. Calcule le nombre de jours de retard
 * 3. Escalade progressive selon le retard:
 *    - J+1 : Notification au créateur + membres
 *    - J+3 : + Notification au manager du créateur
 *    - J+7+ : + Notification aux managers du projet (critique)
 * 4. Met à jour les champs overdueDays et overdueNotifiedAt
 *
 * Bénéfices :
 * - ✅ Détection automatique des retards
 * - ✅ Escalade intelligente vers la hiérarchie
 * - ✅ Réduction proactive des retards
 * - ✅ Métriques de performance (SLA)
 */
export const taskOverdueJob = inngest.createFunction(
  {
    id: "task-overdue-check",
    name: "Check Overdue Tasks Daily at 9AM",
    retries: 3,
  },
  {
    // Chaque jour à 9h00
    cron: "0 9 * * *",
  },
  async ({ step }) => {
    const now = new Date();

    // Étape 1: Trouver les tâches en retard
    const overdueTasks = await step.run("find-overdue-tasks", async () => {
      return prisma.task.findMany({
        where: {
          isActive: true,
          status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
          dueDate: { lt: now },
        },
        include: {
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              email: true,
              emailNotificationsEnabled: true,
              desktopNotificationsEnabled: true,
              managerId: true,
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  emailNotificationsEnabled: true,
                },
              },
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
          Project: {
            select: {
              id: true,
              name: true,
              ProjectMember: {
                where: {
                  role: { in: ["MANAGER", "ADMIN"] },
                },
                include: {
                  User: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      emailNotificationsEnabled: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 200, // Limiter pour éviter les timeouts
      });
    });

    if (overdueTasks.length === 0) {
      return {
        processed: 0,
        message: "Aucune tâche en retard",
      };
    }

    // Étape 2: Traiter chaque tâche en retard
    const results = [];
    for (const task of overdueTasks) {
      const result = await step.run(`handle-overdue-${task.id}`, async () => {
        // Calculer le nombre de jours de retard
        const daysPastDue = Math.floor(
          (now.getTime() - new Date(task.dueDate!).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Collecter les utilisateurs à notifier
        const taskMembers = [
          task.User_Task_createdByToUser,
          ...task.TaskMember.map((m) => m.User),
        ].filter(Boolean);

        const uniqueTaskMembers = Array.from(
          new Map(taskMembers.map((u) => [u!.id, u])).values()
        );

        let notificationsCount = 0;

        // ESCALADE NIVEAU 1 (J+1) : Notification aux membres de la tâche
        if (daysPastDue >= 1) {
          for (const user of uniqueTaskMembers) {
            if (!user) continue;

            try {
              // Notification in-app
              if (user.desktopNotificationsEnabled) {
                await prisma.notification.create({
                  data: {
                    id: nanoid(),
                    userId: user.id,
                    title: "⚠️ Tâche en retard",
                    message: `La tâche "${task.name}" est en retard de ${daysPastDue} jour(s)`,
                    type: "task_overdue",
                    link: `/dashboard/tasks?task=${task.id}`,
                    isRead: false,
                  },
                });
                notificationsCount++;
              }

              // Email
              if (user.emailNotificationsEnabled) {
                await sendEmail({
                  to: user.email,
                  subject: `⚠️ Tâche en retard : ${task.name}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #d97706;">⚠️ Tâche en retard</h2>
                      <p>Bonjour ${user.name},</p>
                      <p>La tâche suivante est en retard de <strong>${daysPastDue} jour(s)</strong> :</p>
                      <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${task.name}</h3>
                        ${task.description ? `<p>${task.description}</p>` : ""}
                        <p><strong>Date d'échéance :</strong> ${new Date(task.dueDate!).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <p>Veuillez mettre à jour le statut de cette tâche dès que possible.</p>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks?task=${task.id}"
                         style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Voir la tâche
                      </a>
                    </div>
                  `,
                });
              }
            } catch (error) {
              console.error(`Erreur notification membre ${user.id}:`, error);
            }
          }
        }

        // ESCALADE NIVEAU 2 (J+3) : Notification au manager du créateur
        if (
          daysPastDue >= 3 &&
          task.User_Task_createdByToUser?.User
        ) {
          const manager = task.User_Task_createdByToUser.User;

          try {
            await prisma.notification.create({
              data: {
                id: nanoid(),
                userId: manager.id,
                title: "⚠️ Escalade : Tâche en retard (3+ jours)",
                message: `La tâche "${task.name}" de ${task.User_Task_createdByToUser.name} est en retard de ${daysPastDue} jours`,
                type: "task_overdue_escalation",
                link: `/dashboard/tasks?task=${task.id}`,
                isRead: false,
              },
            });
            notificationsCount++;

            if (manager.emailNotificationsEnabled) {
              await sendEmail({
                to: manager.email,
                subject: `⚠️ Escalade : Tâche en retard (${daysPastDue} jours)`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ea580c;">⚠️ Escalade : Tâche en retard</h2>
                    <p>Bonjour ${manager.name},</p>
                    <p>Une tâche assignée à <strong>${task.User_Task_createdByToUser.name}</strong> est en retard de <strong>${daysPastDue} jours</strong> :</p>
                    <div style="background-color: #fed7aa; padding: 15px; border-left: 4px solid #ea580c; margin: 20px 0;">
                      <h3 style="margin-top: 0;">${task.name}</h3>
                      ${task.description ? `<p>${task.description}</p>` : ""}
                      <p><strong>Date d'échéance :</strong> ${new Date(task.dueDate!).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <p>Veuillez contacter ${task.User_Task_createdByToUser.name} pour débloquer la situation.</p>
                  </div>
                `,
              });
            }
          } catch (error) {
            console.error("Erreur notification manager:", error);
          }
        }

        // ESCALADE NIVEAU 3 (J+7+) : Notification aux managers du projet (CRITIQUE)
        if (daysPastDue >= 7 && task.Project) {
          const projectManagers =
            task.Project.ProjectMember.map((pm) => pm.User).filter(Boolean);

          for (const manager of projectManagers) {
            if (!manager) continue;

            try {
              await prisma.notification.create({
                data: {
                  id: nanoid(),
                  userId: manager.id,
                  title: "🚨 CRITIQUE : Tâche en retard (7+ jours)",
                  message: `La tâche "${task.name}" du projet ${task.Project.name} est en retard critique de ${daysPastDue} jours`,
                  type: "task_overdue_critical",
                  link: `/dashboard/tasks?task=${task.id}`,
                  isRead: false,
                },
              });
              notificationsCount++;

              if (manager.emailNotificationsEnabled) {
                await sendEmail({
                  to: manager.email,
                  subject: `🚨 CRITIQUE : Tâche en retard (${daysPastDue} jours)`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #dc2626;">🚨 ALERTE CRITIQUE : Tâche en retard</h2>
                      <p>Bonjour ${manager.name},</p>
                      <p>Une tâche du projet <strong>${task.Project.name}</strong> est en retard critique de <strong>${daysPastDue} jours</strong> :</p>
                      <div style="background-color: #fecaca; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${task.name}</h3>
                        ${task.description ? `<p>${task.description}</p>` : ""}
                        <p><strong>Assigné à :</strong> ${task.User_Task_createdByToUser?.name || "Non assigné"}</p>
                        <p><strong>Date d'échéance :</strong> ${new Date(task.dueDate!).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <p><strong>Action requise immédiatement.</strong></p>
                    </div>
                  `,
                });
              }
            } catch (error) {
              console.error(
                `Erreur notification project manager ${manager.id}:`,
                error
              );
            }
          }
        }

        // Mettre à jour les champs de la tâche
        await prisma.task.update({
          where: { id: task.id },
          data: {
            overdueDays: daysPastDue,
            overdueNotifiedAt: now,
            // Mettre à jour le SLA status
            slaStatus:
              daysPastDue >= 7
                ? "BREACHED"
                : daysPastDue >= 3
                  ? "AT_RISK"
                  : "ON_TRACK",
          },
        });

        return {
          taskId: task.id,
          taskName: task.name,
          daysPastDue,
          escalationLevel:
            daysPastDue >= 7 ? "CRITICAL" : daysPastDue >= 3 ? "MANAGER" : "TEAM",
          notificationsSent: notificationsCount,
        };
      });

      results.push(result);
    }

    return {
      processed: overdueTasks.length,
      results,
      timestamp: now.toISOString(),
    };
  }
);
