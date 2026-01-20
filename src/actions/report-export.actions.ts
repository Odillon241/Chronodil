'use server'

import { authActionClient } from '@/lib/safe-action'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { exportReportSchema } from '@/lib/validations/report-template'

// ============================================
// EXPORT ACTIONS
// ============================================

/**
 * Exporter un rapport dans le format spécifié
 */
export const exportReport = authActionClient
  .schema(exportReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { reportId, format } = parsedInput

    // Récupérer le rapport
    const report = await prisma.report.findUnique({
      where: { id: reportId },
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
      },
    })

    if (!report) {
      throw new Error('Rapport non trouvé')
    }

    // Vérifier les permissions
    if (report.createdById !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (user?.role !== 'ADMIN' && user?.role !== 'HR' && user?.role !== 'MANAGER') {
        throw new Error("Vous n'avez pas la permission d'exporter ce rapport")
      }
    }

    // Préparer les données pour l'export
    const reportData = {
      title: report.title,
      content: report.content,
      period: report.period || undefined,
      author: report.User.name || report.User.email,
      createdAt: report.createdAt,
      metadata: {
        format: report.format,
        includeSummary: report.includeSummary,
        reportType: report.reportType,
      },
    }

    // Générer le fichier selon le format
    let buffer: Buffer
    let filename: string
    let mimeType: string

    switch (format) {
      case 'word': {
        const { exportToWord } = await import('@/lib/export/word-export')
        buffer = await exportToWord(reportData)
        filename = `${report.title}.docx`
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      }

      case 'excel': {
        const { exportToExcel } = await import('@/lib/export/excel-export')
        buffer = await exportToExcel(reportData)
        filename = `${report.title}.xlsx`
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      }

      case 'pdf': {
        // TODO: L'export PDF nécessite une configuration supplémentaire pour Next.js
        // Pour l'activer, consultez RAPPORT_IMPLEMENTATION.md
        throw new Error(
          "L'export PDF sera disponible prochainement. Utilisez Word ou Excel pour l'instant.",
        )
        // const { exportToPDF } = await import("@/lib/export/pdf-export");
        // buffer = await exportToPDF(reportData);
        // filename = `${report.title}.pdf`;
        // mimeType = "application/pdf";
        // break;
      }

      default:
        throw new Error(`Format d'export non supporté: ${format}`)
    }

    // Convertir le buffer en base64 pour le transfert
    const base64 = buffer.toString('base64')

    return {
      filename,
      mimeType,
      data: base64,
      size: buffer.length,
    }
  })

/**
 * Exporter plusieurs rapports en un seul fichier
 */
export const exportMultipleReports = authActionClient
  .schema(
    z.object({
      reportIds: z.array(z.string()).min(1, 'Au moins un rapport requis'),
      format: z.enum(['word', 'excel', 'pdf']),
      filename: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { reportIds, format, filename } = parsedInput

    // Récupérer tous les rapports
    const reports = await prisma.report.findMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (reports.length === 0) {
      throw new Error('Aucun rapport trouvé')
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    const hasAccess = reports.every(
      (report) =>
        report.createdById === userId ||
        user?.role === 'ADMIN' ||
        user?.role === 'HR' ||
        user?.role === 'MANAGER',
    )

    if (!hasAccess) {
      throw new Error("Vous n'avez pas la permission d'exporter certains rapports")
    }

    // Préparer les données pour l'export
    const reportsData = reports.map((report) => ({
      title: report.title,
      content: report.content,
      period: report.period || undefined,
      author: report.User.name || report.User.email,
      createdAt: report.createdAt,
    }))

    // Générer le fichier selon le format
    let buffer: Buffer
    let exportFilename: string
    let mimeType: string

    const defaultFilename = `Rapports_${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'word':
        // Import dynamique pour éviter les problèmes de bundling
        const { exportMultipleReportsToWord } = await import('@/lib/export/word-export')
        buffer = await exportMultipleReportsToWord(reportsData)
        exportFilename = `${filename || defaultFilename}.docx`
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break

      case 'excel':
        const { exportMultipleReportsToExcel } = await import('@/lib/export/excel-export')
        buffer = await exportMultipleReportsToExcel(reportsData)
        exportFilename = `${filename || defaultFilename}.xlsx`
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      case 'pdf':
        throw new Error(
          "L'export PDF sera disponible prochainement. Utilisez Word ou Excel pour l'instant.",
        )
      // const { exportMultipleReportsToPDF } = await import("@/lib/export/pdf-export");
      // buffer = await exportMultipleReportsToPDF(reportsData);
      // exportFilename = `${filename || defaultFilename}.pdf`;
      // mimeType = "application/pdf";
      // break;

      default:
        throw new Error(`Format d'export non supporté: ${format}`)
    }

    // Convertir le buffer en base64
    const base64 = buffer.toString('base64')

    return {
      filename: exportFilename,
      mimeType,
      data: base64,
      size: buffer.length,
      reportCount: reports.length,
    }
  })

/**
 * Exporter un rapport directement depuis une feuille de temps
 */
export const exportTimesheetAsReport = authActionClient
  .schema(
    z.object({
      hrTimesheetId: z.string(),
      format: z.enum(['word', 'excel', 'pdf']),
      templateId: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { hrTimesheetId, format } = parsedInput

    // Récupérer la feuille de temps
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

    // Vérifier les permissions
    if (timesheet.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (user?.role !== 'ADMIN' && user?.role !== 'HR' && user?.role !== 'MANAGER') {
        throw new Error("Vous n'avez pas la permission d'exporter cette feuille de temps")
      }
    }

    // Générer le rapport (utilise generateReportFromTimesheet en interne)
    const { generateReportFromTimesheet: _generateReportFromTimesheet } =
      await import('./report-generation.actions')

    // Cette fonction est une action, donc on doit l'appeler directement
    // Pour simplifier, on va créer le rapport directement ici
    const reportData = {
      title: `Rapport Hebdomadaire - ${timesheet.employeeName}`,
      content: `<h1>Rapport de la semaine</h1>
        <p><strong>Employé:</strong> ${timesheet.employeeName}</p>
        <p><strong>Poste:</strong> ${timesheet.position}</p>
        <p><strong>Site:</strong> ${timesheet.site}</p>
        <p><strong>Total heures:</strong> ${timesheet.totalHours}h</p>

        <h2>Activités</h2>
        <table>
          <thead>
            <tr>
              <th>Activité</th>
              <th>Type</th>
              <th>Heures</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${timesheet.HRActivity.map(
              (activity) => `
              <tr>
                <td>${activity.activityName}</td>
                <td>${activity.activityType}</td>
                <td>${activity.totalHours}h</td>
                <td>${activity.status === 'COMPLETED' ? 'Terminée' : 'En cours'}</td>
              </tr>
            `,
            ).join('')}
          </tbody>
        </table>`,
      period: `${new Date(timesheet.weekStartDate).toLocaleDateString('fr-FR')} - ${new Date(
        timesheet.weekEndDate,
      ).toLocaleDateString('fr-FR')}`,
      author: timesheet.User_HRTimesheet_userIdToUser.name || timesheet.employeeName,
      createdAt: new Date(),
      activities: timesheet.HRActivity.map((activity) => ({
        name: activity.activityName,
        type: activity.activityType,
        periodicity: activity.periodicity,
        hours: activity.totalHours,
        status: activity.status === 'COMPLETED' ? 'Terminée' : 'En cours',
      })),
    }

    // Générer le fichier
    let buffer: Buffer
    let filename: string
    let mimeType: string

    switch (format) {
      case 'word': {
        const { exportToWord } = await import('@/lib/export/word-export')
        buffer = await exportToWord(reportData)
        filename = `Rapport_${timesheet.employeeName}_${new Date().toISOString().split('T')[0]}.docx`
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      }

      case 'excel': {
        const { exportToExcel } = await import('@/lib/export/excel-export')
        buffer = await exportToExcel(reportData)
        filename = `Rapport_${timesheet.employeeName}_${new Date().toISOString().split('T')[0]}.xlsx`
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      }

      case 'pdf': {
        throw new Error(
          "L'export PDF sera disponible prochainement. Utilisez Word ou Excel pour l'instant.",
        )
        // const { exportToPDF } = await import("@/lib/export/pdf-export");
        // buffer = await exportToPDF(reportData);
        // filename = `Rapport_${timesheet.employeeName}_${new Date().toISOString().split("T")[0]}.pdf`;
        // mimeType = "application/pdf";
        // break;
      }

      default:
        throw new Error(`Format d'export non supporté: ${format}`)
    }

    const base64 = buffer.toString('base64')

    return {
      filename,
      mimeType,
      data: base64,
      size: buffer.length,
    }
  })
