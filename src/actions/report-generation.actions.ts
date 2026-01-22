'use server'

import { authActionClient } from '@/lib/safe-action'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { format as formatDate, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  generateReportFromTimesheetSchema,
  consolidateMonthlyReportSchema,
} from '@/lib/validations/report-template'

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Remplacer les variables dans le template par les valeurs réelles
 */
function replaceTemplateVariables(templateContent: string, variables: Record<string, any>): string {
  let content = templateContent

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    content = content.replace(regex, String(value || ''))
  }

  return content
}

/**
 * Convertir les activités RH en format tableau pour le rapport
 */
function formatActivitiesForReport(activities: any[]): string {
  if (!activities || activities.length === 0) {
    return '<p>Aucune activité enregistrée pour cette période.</p>'
  }

  // Trier par type d'activité puis par nom
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.activityType !== b.activityType) {
      return a.activityType.localeCompare(b.activityType)
    }
    return a.activityName.localeCompare(b.activityName)
  })

  let html = `<table>
<thead>
<tr>
<th>Activité</th>
<th>Type</th>
<th>Périodicité</th>
<th>Heures</th>
<th>Statut</th>
</tr>
</thead>
<tbody>`

  for (const activity of sortedActivities) {
    const statusText = activity.status === 'COMPLETED' ? 'Terminée' : 'En cours'
    const periodText =
      activity.periodicity === 'WEEKLY'
        ? 'Hebdomadaire'
        : activity.periodicity === 'MONTHLY'
          ? 'Mensuel'
          : activity.periodicity === 'DAILY'
            ? 'Quotidien'
            : activity.periodicity === 'ONE_TIME'
              ? 'Ponctuel'
              : 'Non défini'

    html += `
<tr>
<td>${escapeHtml(activity.activityName)}</td>
<td>${escapeHtml(activity.activityType)}</td>
<td>${periodText}</td>
<td>${activity.totalHours}h</td>
<td>${statusText}</td>
</tr>`
  }

  html += `
</tbody>
</table>`

  return html
}

/**
 * Échapper les caractères HTML spéciaux
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Formater les statistiques en liste
 */
function formatStatistics(stats: {
  totalHours: number
  weekCount: number
  totalActivities: number
  completedActivities?: number
  averageHoursPerWeek?: number
}): string {
  const avgHours = stats.averageHoursPerWeek ?? stats.totalHours / stats.weekCount

  return `<ul>
<li><strong>Total des heures travaillées :</strong> ${stats.totalHours.toFixed(1)}h</li>
<li><strong>Nombre de semaines :</strong> ${stats.weekCount}</li>
<li><strong>Moyenne hebdomadaire :</strong> ${avgHours.toFixed(1)}h</li>
<li><strong>Nombre d'activités :</strong> ${stats.totalActivities}</li>
${stats.completedActivities !== undefined ? `<li><strong>Activités terminées :</strong> ${stats.completedActivities}</li>` : ''}
</ul>`
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
    const { userId } = ctx
    const { hrTimesheetId, templateId, title, format, includeSummary, customContent } = parsedInput

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
            startDate: 'asc',
          },
        },
      },
    })

    if (!timesheet) {
      throw new Error('Feuille de temps non trouvée')
    }

    // Vérifier que l'utilisateur a accès à cette feuille de temps
    if (timesheet.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (user?.role !== 'ADMIN' && user?.role !== 'HR' && user?.role !== 'MANAGER') {
        throw new Error("Vous n'avez pas la permission d'accéder à cette feuille de temps")
      }
    }

    // Récupérer le modèle (ou utiliser le modèle par défaut pour WEEKLY)
    let template = null
    if (templateId) {
      template = await prisma.reportTemplate.findUnique({
        where: { id: templateId },
      })
    } else {
      template = await prisma.reportTemplate.findFirst({
        where: {
          frequency: 'WEEKLY',
          isDefault: true,
          isActive: true,
        },
      })
    }

    // Variables pour le remplacement dans le template
    const variables = {
      employeeName: timesheet.employeeName,
      position: timesheet.position,
      site: timesheet.site,
      weekStart: formatDate(new Date(timesheet.weekStartDate), 'dd/MM/yyyy', { locale: fr }),
      weekEnd: formatDate(new Date(timesheet.weekEndDate), 'dd/MM/yyyy', { locale: fr }),
      totalHours: timesheet.totalHours.toString(),
      observations: timesheet.employeeObservations || 'Aucune observation',
      activities: formatActivitiesForReport(timesheet.HRActivity),
      activityCount: timesheet.HRActivity.length.toString(),
    }

    // Générer le contenu du rapport
    let content = ''

    if (template) {
      // Utiliser le template et remplacer les variables
      content = replaceTemplateVariables(template.templateContent, variables)
    } else {
      // Template par défaut professionnel
      const activityCount = timesheet.HRActivity.length
      const completedCount = timesheet.HRActivity.filter((a) => a.status === 'COMPLETED').length

      content = `<h1>Rapport Hebdomadaire</h1>
<h2>${escapeHtml(variables.employeeName)} — ${escapeHtml(variables.position)}</h2>

<h2>1. Informations générales</h2>
<ul>
<li><strong>Site :</strong> ${escapeHtml(variables.site)}</li>
<li><strong>Période :</strong> Du ${variables.weekStart} au ${variables.weekEnd}</li>
<li><strong>Total des heures :</strong> ${variables.totalHours}h</li>
<li><strong>Activités réalisées :</strong> ${activityCount} (${completedCount} terminée${completedCount > 1 ? 's' : ''})</li>
</ul>

<h2>2. Détail des activités</h2>
<p>Liste des activités réalisées durant cette semaine :</p>
${variables.activities}

<h2>3. Observations</h2>
<p>${escapeHtml(variables.observations)}</p>

<hr/>
<p><em>Rapport généré automatiquement depuis la feuille de temps hebdomadaire.</em></p>`
    }

    // Ajouter le contenu personnalisé si fourni
    if (customContent) {
      content += `\n\n<hr/>\n\n${customContent}`
    }

    // Générer le titre automatique si non fourni
    const reportTitle =
      title ||
      `Rapport Hebdomadaire - ${variables.employeeName} - Semaine du ${variables.weekStart}`

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
        reportType: 'WEEKLY',
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
    })

    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/hr-timesheet')
    return report
  })

/**
 * Consolider des rapports hebdomadaires en rapport mensuel
 */
export const consolidateMonthlyReport = authActionClient
  .schema(consolidateMonthlyReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const {
      userId: targetUserId,
      year,
      month,
      templateId,
      title,
      format,
      includeSummary,
    } = parsedInput

    // Vérifier le rôle de l'utilisateur
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    const isPrivilegedUser = ['ADMIN', 'HR', 'MANAGER', 'DIRECTEUR'].includes(
      currentUser?.role || '',
    )

    // Si admin/manager et pas de userId spécifié, récupérer toutes les feuilles de temps
    // Sinon, filtrer par l'utilisateur cible ou l'utilisateur connecté
    const finalUserId = targetUserId || (isPrivilegedUser ? undefined : userId)

    // Définir la période du mois
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))

    // Récupérer toutes les feuilles de temps du mois
    const timesheets = await prisma.hRTimesheet.findMany({
      where: {
        ...(finalUserId && { userId: finalUserId }),
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
            startDate: 'asc',
          },
        },
      },
      orderBy: {
        weekStartDate: 'asc',
      },
    })

    if (timesheets.length === 0) {
      throw new Error('Aucune feuille de temps trouvée pour ce mois')
    }

    // Récupérer le modèle mensuel
    let template = null
    if (templateId) {
      template = await prisma.reportTemplate.findUnique({
        where: { id: templateId },
      })
    } else {
      template = await prisma.reportTemplate.findFirst({
        where: {
          frequency: 'MONTHLY',
          isDefault: true,
          isActive: true,
        },
      })
    }

    // Calculer les statistiques mensuelles
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0)
    const totalActivities = timesheets.reduce((sum, ts) => sum + ts.HRActivity.length, 0)
    const weekCount = timesheets.length

    // Regrouper toutes les activités
    const allActivities = timesheets.flatMap((ts) => ts.HRActivity)

    // Variables pour le template
    const monthName = formatDate(monthStart, 'MMMM yyyy', { locale: fr })

    // Déterminer si c'est un rapport multi-employés ou mono-employé
    const uniqueEmployees = [...new Set(timesheets.map((ts) => ts.userId))]
    const isMultiEmployee = uniqueEmployees.length > 1

    const employeeName = isMultiEmployee
      ? `Équipe (${uniqueEmployees.length} collaborateurs)`
      : timesheets[0]?.employeeName || 'Inconnu'
    const position = isMultiEmployee ? 'Rapport consolidé' : timesheets[0]?.position || 'Inconnu'

    const variables = {
      employeeName,
      position,
      month: monthName,
      year: year.toString(),
      totalHours: totalHours.toString(),
      weekCount: weekCount.toString(),
      totalActivities: totalActivities.toString(),
      activities: formatActivitiesForReport(allActivities),
    }

    // Compter les activités terminées
    const completedActivities = allActivities.filter((a) => a.status === 'COMPLETED').length

    // Grouper les activités par type pour les statistiques
    const activityByType: Record<string, { count: number; hours: number }> = {}
    for (const activity of allActivities) {
      const type = activity.activityType || 'Autre'
      if (!activityByType[type]) {
        activityByType[type] = { count: 0, hours: 0 }
      }
      activityByType[type].count++
      activityByType[type].hours += activity.totalHours
    }

    // Générer le tableau récapitulatif par type
    let typesSummaryTable = `<table>
<thead>
<tr>
<th>Type d'activité</th>
<th>Nombre</th>
<th>Heures totales</th>
</tr>
</thead>
<tbody>`

    for (const [type, data] of Object.entries(activityByType).sort(
      (a, b) => b[1].hours - a[1].hours,
    )) {
      typesSummaryTable += `
<tr>
<td>${escapeHtml(type)}</td>
<td>${data.count}</td>
<td>${data.hours.toFixed(1)}h</td>
</tr>`
    }

    typesSummaryTable += `
</tbody>
</table>`

    // Générer le tableau récapitulatif par employé (si multi-employés)
    let employeeSummaryTable = ''
    if (isMultiEmployee) {
      const employeeStats: Record<string, { name: string; hours: number; activities: number }> = {}
      for (const ts of timesheets) {
        if (!employeeStats[ts.userId]) {
          employeeStats[ts.userId] = { name: ts.employeeName, hours: 0, activities: 0 }
        }
        employeeStats[ts.userId].hours += ts.totalHours
        employeeStats[ts.userId].activities += ts.HRActivity.length
      }

      employeeSummaryTable = `<table>
<thead>
<tr>
<th>Collaborateur</th>
<th>Heures</th>
<th>Activités</th>
</tr>
</thead>
<tbody>`

      for (const [, data] of Object.entries(employeeStats).sort(
        (a, b) => b[1].hours - a[1].hours,
      )) {
        employeeSummaryTable += `
<tr>
<td>${escapeHtml(data.name)}</td>
<td>${data.hours.toFixed(1)}h</td>
<td>${data.activities}</td>
</tr>`
      }

      employeeSummaryTable += `
</tbody>
</table>`
    }

    // Générer le contenu
    let content = ''

    if (template) {
      content = replaceTemplateVariables(template.templateContent, variables)
    } else {
      // Template par défaut professionnel
      const headerSection = isMultiEmployee
        ? `<h1>Rapport Mensuel Consolidé</h1>
<h2>${monthName}</h2>
<p><strong>${uniqueEmployees.length} collaborateurs</strong> — ${weekCount} feuilles de temps</p>`
        : `<h1>Rapport Mensuel</h1>
<h2>${escapeHtml(employeeName)} — ${escapeHtml(position)}</h2>`

      const employeeSection = isMultiEmployee
        ? `<h2>2. Répartition par collaborateur</h2>
<p>Contribution de chaque membre de l'équipe :</p>
${employeeSummaryTable}

<h2>3. Répartition par type d'activité</h2>`
        : `<h2>2. Répartition par type d'activité</h2>`

      const activitiesSection = isMultiEmployee ? '4' : '3'
      const observationsSection = isMultiEmployee ? '5' : '4'

      content = `${headerSection}

<h2>1. Résumé exécutif</h2>
<p>Ce rapport présente la synthèse des activités réalisées durant le mois de <strong>${monthName}</strong>.</p>

${formatStatistics({
  totalHours,
  weekCount,
  totalActivities,
  completedActivities,
  averageHoursPerWeek: totalHours / weekCount,
})}

${employeeSection}
<p>Le tableau ci-dessous présente la répartition des heures par catégorie d'activité :</p>
${typesSummaryTable}

<h2>${activitiesSection}. Détail des activités</h2>
<p>Liste exhaustive des ${totalActivities} activités réalisées durant cette période :</p>
${variables.activities}

<hr/>

<h2>${observationsSection}. Observations</h2>
<p>Ce rapport a été généré automatiquement à partir des feuilles de temps hebdomadaires.
Les données présentées couvrent ${weekCount} feuille${weekCount > 1 ? 's' : ''} de temps.</p>`
    }

    // Créer le rapport consolidé
    const reportTitle =
      title ||
      (isMultiEmployee
        ? `Rapport Mensuel Consolidé - ${monthName}`
        : `Rapport Mensuel - ${employeeName} - ${monthName}`)

    const report = await prisma.report.create({
      data: {
        id: nanoid(),
        title: reportTitle,
        content,
        format,
        period: monthName,
        includeSummary,
        createdById: userId,
        reportType: 'MONTHLY',
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
    })

    revalidatePath('/dashboard/reports')
    return report
  })
