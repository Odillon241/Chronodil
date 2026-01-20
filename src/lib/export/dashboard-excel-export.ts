import ExcelJS from 'exceljs'
import type { DashboardReportData } from '@/actions/dashboard-report.actions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ============================================
// STYLES
// ============================================

const COLORS = {
  primary: '1E3A5F',
  secondary: '4A90A4',
  accent: '8BC34A',
  warning: 'FFC107',
  danger: 'E53935',
  gray: '6B7280',
  lightGray: 'F3F4F6',
  white: 'FFFFFF',
}

const headerStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.primary}` } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
  },
}

const dataStyle: Partial<ExcelJS.Style> = {
  font: { size: 10 },
  alignment: { vertical: 'middle' },
  border: {
    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
  },
}

const titleStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 16, color: { argb: `FF${COLORS.primary}` } },
  alignment: { horizontal: 'center', vertical: 'middle' },
}

const subtitleStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 12, color: { argb: `FF${COLORS.secondary}` } },
  alignment: { vertical: 'middle' },
}

// ============================================
// HELPERS
// ============================================

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle })
  })
  row.height = 25
}

function applyDataRowStyle(row: ExcelJS.Row, isAlternate: boolean = false) {
  row.eachCell((cell) => {
    cell.style = {
      ...dataStyle,
      fill: isAlternate
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.lightGray}` } }
        : undefined,
    }
  })
}

function formatVariation(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// ============================================
// FEUILLES DU CLASSEUR
// ============================================

/**
 * Créer la feuille de synthèse
 */
function createSummarySheet(workbook: ExcelJS.Workbook, data: DashboardReportData) {
  const sheet = workbook.addWorksheet('Synthèse', {
    properties: { tabColor: { argb: `FF${COLORS.primary}` } },
  })

  // En-tête
  sheet.mergeCells('A1:E1')
  sheet.getCell('A1').value = data.title
  sheet.getCell('A1').style = titleStyle
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:E2')
  sheet.getCell('A2').value = data.subtitle
  sheet.getCell('A2').style = {
    font: { size: 12, italic: true, color: { argb: `FF${COLORS.gray}` } },
  }

  sheet.mergeCells('A3:E3')
  sheet.getCell('A3').value =
    `Généré le ${format(data.generatedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })} par ${data.author}`
  sheet.getCell('A3').style = { font: { size: 10, color: { argb: `FF${COLORS.gray}` } } }

  // Section KPI
  let rowNum = 5
  sheet.getCell(`A${rowNum}`).value = 'Indicateurs Clés'
  sheet.getCell(`A${rowNum}`).style = subtitleStyle
  sheet.mergeCells(`A${rowNum}:B${rowNum}`)
  rowNum++

  const kpiData = [
    ['Projets actifs', data.currentStats.activeProjects, data.evolution?.projectsChange],
    ['Tâches en cours', data.currentStats.ongoingTasks, data.evolution?.tasksChange],
    ['Tâches terminées', data.currentStats.completedTasks, null],
    ['Heures totales', `${data.currentStats.totalHours}h`, data.evolution?.hoursChange],
    [
      'Taux de complétion',
      `${data.currentStats.taskCompletionRate.toFixed(1)}%`,
      data.evolution?.completionRateChange,
    ],
    ['Utilisateurs', data.currentStats.usersCount, null],
    ['Moyenne heures/utilisateur', `${data.currentStats.averageHoursPerUser.toFixed(1)}h`, null],
  ]

  // En-tête tableau
  sheet.getRow(rowNum).values = ['Indicateur', 'Valeur', 'Évolution']
  applyHeaderStyle(sheet.getRow(rowNum))
  rowNum++

  kpiData.forEach((row, index) => {
    sheet.getRow(rowNum).values = [
      row[0],
      row[1],
      row[2] !== null && row[2] !== undefined ? formatVariation(row[2] as number) : 'N/A',
    ]
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)
    rowNum++
  })

  // Section Insights
  rowNum += 2
  sheet.getCell(`A${rowNum}`).value = 'Insights'
  sheet.getCell(`A${rowNum}`).style = subtitleStyle
  rowNum++

  data.insights.forEach((insight) => {
    sheet.getCell(`A${rowNum}`).value = `• ${insight}`
    sheet.mergeCells(`A${rowNum}:E${rowNum}`)
    rowNum++
  })

  // Section Recommandations
  rowNum += 2
  sheet.getCell(`A${rowNum}`).value = 'Recommandations'
  sheet.getCell(`A${rowNum}`).style = subtitleStyle
  rowNum++

  data.recommendations.forEach((rec) => {
    sheet.getCell(`A${rowNum}`).value = `• ${rec}`
    sheet.mergeCells(`A${rowNum}:E${rowNum}`)
    rowNum++
  })

  // Ajuster les largeurs
  sheet.columns = [{ width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }]
}

/**
 * Créer la feuille d'activité mensuelle
 */
function createMonthlyActivitySheet(workbook: ExcelJS.Workbook, data: DashboardReportData) {
  const sheet = workbook.addWorksheet('Activité Mensuelle', {
    properties: { tabColor: { argb: `FF${COLORS.secondary}` } },
  })

  sheet.mergeCells('A1:D1')
  sheet.getCell('A1').value = 'Activité Mensuelle'
  sheet.getCell('A1').style = titleStyle
  sheet.getRow(1).height = 30

  // En-tête tableau
  sheet.getRow(3).values = ['Mois', 'Heures']
  applyHeaderStyle(sheet.getRow(3))

  data.monthlyActivity.forEach((month, index) => {
    const rowNum = 4 + index
    sheet.getRow(rowNum).values = [month.month, month.hours]
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)
  })

  // Graphique (si possible)
  // Note: ExcelJS peut ajouter des graphiques mais c'est complexe

  sheet.columns = [{ width: 20 }, { width: 15 }]
}

/**
 * Créer la feuille de performance projets
 */
function createProjectPerformanceSheet(workbook: ExcelJS.Workbook, data: DashboardReportData) {
  const sheet = workbook.addWorksheet('Projets', {
    properties: { tabColor: { argb: `FF${COLORS.accent}` } },
  })

  sheet.mergeCells('A1:F1')
  sheet.getCell('A1').value = 'Performance des Projets'
  sheet.getCell('A1').style = titleStyle
  sheet.getRow(1).height = 30

  // En-tête tableau
  sheet.getRow(3).values = ['Projet', 'Tâches', 'Terminées', 'Taux (%)', 'Heures', 'Statut']
  applyHeaderStyle(sheet.getRow(3))

  data.projectPerformance.forEach((project, index) => {
    const rowNum = 4 + index
    sheet.getRow(rowNum).values = [
      project.name,
      project.totalTasks,
      project.completedTasks,
      project.completionRate.toFixed(1),
      project.totalHours,
      project.status,
    ]
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)

    // Colorer le taux de complétion
    const completionCell = sheet.getCell(`D${rowNum}`)
    if (project.completionRate >= 80) {
      completionCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${COLORS.accent}` },
      }
    } else if (project.completionRate < 30) {
      completionCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${COLORS.danger}` },
      }
      completionCell.font = { color: { argb: 'FFFFFFFF' } }
    }
  })

  sheet.columns = [
    { width: 35 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ]
}

/**
 * Créer la feuille de performance utilisateurs
 */
function createUserPerformanceSheet(workbook: ExcelJS.Workbook, data: DashboardReportData) {
  const sheet = workbook.addWorksheet('Équipe', {
    properties: { tabColor: { argb: `FF${COLORS.warning}` } },
  })

  sheet.mergeCells('A1:E1')
  sheet.getCell('A1').value = "Performance de l'Équipe"
  sheet.getCell('A1').style = titleStyle
  sheet.getRow(1).height = 30

  // En-tête tableau
  sheet.getRow(3).values = ['Collaborateur', 'Rôle', 'Tâches', 'Heures']
  applyHeaderStyle(sheet.getRow(3))

  data.userPerformance.forEach((user, index) => {
    const rowNum = 4 + index
    sheet.getRow(rowNum).values = [user.name, user.role, user.tasksCompleted, user.totalHours]
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)
  })

  sheet.columns = [{ width: 25 }, { width: 15 }, { width: 12 }, { width: 12 }]
}

/**
 * Créer la feuille de distribution des tâches
 */
function createTaskDistributionSheet(workbook: ExcelJS.Workbook, data: DashboardReportData) {
  const sheet = workbook.addWorksheet('Distribution', {
    properties: { tabColor: { argb: `FF${COLORS.danger}` } },
  })

  sheet.mergeCells('A1:C1')
  sheet.getCell('A1').value = 'Distribution des Tâches'
  sheet.getCell('A1').style = titleStyle
  sheet.getRow(1).height = 30

  // Par statut
  sheet.getCell('A3').value = 'Par Statut'
  sheet.getCell('A3').style = subtitleStyle

  sheet.getRow(4).values = ['Statut', 'Nombre', 'Pourcentage']
  applyHeaderStyle(sheet.getRow(4))

  const totalStatus =
    data.taskDistribution.todo +
    data.taskDistribution.inProgress +
    data.taskDistribution.done +
    data.taskDistribution.blocked

  const statusData = [
    ['À faire', data.taskDistribution.todo],
    ['En cours', data.taskDistribution.inProgress],
    ['Terminées', data.taskDistribution.done],
    ['Bloquées', data.taskDistribution.blocked],
  ]

  statusData.forEach((row, index) => {
    const rowNum = 5 + index
    const count = row[1] as number
    sheet.getRow(rowNum).values = [
      row[0],
      count,
      totalStatus > 0 ? `${((count / totalStatus) * 100).toFixed(1)}%` : '0%',
    ]
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)
  })

  // Par priorité
  sheet.getCell('A11').value = 'Par Priorité'
  sheet.getCell('A11').style = subtitleStyle

  sheet.getRow(12).values = ['Priorité', 'Nombre', 'Pourcentage']
  applyHeaderStyle(sheet.getRow(12))

  const totalPriority =
    data.priorityDistribution.low +
    data.priorityDistribution.medium +
    data.priorityDistribution.high +
    data.priorityDistribution.urgent

  const priorityData = [
    ['Basse', data.priorityDistribution.low],
    ['Moyenne', data.priorityDistribution.medium],
    ['Haute', data.priorityDistribution.high],
    ['Urgente', data.priorityDistribution.urgent],
  ]

  priorityData.forEach((row, index) => {
    const rowNum = 13 + index
    const count = row[1] as number
    sheet.getRow(rowNum).values = [
      row[0],
      count,
      totalPriority > 0 ? `${((count / totalPriority) * 100).toFixed(1)}%` : '0%',
    ]
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)
  })

  sheet.columns = [{ width: 20 }, { width: 12 }, { width: 15 }]
}

/**
 * Créer la feuille comparative (si données disponibles)
 */
function createComparisonSheet(workbook: ExcelJS.Workbook, data: DashboardReportData) {
  if (!data.previousStats || !data.evolution) {
    return
  }

  const sheet = workbook.addWorksheet('Comparaison', {
    properties: { tabColor: { argb: `FF${COLORS.gray}` } },
  })

  sheet.mergeCells('A1:E1')
  sheet.getCell('A1').value = 'Analyse Comparative'
  sheet.getCell('A1').style = titleStyle
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:E2')
  sheet.getCell('A2').value =
    `${data.previousPeriod?.label || 'Période précédente'} vs ${data.period.label}`
  sheet.getCell('A2').style = { font: { italic: true, color: { argb: `FF${COLORS.gray}` } } }

  // En-tête tableau
  sheet.getRow(4).values = [
    'Indicateur',
    data.previousPeriod?.label || 'Précédent',
    data.period.label,
    'Évolution',
  ]
  applyHeaderStyle(sheet.getRow(4))

  const comparisonData = [
    [
      'Projets actifs',
      data.previousStats.activeProjects,
      data.currentStats.activeProjects,
      formatVariation(data.evolution.projectsChange),
    ],
    [
      'Tâches en cours',
      data.previousStats.ongoingTasks,
      data.currentStats.ongoingTasks,
      formatVariation(data.evolution.tasksChange),
    ],
    ['Tâches terminées', data.previousStats.completedTasks, data.currentStats.completedTasks, '-'],
    [
      'Heures travaillées',
      `${data.previousStats.totalHours}h`,
      `${data.currentStats.totalHours}h`,
      formatVariation(data.evolution.hoursChange),
    ],
    [
      'Taux de complétion',
      `${data.previousStats.taskCompletionRate.toFixed(1)}%`,
      `${data.currentStats.taskCompletionRate.toFixed(1)}%`,
      `${data.evolution.completionRateChange >= 0 ? '+' : ''}${data.evolution.completionRateChange.toFixed(1)} pts`,
    ],
  ]

  comparisonData.forEach((row, index) => {
    const rowNum = 5 + index
    sheet.getRow(rowNum).values = row
    applyDataRowStyle(sheet.getRow(rowNum), index % 2 === 1)

    // Colorer l'évolution
    const evolutionCell = sheet.getCell(`D${rowNum}`)
    const evolutionValue = row[3] as string
    if (evolutionValue.startsWith('+')) {
      evolutionCell.font = { color: { argb: `FF${COLORS.accent}` }, bold: true }
    } else if (evolutionValue.startsWith('-')) {
      evolutionCell.font = { color: { argb: `FF${COLORS.danger}` }, bold: true }
    }
  })

  sheet.columns = [{ width: 25 }, { width: 18 }, { width: 18 }, { width: 15 }]
}

// ============================================
// FONCTION PRINCIPALE D'EXPORT
// ============================================

/**
 * Exporter les données du dashboard en fichier Excel
 */
export async function exportDashboardReportToExcel(data: DashboardReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = data.author
  workbook.created = data.generatedAt
  workbook.title = data.title
  workbook.subject = `Rapport d'activité - ${data.period.label}`
  workbook.company = data.companyName

  // Créer les feuilles
  createSummarySheet(workbook, data)
  createMonthlyActivitySheet(workbook, data)
  createProjectPerformanceSheet(workbook, data)
  createUserPerformanceSheet(workbook, data)
  createTaskDistributionSheet(workbook, data)
  createComparisonSheet(workbook, data)

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
