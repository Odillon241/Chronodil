import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  ShadingType,
  PageBreak,
} from 'docx'
import type { ReportData } from './types'

// ============================================
// CONFIGURATION & STYLES
// ============================================

const COLORS = {
  primary: '2563EB', // Blue-600
  primaryLight: 'DBEAFE', // Blue-100
  secondary: '64748B', // Slate-500
  headerBg: 'F1F5F9', // Slate-100
  tableBorder: 'CBD5E1', // Slate-300
  text: '1E293B', // Slate-800
  textLight: '64748B', // Slate-500
}

const FONTS = {
  title: 'Calibri',
  body: 'Calibri',
  table: 'Calibri',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse HTML content and extract structured data
 */
function parseHTMLContent(html: string): Array<{
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'hr'
  level?: number
  text?: string
  items?: string[]
  headers?: string[]
  rows?: string[][]
}> {
  const elements: Array<any> = []

  // Clean HTML
  const content = html
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  // Extract tables first (they're complex)
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  let tableMatch
  let lastIndex = 0
  const parts: Array<{ type: 'html' | 'table'; content: string }> = []

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    // Add HTML before table
    if (tableMatch.index > lastIndex) {
      parts.push({
        type: 'html',
        content: content.substring(lastIndex, tableMatch.index),
      })
    }
    parts.push({ type: 'table', content: tableMatch[0] })
    lastIndex = tableMatch.index + tableMatch[0].length
  }

  // Add remaining HTML
  if (lastIndex < content.length) {
    parts.push({ type: 'html', content: content.substring(lastIndex) })
  }

  // Process each part
  for (const part of parts) {
    if (part.type === 'table') {
      const table = parseTable(part.content)
      if (table) elements.push(table)
    } else {
      const htmlElements = parseHTMLElements(part.content)
      elements.push(...htmlElements)
    }
  }

  return elements
}

/**
 * Parse HTML table
 */
function parseTable(
  tableHTML: string,
): { type: 'table'; headers: string[]; rows: string[][] } | null {
  const headers: string[] = []
  const rows: string[][] = []

  // Extract headers from thead or first tr with th
  const theadMatch = tableHTML.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i)
  if (theadMatch) {
    const thMatches = theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)
    for (const th of thMatches) {
      headers.push(stripHTML(th[1]))
    }
  }

  // Extract body rows
  const tbodyMatch = tableHTML.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  const bodyContent = tbodyMatch ? tbodyMatch[1] : tableHTML

  const trMatches = bodyContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
  for (const tr of trMatches) {
    const row: string[] = []
    const tdMatches = tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)
    for (const td of tdMatches) {
      row.push(stripHTML(td[1]))
    }
    if (row.length > 0) {
      rows.push(row)
    }
  }

  // If no thead, use first row as headers
  if (headers.length === 0 && rows.length > 0) {
    const firstRowHTML = tableHTML.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i)
    if (firstRowHTML) {
      const thMatches = firstRowHTML[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)
      for (const th of thMatches) {
        headers.push(stripHTML(th[1]))
      }
    }
  }

  if (headers.length === 0 && rows.length === 0) return null

  return { type: 'table', headers, rows }
}

/**
 * Parse HTML elements (headings, paragraphs, lists)
 */
function parseHTMLElements(html: string): Array<any> {
  const elements: Array<any> = []

  // Split by common block elements
  const blocks = html.split(/<\/?(?:h[1-6]|p|ul|ol|li|hr|br)[^>]*>/gi)
  const tags = html.match(/<\/?(?:h[1-6]|p|ul|ol|li|hr|br)[^>]*>/gi) || []

  let currentList: string[] = []
  let inList = false

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i].toLowerCase()
    const nextContent = blocks[i + 1]?.trim() || ''

    // Headings
    if (tag.match(/<h([1-6])[^>]*>/)) {
      const level = parseInt(tag.match(/<h([1-6])/)?.[1] || '1')
      if (nextContent) {
        elements.push({
          type: 'heading',
          level,
          text: stripHTML(nextContent),
        })
      }
    }
    // Paragraphs
    else if (tag === '<p>' || tag.startsWith('<p ')) {
      if (nextContent) {
        elements.push({
          type: 'paragraph',
          text: stripHTML(nextContent),
        })
      }
    }
    // List start
    else if (tag === '<ul>' || tag === '<ol>' || tag.startsWith('<ul ') || tag.startsWith('<ol ')) {
      inList = true
      currentList = []
    }
    // List end
    else if (tag === '</ul>' || tag === '</ol>') {
      if (currentList.length > 0) {
        elements.push({
          type: 'list',
          items: currentList,
        })
      }
      inList = false
      currentList = []
    }
    // List item
    else if ((tag === '<li>' || tag.startsWith('<li ')) && inList) {
      if (nextContent) {
        currentList.push(stripHTML(nextContent))
      }
    }
    // Horizontal rule
    else if (tag === '<hr>' || tag === '<hr/>' || tag === '<hr />') {
      elements.push({ type: 'hr' })
    }
  }

  // Handle plain text without tags
  if (elements.length === 0 && html.trim()) {
    const text = stripHTML(html).trim()
    if (text) {
      const lines = text.split('\n').filter((l) => l.trim())
      for (const line of lines) {
        elements.push({ type: 'paragraph', text: line.trim() })
      }
    }
  }

  return elements
}

/**
 * Strip HTML tags from string
 */
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

// ============================================
// DOCUMENT BUILDERS
// ============================================

/**
 * Create document header
 */
function createHeader(companyName: string = 'Chronodil'): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: companyName,
            font: FONTS.title,
            size: 18,
            color: COLORS.secondary,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        border: {
          bottom: {
            color: COLORS.tableBorder,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
    ],
  })
}

/**
 * Create document footer with page numbers
 */
function createFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Page ',
            font: FONTS.body,
            size: 18,
            color: COLORS.textLight,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONTS.body,
            size: 18,
            color: COLORS.textLight,
          }),
          new TextRun({
            text: ' / ',
            font: FONTS.body,
            size: 18,
            color: COLORS.textLight,
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: FONTS.body,
            size: 18,
            color: COLORS.textLight,
          }),
        ],
        alignment: AlignmentType.CENTER,
        border: {
          top: {
            color: COLORS.tableBorder,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { before: 200 },
      }),
    ],
  })
}

/**
 * Create title section
 */
function createTitleSection(title: string, subtitle?: string): Paragraph[] {
  const paragraphs: Paragraph[] = []

  // Main title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          font: FONTS.title,
          size: 48,
          bold: true,
          color: COLORS.text,
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
  )

  // Subtitle
  if (subtitle) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            font: FONTS.body,
            size: 24,
            italics: true,
            color: COLORS.secondary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    )
  }

  return paragraphs
}

/**
 * Create metadata box
 */
function createMetadataBox(metadata: {
  period?: string
  author?: string
  createdAt?: Date
  additionalInfo?: Record<string, string>
}): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const items: string[] = []

  if (metadata.period) items.push(`📅 Période: ${metadata.period}`)
  if (metadata.author) items.push(`👤 Auteur: ${metadata.author}`)
  if (metadata.createdAt) {
    items.push(
      `📆 Date: ${metadata.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
    )
  }
  if (metadata.additionalInfo) {
    for (const [key, value] of Object.entries(metadata.additionalInfo)) {
      items.push(`${key}: ${value}`)
    }
  }

  for (const item of items) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: item,
            font: FONTS.body,
            size: 22,
            color: COLORS.text,
          }),
        ],
        spacing: { before: 60, after: 60 },
        indent: { left: convertInchesToTwip(0.3) },
      }),
    )
  }

  // Add separator after metadata
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '',
        }),
      ],
      border: {
        bottom: {
          color: COLORS.primary,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      spacing: { before: 200, after: 400 },
    }),
  )

  return paragraphs
}

/**
 * Create a styled table
 */
function createStyledTable(headers: string[], rows: string[][]): Table {
  const columnCount = Math.max(headers.length, rows[0]?.length || 1)
  const columnWidth = Math.floor(100 / columnCount)

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      bold: true,
                      font: FONTS.table,
                      size: 20,
                      color: 'FFFFFF',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 80, after: 80 },
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                fill: COLORS.primary,
              },
              width: {
                size: columnWidth,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary },
                left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary },
                right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary },
              },
            }),
        ),
      }),
      // Data rows
      ...rows.map(
        (row, rowIndex) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          font: FONTS.table,
                          size: 20,
                          color: COLORS.text,
                        }),
                      ],
                      spacing: { before: 60, after: 60 },
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    fill: rowIndex % 2 === 0 ? 'FFFFFF' : COLORS.headerBg,
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
                    left: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
                    right: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
                  },
                }),
            ),
          }),
      ),
    ],
  })
}

/**
 * Create a heading paragraph
 */
function createHeading(text: string, level: number): Paragraph {
  const sizes = { 1: 32, 2: 28, 3: 24, 4: 22, 5: 20, 6: 18 }
  const headingLevels = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  }

  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONTS.title,
        size: sizes[level as keyof typeof sizes] || 24,
        bold: true,
        color: level <= 2 ? COLORS.primary : COLORS.text,
      }),
    ],
    heading: headingLevels[level as keyof typeof headingLevels] || HeadingLevel.HEADING_3,
    spacing: { before: 300, after: 150 },
  })
}

/**
 * Create a paragraph
 */
function createParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONTS.body,
        size: 22,
        color: COLORS.text,
      }),
    ],
    spacing: { before: 100, after: 100 },
  })
}

/**
 * Create a bullet list
 */
function createBulletList(items: string[]): Paragraph[] {
  return items.map(
    (item) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${item}`,
            font: FONTS.body,
            size: 22,
            color: COLORS.text,
          }),
        ],
        indent: { left: convertInchesToTwip(0.3) },
        spacing: { before: 60, after: 60 },
      }),
  )
}

/**
 * Create horizontal rule
 */
function createHorizontalRule(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    border: {
      bottom: {
        color: COLORS.tableBorder,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 200, after: 200 },
  })
}

// ============================================
// MAIN EXPORT FUNCTIONS
// ============================================

/**
 * Export a report to Word format (.docx)
 */
export async function exportToWord(reportData: ReportData): Promise<Buffer> {
  const { title, content, period, author, createdAt, metadata } = reportData

  // Parse HTML content
  const elements = parseHTMLContent(content)

  // Build document children
  const children: (Paragraph | Table)[] = []

  // Title section
  children.push(...createTitleSection(title))

  // Metadata box
  children.push(
    ...createMetadataBox({
      period,
      author,
      createdAt,
      additionalInfo: metadata?.reportType
        ? { 'Type de rapport': metadata.reportType === 'WEEKLY' ? 'Hebdomadaire' : 'Mensuel' }
        : undefined,
    }),
  )

  // Content elements
  for (const element of elements) {
    switch (element.type) {
      case 'heading':
        children.push(createHeading(element.text!, element.level || 2))
        break
      case 'paragraph':
        children.push(createParagraph(element.text!))
        break
      case 'list':
        children.push(...createBulletList(element.items!))
        break
      case 'table':
        children.push(createStyledTable(element.headers!, element.rows!))
        children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
        break
      case 'hr':
        children.push(createHorizontalRule())
        break
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: createHeader(),
        },
        footers: {
          default: createFooter(),
        },
        children,
      },
    ],
  })

  // Generate buffer
  const buffer = await Packer.toBuffer(doc)
  return buffer
}

/**
 * Export multiple reports to a single Word document
 */
export async function exportMultipleReportsToWord(reports: ReportData[]): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  // Table of contents header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Table des matières',
          font: FONTS.title,
          size: 32,
          bold: true,
          color: COLORS.primary,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
  )

  // Simple TOC (list of reports)
  reports.forEach((report, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${report.title}`,
            font: FONTS.body,
            size: 22,
            color: COLORS.text,
          }),
          new TextRun({
            text: report.period ? ` — ${report.period}` : '',
            font: FONTS.body,
            size: 20,
            italics: true,
            color: COLORS.textLight,
          }),
        ],
        spacing: { before: 60, after: 60 },
      }),
    )
  })

  // Page break before reports
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
  )

  // Each report
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]

    // Report title
    children.push(
      ...createTitleSection(report.title, report.period ? `Période: ${report.period}` : undefined),
    )

    // Metadata
    if (report.author || report.createdAt) {
      children.push(
        ...createMetadataBox({
          author: report.author,
          createdAt: report.createdAt,
        }),
      )
    }

    // Content
    const elements = parseHTMLContent(report.content)
    for (const element of elements) {
      switch (element.type) {
        case 'heading':
          children.push(createHeading(element.text!, element.level || 2))
          break
        case 'paragraph':
          children.push(createParagraph(element.text!))
          break
        case 'list':
          children.push(...createBulletList(element.items!))
          break
        case 'table':
          children.push(createStyledTable(element.headers!, element.rows!))
          children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
          break
        case 'hr':
          children.push(createHorizontalRule())
          break
      }
    }

    // Page break between reports (except last)
    if (i < reports.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
      )
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: createHeader(),
        },
        footers: {
          default: createFooter(),
        },
        children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
