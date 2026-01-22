import ExcelJS from 'exceljs'
import { convert } from 'html-to-text'
import type { ReportData } from './types'

// ============================================
// CONFIGURATION & STYLES
// ============================================

const COLORS = {
  primary: '2563EB', // Blue-600
  primaryLight: 'DBEAFE', // Blue-100
  headerBg: '1E3A8A', // Blue-900
  headerText: 'FFFFFF', // White
  altRowBg: 'F1F5F9', // Slate-100
  border: 'CBD5E1', // Slate-300
  text: '1E293B', // Slate-800
  textLight: '64748B', // Slate-500
}

const FONTS = {
  title: { name: 'Calibri', size: 18, bold: true },
  subtitle: { name: 'Calibri', size: 14, bold: true },
  header: { name: 'Calibri', size: 11, bold: true },
  body: { name: 'Calibri', size: 11 },
  small: { name: 'Calibri', size: 10, italic: true },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Appliquer un style de titre à une cellule
 */
function applyTitleStyle(cell: ExcelJS.Cell, merged: boolean = false): void {
  cell.font = { ...FONTS.title, color: { argb: `FF${COLORS.text}` } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  if (!merged) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${COLORS.primaryLight}` },
    }
  }
}

/**
 * Appliquer un style d'en-tête de tableau
 */
function applyHeaderStyle(cell: ExcelJS.Cell): void {
  cell.font = { ...FONTS.header, color: { argb: `FF${COLORS.headerText}` } }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${COLORS.headerBg}` },
  }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border = {
    top: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
    left: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
    bottom: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
    right: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
  }
}

/**
 * Appliquer un style de cellule de données
 */
function applyDataCellStyle(cell: ExcelJS.Cell, isAltRow: boolean = false): void {
  cell.font = { ...FONTS.body, color: { argb: `FF${COLORS.text}` } }
  cell.alignment = { vertical: 'middle', wrapText: true }
  if (isAltRow) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${COLORS.altRowBg}` },
    }
  }
  cell.border = {
    top: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
    left: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
    bottom: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
    right: { style: 'thin', color: { argb: `FF${COLORS.border}` } },
  }
}

/**
 * Appliquer un style de métadonnées
 */
function applyMetadataStyle(labelCell: ExcelJS.Cell, valueCell: ExcelJS.Cell): void {
  labelCell.font = { ...FONTS.body, bold: true, color: { argb: `FF${COLORS.text}` } }
  labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
  valueCell.font = { ...FONTS.body, color: { argb: `FF${COLORS.text}` } }
  valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
}

/**
 * Extraire les données tabulaires depuis le HTML
 */
function extractTablesFromHTML(html: string): Array<{
  headers: string[]
  rows: string[][]
}> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = []

  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  const matches = html.matchAll(tableRegex)

  for (const match of matches) {
    const tableHTML = match[1]

    // Extraire les en-têtes
    const headerMatch = tableHTML.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i)
    const headers: string[] = []

    if (headerMatch) {
      const thMatches = headerMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)
      for (const th of thMatches) {
        const text = th[1].replace(/<[^>]+>/g, '').trim()
        headers.push(text)
      }
    }

    // Extraire les lignes
    const rows: string[][] = []
    const tbodyMatch = tableHTML.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
    const bodyContent = tbodyMatch ? tbodyMatch[1] : tableHTML

    const trMatches = bodyContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)

    for (const tr of trMatches) {
      const row: string[] = []
      const tdMatches = tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)

      for (const td of tdMatches) {
        const text = td[1].replace(/<[^>]+>/g, '').trim()
        row.push(text)
      }

      if (row.length > 0) {
        rows.push(row)
      }
    }

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows })
    }
  }

  return tables
}

/**
 * Définir les largeurs de colonnes optimales
 */
function setColumnWidths(worksheet: ExcelJS.Worksheet, columnCount: number): void {
  const defaultWidths = [35, 20, 18, 15, 18]
  for (let i = 1; i <= columnCount; i++) {
    worksheet.getColumn(i).width = defaultWidths[i - 1] || 15
  }
}

// ============================================
// MAIN EXPORT FUNCTIONS
// ============================================

/**
 * Exporter un rapport en format Excel (.xlsx)
 */
export async function exportToExcel(reportData: ReportData): Promise<Buffer> {
  const { title, content, period, author, createdAt, activities, metadata } = reportData

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Chronodil'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Rapport', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
    },
  })

  setColumnWidths(worksheet, 5)

  let currentRow = 1

  // ===== TITRE =====
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = title
  applyTitleStyle(titleCell)
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  worksheet.getRow(currentRow).height = 35
  currentRow += 2

  // ===== MÉTADONNÉES =====
  if (period) {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = 'Période :'
    valueCell.value = period
    applyMetadataStyle(labelCell, valueCell)
    currentRow++
  }

  if (author) {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = 'Auteur :'
    valueCell.value = author
    applyMetadataStyle(labelCell, valueCell)
    currentRow++
  }

  if (createdAt) {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = 'Date de création :'
    valueCell.value = createdAt.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    applyMetadataStyle(labelCell, valueCell)
    currentRow++
  }

  if (metadata?.reportType) {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = 'Type de rapport :'
    valueCell.value =
      metadata.reportType === 'WEEKLY'
        ? 'Hebdomadaire'
        : metadata.reportType === 'MONTHLY'
          ? 'Mensuel'
          : 'Individuel'
    applyMetadataStyle(labelCell, valueCell)
    currentRow++
  }

  currentRow += 2

  // ===== TABLEAUX DU CONTENU HTML =====
  const tables = extractTablesFromHTML(content)

  if (tables.length > 0) {
    for (const table of tables) {
      // Titre de section
      const sectionTitle = worksheet.getCell(`A${currentRow}`)
      sectionTitle.value = 'Détail des activités'
      sectionTitle.font = { ...FONTS.subtitle, color: { argb: `FF${COLORS.primary}` } }
      currentRow += 2

      // En-têtes
      if (table.headers.length > 0) {
        const headerRow = worksheet.getRow(currentRow)
        table.headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1)
          cell.value = header
          applyHeaderStyle(cell)
        })
        headerRow.height = 25
        currentRow++
      }

      // Données
      table.rows.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(currentRow)
        row.forEach((cellValue, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1)
          // Détecter si c'est un nombre suivi de "h" (heures)
          const hoursMatch = cellValue.match(/^(\d+(?:\.\d+)?)h?$/)
          if (hoursMatch) {
            cell.value = parseFloat(hoursMatch[1])
            cell.numFmt = '0.0"h"'
          } else {
            cell.value = cellValue
          }
          applyDataCellStyle(cell, rowIndex % 2 === 1)
        })
        dataRow.height = 22
        currentRow++
      })

      currentRow += 2
    }
  } else if (activities && activities.length > 0) {
    // Utiliser les données structurées des activités
    const sectionTitle = worksheet.getCell(`A${currentRow}`)
    sectionTitle.value = 'Détail des activités'
    sectionTitle.font = { ...FONTS.subtitle, color: { argb: `FF${COLORS.primary}` } }
    currentRow += 2

    // En-têtes
    const headers = ['Activité', 'Type', 'Périodicité', 'Heures', 'Statut']
    const headerRow = worksheet.getRow(currentRow)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      applyHeaderStyle(cell)
    })
    headerRow.height = 25
    currentRow++

    // Données
    activities.forEach((activity, rowIndex) => {
      const dataRow = worksheet.getRow(currentRow)
      const values = [
        activity.name,
        activity.type,
        activity.periodicity,
        activity.hours,
        activity.status,
      ]

      values.forEach((value, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1)
        if (colIndex === 3 && typeof value === 'number') {
          cell.value = value
          cell.numFmt = '0.0"h"'
        } else {
          cell.value = value
        }
        applyDataCellStyle(cell, rowIndex % 2 === 1)
      })
      dataRow.height = 22
      currentRow++
    })

    currentRow += 2
  } else {
    // Fallback: convertir HTML en texte
    const text = convert(content, {
      wordwrap: false,
      preserveNewlines: true,
    })

    const lines = text.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      const cell = worksheet.getCell(`A${currentRow}`)
      cell.value = line.trim()
      cell.font = FONTS.body
      currentRow++
    }
  }

  // ===== PIED DE PAGE =====
  currentRow += 2
  const footerCell = worksheet.getCell(`A${currentRow}`)
  footerCell.value = `Généré par Chronodil le ${new Date().toLocaleDateString('fr-FR')}`
  footerCell.font = { ...FONTS.small, color: { argb: `FF${COLORS.textLight}` } }

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Exporter plusieurs rapports dans un fichier Excel multi-feuilles
 */
export async function exportMultipleReportsToExcel(reports: ReportData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Chronodil'
  workbook.created = new Date()

  // Feuille de sommaire
  const summarySheet = workbook.addWorksheet('Sommaire', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  })

  setColumnWidths(summarySheet, 4)

  let summaryRow = 1

  // Titre du sommaire
  const summaryTitle = summarySheet.getCell(`A${summaryRow}`)
  summaryTitle.value = 'Sommaire des rapports'
  applyTitleStyle(summaryTitle)
  summarySheet.mergeCells(`A${summaryRow}:D${summaryRow}`)
  summarySheet.getRow(summaryRow).height = 35
  summaryRow += 3

  // En-têtes du sommaire
  const summaryHeaders = ['#', 'Titre', 'Période', 'Date de création']
  const summaryHeaderRow = summarySheet.getRow(summaryRow)
  summaryHeaders.forEach((header, index) => {
    const cell = summaryHeaderRow.getCell(index + 1)
    cell.value = header
    applyHeaderStyle(cell)
  })
  summaryRow++

  // Liste des rapports
  reports.forEach((report, index) => {
    const row = summarySheet.getRow(summaryRow)
    const values = [
      index + 1,
      report.title,
      report.period || '-',
      report.createdAt?.toLocaleDateString('fr-FR') || '-',
    ]

    values.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1)
      cell.value = value
      applyDataCellStyle(cell, index % 2 === 1)
    })
    summaryRow++
  })

  // Créer une feuille pour chaque rapport
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]
    const sheetName = `Rapport ${i + 1}`.substring(0, 31) // Max 31 caractères

    const worksheet = workbook.addWorksheet(sheetName, {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
    })

    setColumnWidths(worksheet, 5)

    let currentRow = 1

    // Titre
    const titleCell = worksheet.getCell(`A${currentRow}`)
    titleCell.value = report.title
    applyTitleStyle(titleCell)
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
    worksheet.getRow(currentRow).height = 35
    currentRow += 2

    // Métadonnées
    if (report.period) {
      const labelCell = worksheet.getCell(`A${currentRow}`)
      const valueCell = worksheet.getCell(`B${currentRow}`)
      labelCell.value = 'Période :'
      valueCell.value = report.period
      applyMetadataStyle(labelCell, valueCell)
      currentRow++
    }

    if (report.author) {
      const labelCell = worksheet.getCell(`A${currentRow}`)
      const valueCell = worksheet.getCell(`B${currentRow}`)
      labelCell.value = 'Auteur :'
      valueCell.value = report.author
      applyMetadataStyle(labelCell, valueCell)
      currentRow++
    }

    currentRow += 2

    // Tableaux
    const tables = extractTablesFromHTML(report.content)

    for (const table of tables) {
      // En-têtes
      if (table.headers.length > 0) {
        const headerRow = worksheet.getRow(currentRow)
        table.headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1)
          cell.value = header
          applyHeaderStyle(cell)
        })
        headerRow.height = 25
        currentRow++
      }

      // Données
      table.rows.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(currentRow)
        row.forEach((cellValue, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1)
          const hoursMatch = cellValue.match(/^(\d+(?:\.\d+)?)h?$/)
          if (hoursMatch) {
            cell.value = parseFloat(hoursMatch[1])
            cell.numFmt = '0.0"h"'
          } else {
            cell.value = cellValue
          }
          applyDataCellStyle(cell, rowIndex % 2 === 1)
        })
        dataRow.height = 22
        currentRow++
      })

      currentRow += 2
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
