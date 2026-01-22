/**
 * Example usage of ReportCalendarView component
 *
 * This file demonstrates how to use the ReportCalendarView component
 * in a page with all features including edit and delete actions.
 */

'use client'

import { useState } from 'react'
import { ReportCalendarView } from './report-calendar-view'
import type { Report } from '@/types/report.types'

export function ReportCalendarViewExample() {
  const [reports] = useState<Report[]>([
    {
      id: '1',
      title: 'Rapport hebdomadaire - Semaine 3',
      content: 'Contenu du rapport...',
      format: 'pdf',
      period: 'Semaine 3 - Janvier 2026',
      includeSummary: true,
      fileSize: 1024000,
      reportType: 'WEEKLY',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      createdById: 'user1',
      templateId: 'template1',
      hrTimesheetId: null,
      User: {
        id: 'user1',
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
      },
      ReportTemplate: {
        id: 'template1',
        name: 'Template Hebdomadaire',
      },
      ReportRecipient: [],
    },
    {
      id: '2',
      title: 'Rapport mensuel - Décembre 2025',
      content: 'Contenu du rapport...',
      format: 'excel',
      period: 'Décembre 2025',
      includeSummary: true,
      fileSize: 2048000,
      reportType: 'MONTHLY',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      createdById: 'user2',
      templateId: 'template2',
      hrTimesheetId: null,
      User: {
        id: 'user2',
        name: 'Marie Martin',
        email: 'marie.martin@example.com',
      },
      ReportTemplate: {
        id: 'template2',
        name: 'Template Mensuel',
      },
      ReportRecipient: [],
    },
    {
      id: '3',
      title: 'Rapport individuel - Projet Alpha',
      content: 'Contenu du rapport...',
      format: 'word',
      period: null,
      includeSummary: false,
      fileSize: 512000,
      reportType: 'INDIVIDUAL',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      createdById: 'user1',
      templateId: null,
      hrTimesheetId: 'timesheet1',
      User: {
        id: 'user1',
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
      },
      HRTimesheet: {
        id: 'timesheet1',
        weekStartDate: new Date('2026-01-13'),
        weekEndDate: new Date('2026-01-19'),
        employeeName: 'Jean Dupont',
      },
      ReportRecipient: [],
    },
  ])

  const handleReportClick = (report: Report) => {
    console.log('View report:', report)
    // Open report preview dialog or navigate to detail page
  }

  const handleReportEdit = (report: Report) => {
    console.log('Edit report:', report)
    // Open edit dialog or navigate to edit page
  }

  const handleReportDelete = (report: Report) => {
    console.log('Delete report:', report)
    // Show confirmation dialog and delete
  }

  return (
    <div className="container py-6">
      <ReportCalendarView
        reports={reports}
        onReportClick={handleReportClick}
        onReportEdit={handleReportEdit}
        onReportDelete={handleReportDelete}
      />
    </div>
  )
}

/**
 * Usage in a page component:
 *
 * ```tsx
 * import { ReportCalendarView } from "@/components/features/reports/report-calendar-view";
 *
 * export default function ReportsPage() {
 *   const reports = await getReports(); // Fetch from API
 *
 *   return (
 *     <ReportCalendarView
 *       reports={reports}
 *       onReportClick={(report) => router.push(`/reports/${report.id}`)}
 *       onReportEdit={(report) => setEditingReport(report)}
 *       onReportDelete={(report) => handleDelete(report.id)}
 *     />
 *   );
 * }
 * ```
 *
 * Features:
 * - Monthly calendar grid (desktop)
 * - List view (mobile)
 * - Report count badges per day
 * - Hover preview with mini report details
 * - Click to expand day with full report list
 * - Color-coded by type (Weekly=green, Monthly=purple, Individual=orange)
 * - Format icons (PDF/Word/Excel)
 * - Month/Year navigation with dropdowns
 * - Previous/Next month buttons
 * - Today button
 * - Edit and Delete actions via dropdown menu
 * - Responsive design (breakpoint: 768px)
 */
