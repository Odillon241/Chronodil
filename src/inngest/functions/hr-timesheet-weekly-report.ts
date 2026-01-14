import { inngest } from "../client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Job Inngest : Rapport hebdomadaire des feuilles de temps RH
 *
 * Fréquence : Tous les lundis à 8h
 *
 * Fonctionnement :
 * 1. Analyse les données de la semaine précédente (lundi-dimanche)
 * 2. Calcule les statistiques agrégées
 * 3. Envoie un rapport HTML aux RH et admins
 *
 * Bénéfices :
 * - ✅ Automatise 2-3h de travail manuel/semaine
 * - ✅ Vision claire du taux de conformité
 * - ✅ Détection proactive des problèmes
 */
export const hrTimesheetWeeklyReport = inngest.createFunction(
  {
    id: "hr-timesheet-weekly-report",
    name: "Weekly HR Timesheet Report (Monday 8am)",
    retries: 2,
  },
  {
    // Tous les lundis à 8h
    cron: "0 8 * * 1",
  },
  async ({ step }) => {
    const now = new Date();

    // Calculer la semaine précédente (lundi-dimanche)
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });

    // Étape 1: Agréger les statistiques de la semaine
    const stats = await step.run("aggregate-weekly-stats", async () => {
      // Récupérer tous les timesheets de la semaine
      const timesheets = await prisma.hRTimesheet.findMany({
        where: {
          weekStartDate: {
            gte: lastWeekStart,
            lte: lastWeekEnd,
          },
        },
        include: {
          HRActivity: true,
          User_HRTimesheet_userIdToUser: {
            select: { id: true, name: true },
          },
        },
      });

      // Statistiques de base
      const totalTimesheets = timesheets.length;
      const totalDraft = timesheets.filter((ts) => ts.status === "DRAFT").length;
      const totalPending = timesheets.filter((ts) => ts.status === "PENDING").length;
      const totalManagerApproved = timesheets.filter(
        (ts) => ts.status === "MANAGER_APPROVED"
      ).length;
      const totalApproved = timesheets.filter((ts) => ts.status === "APPROVED").length;
      const totalRejected = timesheets.filter((ts) => ts.status === "REJECTED").length;

      // Calcul des heures totales
      const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
      const avgHoursPerTimesheet =
        totalTimesheets > 0 ? totalHours / totalTimesheets : 0;

      // Nombre d'activités créées
      const totalActivities = timesheets.reduce(
        (sum, ts) => sum + ts.HRActivity.length,
        0
      );

      // Taux de conformité (soumis / total)
      const submittedCount = totalTimesheets - totalDraft;
      const complianceRate =
        totalTimesheets > 0 ? (submittedCount / totalTimesheets) * 100 : 0;

      // Délai moyen de validation (PENDING → APPROVED)
      const approvedTimesheets = timesheets.filter(
        (ts) => ts.status === "APPROVED" && ts.odillonSignedAt && ts.employeeSignedAt
      );
      const avgValidationTime =
        approvedTimesheets.length > 0
          ? approvedTimesheets.reduce((sum, ts) => {
              const delay =
                ts.odillonSignedAt!.getTime() - ts.employeeSignedAt!.getTime();
              return sum + delay / (1000 * 60 * 60 * 24); // Jours
            }, 0) / approvedTimesheets.length
          : 0;

      return {
        weekStart: lastWeekStart,
        weekEnd: lastWeekEnd,
        totalTimesheets,
        totalDraft,
        totalPending,
        totalManagerApproved,
        totalApproved,
        totalRejected,
        totalHours,
        avgHoursPerTimesheet,
        totalActivities,
        complianceRate,
        avgValidationTime,
        timesheets, // Pour détails dans l'email
      };
    });

    // Étape 2: Récupérer les destinataires (RH + Admins)
    const recipients = await step.run("find-recipients", async () => {
      return prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "HR"] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailNotificationsEnabled: true,
        },
      });
    });

    if (recipients.length === 0) {
      return {
        processed: 0,
        message: "Aucun destinataire RH/Admin trouvé",
      };
    }

    // Étape 3: Envoyer le rapport par email
    const emailResults = [];
    for (const recipient of recipients) {
      if (!recipient.emailNotificationsEnabled) continue;

      const result = await step.run(`send-report-${recipient.id}`, async () => {
        try {
          // Préparer les données pour l'email
          const weekLabel = format(stats.weekStart, "dd MMMM yyyy", { locale: fr });
          const weekEndLabel = format(stats.weekEnd, "dd MMMM yyyy", { locale: fr });

          // Générer le contenu HTML du rapport
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
              <h1 style="color: #C7522B; border-bottom: 3px solid #C7522B; padding-bottom: 10px;">
                📊 Rapport Hebdomadaire RH
              </h1>

              <p>Bonjour ${recipient.name},</p>
              <p>Voici le rapport des feuilles de temps RH pour la semaine du <strong>${weekLabel}</strong> au <strong>${weekEndLabel}</strong>.</p>

              <h2 style="color: #333; margin-top: 30px;">📈 Statistiques Globales</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #ddd;"><strong>Total feuilles de temps</strong></td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${stats.totalTimesheets}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">Brouillons (DRAFT)</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #ffc107;">${stats.totalDraft}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #ddd;">En attente (PENDING)</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #17a2b8;">${stats.totalPending}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">Validées manager</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #007bff;">${stats.totalManagerApproved}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #ddd;">Approuvées</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #28a745;"><strong>${stats.totalApproved}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">Rejetées</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #dc3545;">${stats.totalRejected}</td>
                </tr>
              </table>

              <h2 style="color: #333; margin-top: 30px;">⏱️ Heures et Activités</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #ddd;"><strong>Total heures saisies</strong></td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;"><strong>${stats.totalHours.toFixed(1)}h</strong></td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">Moyenne par feuille</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${stats.avgHoursPerTimesheet.toFixed(1)}h</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #ddd;">Total activités créées</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${stats.totalActivities}</td>
                </tr>
              </table>

              <h2 style="color: #333; margin-top: 30px;">✅ Conformité et Performance</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #ddd;"><strong>Taux de soumission</strong></td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">
                    <span style="color: ${stats.complianceRate >= 80 ? "#28a745" : stats.complianceRate >= 60 ? "#ffc107" : "#dc3545"};">
                      <strong>${stats.complianceRate.toFixed(1)}%</strong>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">Délai moyen de validation</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${stats.avgValidationTime.toFixed(1)} jours</td>
                </tr>
              </table>

              ${
                stats.complianceRate < 80
                  ? `
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Action recommandée</strong></p>
                <p style="margin: 5px 0 0 0;">
                  Le taux de soumission est inférieur à 80%. Pensez à relancer les employés n'ayant pas soumis leur feuille de temps.
                </p>
              </div>
              `
                  : ""
              }

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                  Ce rapport est généré automatiquement tous les lundis à 8h.<br>
                  Pour consulter les détails, accédez au <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/hr-timesheet" style="color: #C7522B;">tableau de bord RH</a>.
                </p>
              </div>
            </div>
          `;

          await sendEmail({
            to: recipient.email,
            subject: `📊 Rapport Hebdomadaire RH - Semaine du ${weekLabel}`,
            html: htmlContent,
          });

          return {
            recipientId: recipient.id,
            recipientEmail: recipient.email,
            success: true,
          };
        } catch (error) {
          console.error(`Erreur email pour ${recipient.email}:`, error);
          return {
            recipientId: recipient.id,
            recipientEmail: recipient.email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      emailResults.push(result);
    }

    return {
      processed: recipients.length,
      emailsSent: emailResults.filter((r) => r.success).length,
      stats: {
        weekStart: String(stats.weekStart),
        weekEnd: String(stats.weekEnd),
        totalTimesheets: stats.totalTimesheets,
        complianceRate: stats.complianceRate,
        totalHours: stats.totalHours,
      },
      timestamp: now.toISOString(),
    };
  }
);
