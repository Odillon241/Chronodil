"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { format as formatDate, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
  generateReportFromTimesheetSchema,
  consolidateMonthlyReportSchema,
} from "@/lib/validations/report-template";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Remplacer les variables dans le template par les valeurs réelles
 */
function replaceTemplateVariables(
  templateContent: string,
  variables: Record<string, any>
): string {
  let content = templateContent;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, String(value || ""));
  }

  return content;
}

/**
 * Convertir les activités RH en format tableau pour le rapport
 */
function formatActivitiesForReport(activities: any[]): string {
  if (!activities || activities.length === 0) {
    return "<p>Aucune activité enregistrée</p>";
  }

  let html = `
    <table border="1" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="padding: 8px; background-color: #f3f4f6;">Activité</th>
          <th style="padding: 8px; background-color: #f3f4f6;">Type</th>
          <th style="padding: 8px; background-color: #f3f4f6;">Période</th>
          <th style="padding: 8px; background-color: #f3f4f6;">Heures</th>
          <th style="padding: 8px; background-color: #f3f4f6;">Statut</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const activity of activities) {
    const statusText = activity.status === "COMPLETED" ? "Terminée" : "En cours";
    const periodText = activity.periodicity === "WEEKLY" ? "Hebdomadaire" :
                      activity.periodicity === "MONTHLY" ? "Mensuel" :
                      activity.periodicity === "DAILY" ? "Quotidien" : "Ponctuel";

    html += `
        <tr>
          <td style="padding: 8px;">${activity.activityName}</td>
          <td style="padding: 8px;">${activity.activityType}</td>
          <td style="padding: 8px;">${periodText}</td>
          <td style="padding: 8px;">${activity.totalHours}h</td>
          <td style="padding: 8px;">${statusText}</td>
        </tr>
    `;
  }

  html += `
      </tbody>
    </table>
  `;

  return html;
}

// ============================================
// REPORT GENERATION
// ============================================

/**
 * Générer un rapport depuis une feuille de temps RH
 */
export const generateReportFromTimesheet = authActionClient
  .schema(generateReportFromTimesheetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const {
      hrTimesheetId,
      templateId,
      title,
      format,
      includeSummary,
      customContent,
    } = parsedInput;

    // Récupérer la feuille de temps avec toutes les données
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: hrTimesheetId },
      include: {
        User_HRTimesheet_userIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        HRActivity: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    if (!timesheet) {
      throw new Error("Feuille de temps non trouvée");
    }

    // Vérifier que l'utilisateur a accès à cette feuille de temps
    if (timesheet.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "ADMIN" && user?.role !== "HR" && user?.role !== "MANAGER") {
        throw new Error("Vous n'avez pas la permission d'accéder à cette feuille de temps");
      }
    }

    // Récupérer le modèle (ou utiliser le modèle par défaut pour WEEKLY)
    let template = null;
    if (templateId) {
      template = await prisma.reportTemplate.findUnique({
        where: { id: templateId },
      });
    } else {
      template = await prisma.reportTemplate.findFirst({
        where: {
          frequency: "WEEKLY",
          isDefault: true,
          isActive: true,
        },
      });
    }

    // Variables pour le remplacement dans le template
    const variables = {
      employeeName: timesheet.employeeName,
      position: timesheet.position,
      site: timesheet.site,
      weekStart: formatDate(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr }),
      weekEnd: formatDate(new Date(timesheet.weekEndDate), "dd/MM/yyyy", { locale: fr }),
      totalHours: timesheet.totalHours.toString(),
      observations: timesheet.employeeObservations || "Aucune observation",
      activities: formatActivitiesForReport(timesheet.HRActivity),
      activityCount: timesheet.HRActivity.length.toString(),
    };

    // Générer le contenu du rapport
    let content = "";

    if (template) {
      // Utiliser le template et remplacer les variables
      content = replaceTemplateVariables(template.templateContent, variables);
    } else {
      // Template par défaut simple
      content = `
        <h1>Rapport Hebdomadaire</h1>
        <h2>${variables.employeeName} - ${variables.position}</h2>
        <p><strong>Site:</strong> ${variables.site}</p>
        <p><strong>Période:</strong> Du ${variables.weekStart} au ${variables.weekEnd}</p>
        <p><strong>Total des heures:</strong> ${variables.totalHours}h</p>

        <h3>Activités de la semaine</h3>
        ${variables.activities}

        <h3>Observations</h3>
        <p>${variables.observations}</p>
      `;
    }

    // Ajouter le contenu personnalisé si fourni
    if (customContent) {
      content += `\n\n<hr/>\n\n${customContent}`;
    }

    // Générer le titre automatique si non fourni
    const reportTitle = title || `Rapport Hebdomadaire - ${variables.employeeName} - Semaine du ${variables.weekStart}`;

    // Créer le rapport
    const report = await prisma.report.create({
      data: {
        id: nanoid(),
        title: reportTitle,
        content,
        format,
        period: `${variables.weekStart} - ${variables.weekEnd}`,
        includeSummary,
        createdById: userId,
        hrTimesheetId,
        reportType: "WEEKLY",
        templateId: template?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        HRTimesheet: {
          select: {
            id: true,
            weekStartDate: true,
            weekEndDate: true,
            employeeName: true,
          },
        },
        ReportTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/hr-timesheet");
    return report;
  });

/**
 * Consolider des rapports hebdomadaires en rapport mensuel
 */
export const consolidateMonthlyReport = authActionClient
  .schema(consolidateMonthlyReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const {
      userId: targetUserId,
      year,
      month,
      templateId,
      title,
      format,
      includeSummary,
    } = parsedInput;

    const finalUserId = targetUserId || userId;

    // Définir la période du mois
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    // Récupérer toutes les feuilles de temps du mois
    const timesheets = await prisma.hRTimesheet.findMany({
      where: {
        userId: finalUserId,
        weekStartDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        User_HRTimesheet_userIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        HRActivity: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
      orderBy: {
        weekStartDate: "asc",
      },
    });

    if (timesheets.length === 0) {
      throw new Error("Aucune feuille de temps trouvée pour ce mois");
    }

    // Récupérer le modèle mensuel
    let template = null;
    if (templateId) {
      template = await prisma.reportTemplate.findUnique({
        where: { id: templateId },
      });
    } else {
      template = await prisma.reportTemplate.findFirst({
        where: {
          frequency: "MONTHLY",
          isDefault: true,
          isActive: true,
        },
      });
    }

    // Calculer les statistiques mensuelles
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const totalActivities = timesheets.reduce((sum, ts) => sum + ts.HRActivity.length, 0);
    const weekCount = timesheets.length;

    // Regrouper toutes les activités
    const allActivities = timesheets.flatMap((ts) => ts.HRActivity);

    // Variables pour le template
    const monthName = formatDate(monthStart, "MMMM yyyy", { locale: fr });
    const employeeName = timesheets[0]?.employeeName || "Inconnu";
    const position = timesheets[0]?.position || "Inconnu";

    const variables = {
      employeeName,
      position,
      month: monthName,
      year: year.toString(),
      totalHours: totalHours.toString(),
      weekCount: weekCount.toString(),
      totalActivities: totalActivities.toString(),
      activities: formatActivitiesForReport(allActivities),
    };

    // Générer le contenu
    let content = "";

    if (template) {
      content = replaceTemplateVariables(template.templateContent, variables);
    } else {
      // Template par défaut
      content = `
        <h1>Rapport Mensuel - ${monthName}</h1>
        <h2>${employeeName} - ${position}</h2>

        <h3>Résumé du mois</h3>
        <ul>
          <li><strong>Nombre de semaines:</strong> ${weekCount}</li>
          <li><strong>Total des heures:</strong> ${totalHours}h</li>
          <li><strong>Nombre d'activités:</strong> ${totalActivities}</li>
          <li><strong>Moyenne par semaine:</strong> ${(totalHours / weekCount).toFixed(1)}h</li>
        </ul>

        <h3>Détail des activités</h3>
        ${variables.activities}
      `;
    }

    // Créer le rapport consolidé
    const reportTitle = title || `Rapport Mensuel - ${employeeName} - ${monthName}`;

    const report = await prisma.report.create({
      data: {
        id: nanoid(),
        title: reportTitle,
        content,
        format,
        period: monthName,
        includeSummary,
        createdById: userId,
        reportType: "MONTHLY",
        templateId: template?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ReportTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/reports");
    return report;
  });
