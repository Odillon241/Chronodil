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
  PageBreak,
  Header,
  Footer,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
  PageNumber,
} from 'docx'
import type { DashboardReportData } from '@/actions/dashboard-report.actions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ============================================
// COULEURS ET STYLES
// ============================================

const COLORS = {
  primary: '1E3A5F', // Bleu foncé
  secondary: '4A90A4', // Bleu clair
  accent: '8BC34A', // Vert (pour les positifs)
  warning: 'FFC107', // Jaune (attention)
  danger: 'E53935', // Rouge (négatif)
  gray: '6B7280', // Gris
  lightGray: 'F3F4F6', // Gris clair (fond)
  white: 'FFFFFF',
  black: '1F2937',
}

// ============================================
// HELPERS
// ============================================

/**
 * Créer une ligne de séparation
 */
function createSeparator(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        color: COLORS.lightGray,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 200, after: 200 },
  })
}

/**
 * Créer un titre de section
 */
function createSectionTitle(text: string, level: 1 | 2 | 3 = 1): Paragraph {
  const headingLevel =
    level === 1
      ? HeadingLevel.HEADING_1
      : level === 2
        ? HeadingLevel.HEADING_2
        : HeadingLevel.HEADING_3

  return new Paragraph({
    text,
    heading: headingLevel,
    spacing: { before: level === 1 ? 400 : 300, after: 200 },
    thematicBreak: level === 1,
  })
}

/**
 * Créer un paragraphe de texte normal
 */
function createTextParagraph(
  text: string,
  options?: { bold?: boolean; italic?: boolean; size?: number },
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        italics: options?.italic,
        size: options?.size || 22,
      }),
    ],
    spacing: { before: 100, after: 100 },
  })
}

/**
 * Créer un paragraphe avec indicateur de variation
 */
function _createVariationText(value: number, label: string): Paragraph {
  const isPositive = value >= 0
  const sign = isPositive ? '+' : ''
  const color = value > 0 ? COLORS.accent : value < 0 ? COLORS.danger : COLORS.gray

  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', size: 22 }),
      new TextRun({
        text: `${sign}${value.toFixed(1)}%`,
        bold: true,
        color,
        size: 22,
      }),
      new TextRun({
        text: isPositive ? ' ▲' : ' ▼',
        color,
        size: 18,
      }),
    ],
    spacing: { before: 50, after: 50 },
  })
}

/**
 * Créer une liste à puces
 */
function createBulletList(items: string[]): Paragraph[] {
  return items.map(
    (item) =>
      new Paragraph({
        children: [new TextRun({ text: item, size: 22 })],
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 },
      }),
  )
}

/**
 * Créer une cellule de tableau stylisée
 */
function createTableCell(
  text: string | number,
  options?: {
    bold?: boolean
    isHeader?: boolean
    align?: 'left' | 'center' | 'right'
    color?: string
    bgColor?: string
  },
): TableCell {
  const alignment =
    options?.align === 'center'
      ? AlignmentType.CENTER
      : options?.align === 'right'
        ? AlignmentType.RIGHT
        : AlignmentType.LEFT

  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: options?.bold || options?.isHeader,
            color: options?.color || (options?.isHeader ? COLORS.white : COLORS.black),
            size: options?.isHeader ? 22 : 20,
          }),
        ],
        alignment,
      }),
    ],
    shading: {
      type: ShadingType.SOLID,
      fill: options?.bgColor || (options?.isHeader ? COLORS.primary : COLORS.white),
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 80,
      bottom: 80,
      left: 120,
      right: 120,
    },
  })
}

/**
 * Créer un tableau avec données
 */
function createDataTable(
  headers: string[],
  rows: (string | number)[][],
  options?: { widths?: number[] },
): Table {
  const defaultWidth = 100 / headers.length
  const _widths = options?.widths || headers.map(() => defaultWidth)

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightGray },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightGray },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightGray },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightGray },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightGray },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightGray },
    },
    rows: [
      // En-tête
      new TableRow({
        children: headers.map((header, i) =>
          createTableCell(header, {
            isHeader: true,
            align: i === 0 ? 'left' : 'center',
          }),
        ),
        tableHeader: true,
      }),
      // Lignes de données
      ...rows.map(
        (row, rowIndex) =>
          new TableRow({
            children: row.map((cell, i) =>
              createTableCell(cell, {
                align: i === 0 ? 'left' : 'center',
                bgColor: rowIndex % 2 === 1 ? COLORS.lightGray : COLORS.white,
              }),
            ),
          }),
      ),
    ],
  })
}

/**
 * Créer une carte statistique (représentation textuelle)
 */
function _createStatCard(label: string, value: string | number, variation?: number): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: label,
          size: 20,
          color: COLORS.gray,
        }),
      ],
      spacing: { before: 100, after: 0 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: String(value),
          bold: true,
          size: 32,
          color: COLORS.primary,
        }),
      ],
      spacing: { before: 0, after: 50 },
    }),
  ]

  if (variation !== undefined) {
    const isPositive = variation >= 0
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${isPositive ? '+' : ''}${variation.toFixed(1)}% vs période précédente`,
            size: 18,
            color: isPositive ? COLORS.accent : COLORS.danger,
          }),
        ],
        spacing: { after: 150 },
      }),
    )
  }

  return paragraphs
}

/**
 * Créer un graphique en barres ASCII (représentation textuelle)
 */
function createAsciiBarChart(
  data: Array<{ label: string; value: number }>,
  maxWidth: number = 30,
): Paragraph[] {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  const paragraphs: Paragraph[] = []

  data.forEach((item) => {
    const barLength = Math.round((item.value / maxValue) * maxWidth)
    const bar = '█'.repeat(barLength)

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: item.label.padEnd(15),
            size: 18,
            font: 'Courier New',
          }),
          new TextRun({
            text: bar,
            size: 18,
            color: COLORS.secondary,
            font: 'Courier New',
          }),
          new TextRun({
            text: ` ${item.value}`,
            size: 18,
            bold: true,
            font: 'Courier New',
          }),
        ],
        spacing: { before: 30, after: 30 },
      }),
    )
  })

  return paragraphs
}

// ============================================
// SECTIONS DU RAPPORT
// ============================================

/**
 * Créer la page de garde
 */
function createCoverPage(data: DashboardReportData): Paragraph[] {
  return [
    // Espace supérieur
    new Paragraph({ spacing: { before: 2000 } }),

    // Logo / Nom de l'entreprise
    new Paragraph({
      children: [
        new TextRun({
          text: data.companyName.toUpperCase(),
          bold: true,
          size: 56,
          color: COLORS.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Titre principal
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 72,
          color: COLORS.black,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    // Sous-titre (période)
    new Paragraph({
      children: [
        new TextRun({
          text: data.subtitle,
          size: 32,
          color: COLORS.gray,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),

    // Ligne décorative
    new Paragraph({
      children: [
        new TextRun({
          text: '━'.repeat(40),
          color: COLORS.secondary,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),

    // Informations de génération
    new Paragraph({
      children: [
        new TextRun({
          text: `Généré le ${format(data.generatedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}`,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Par ${data.author}`,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Saut de page
    new Paragraph({
      children: [new PageBreak()],
    }),
  ]
}

/**
 * Créer le sommaire
 */
function createTableOfContents(): Paragraph[] {
  return [
    createSectionTitle('Sommaire', 1),

    // Note: Le vrai TOC nécessite des champs Word complexes
    // On crée une version simplifiée
    new Paragraph({
      children: [
        new TextRun({
          text: '1. Synthèse Exécutive',
          size: 24,
        }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '2. Indicateurs Clés de Performance',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '3. Analyse Comparative',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '4. Activité Mensuelle',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '5. Performance des Projets',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '6. Performance des Équipes',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '7. Distribution des Tâches',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '8. Recommandations',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '9. Conclusion',
          size: 24,
        }),
      ],
      spacing: { before: 100, after: 100 },
    }),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section de synthèse exécutive
 */
function createExecutiveSummary(data: DashboardReportData): (Paragraph | Table)[] {
  const { currentStats, evolution } = data

  return [
    createSectionTitle('1. Synthèse Exécutive', 1),

    createTextParagraph(
      `Ce rapport présente l'analyse de l'activité pour la période ${data.period.label}. ` +
        `Il synthétise les principaux indicateurs de performance et propose des recommandations ` +
        `pour optimiser la productivité de l'équipe.`,
    ),

    createSeparator(),

    createSectionTitle('Points clés', 2),

    // Statistiques principales en tableau
    createDataTable(
      ['Indicateur', 'Valeur', 'Évolution'],
      [
        [
          'Projets actifs',
          currentStats.activeProjects.toString(),
          evolution
            ? `${evolution.projectsChange >= 0 ? '+' : ''}${evolution.projectsChange.toFixed(1)}%`
            : 'N/A',
        ],
        [
          'Tâches en cours',
          currentStats.ongoingTasks.toString(),
          evolution
            ? `${evolution.tasksChange >= 0 ? '+' : ''}${evolution.tasksChange.toFixed(1)}%`
            : 'N/A',
        ],
        [
          'Heures totales',
          `${currentStats.totalHours}h`,
          evolution
            ? `${evolution.hoursChange >= 0 ? '+' : ''}${evolution.hoursChange.toFixed(1)}%`
            : 'N/A',
        ],
        [
          'Taux de complétion',
          `${currentStats.taskCompletionRate.toFixed(1)}%`,
          evolution
            ? `${evolution.completionRateChange >= 0 ? '+' : ''}${evolution.completionRateChange.toFixed(1)} pts`
            : 'N/A',
        ],
      ],
    ),

    createSeparator(),

    createSectionTitle('Insights principaux', 2),
    ...createBulletList(data.insights),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section des indicateurs clés
 */
function createKPISection(data: DashboardReportData): (Paragraph | Table)[] {
  const { currentStats } = data

  return [
    createSectionTitle('2. Indicateurs Clés de Performance (KPI)', 1),

    createTextParagraph(
      "Les indicateurs ci-dessous permettent de mesurer la performance globale de l'activité " +
        "et d'identifier les axes d'amélioration prioritaires.",
    ),

    createSeparator(),

    createSectionTitle("Vue d'ensemble", 2),

    createDataTable(
      ['Catégorie', 'Indicateur', 'Valeur'],
      [
        ['Projets', 'Projets actifs', currentStats.activeProjects.toString()],
        ['Projets', 'Total projets', currentStats.totalProjects.toString()],
        ['Tâches', 'Tâches en cours', currentStats.ongoingTasks.toString()],
        ['Tâches', 'Tâches terminées', currentStats.completedTasks.toString()],
        ['Tâches', 'Total tâches', currentStats.totalTasks.toString()],
        ['Tâches', 'Taux de complétion', `${currentStats.taskCompletionRate.toFixed(1)}%`],
        ['Temps', 'Heures totales', `${currentStats.totalHours}h`],
        ['Temps', 'Moyenne par utilisateur', `${currentStats.averageHoursPerUser.toFixed(1)}h`],
        ['Équipe', "Nombre d'utilisateurs", currentStats.usersCount.toString()],
      ],
    ),

    createSeparator(),

    createSectionTitle('Analyse du taux de complétion', 2),

    createTextParagraph(
      currentStats.taskCompletionRate >= 80
        ? `Le taux de complétion de ${currentStats.taskCompletionRate.toFixed(1)}% est excellent et témoigne d'une bonne organisation de l'équipe.`
        : currentStats.taskCompletionRate >= 60
          ? `Le taux de complétion de ${currentStats.taskCompletionRate.toFixed(1)}% est satisfaisant mais pourrait être amélioré.`
          : `Le taux de complétion de ${currentStats.taskCompletionRate.toFixed(1)}% nécessite une attention particulière pour identifier les blocages.`,
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section d'analyse comparative
 */
function createComparativeAnalysis(data: DashboardReportData): (Paragraph | Table)[] {
  if (!data.previousStats || !data.evolution) {
    return [
      createSectionTitle('3. Analyse Comparative', 1),
      createTextParagraph('Aucune donnée de période précédente disponible pour comparaison.'),
      new Paragraph({ children: [new PageBreak()] }),
    ]
  }

  const { currentStats, previousStats, evolution, period, previousPeriod } = data

  return [
    createSectionTitle('3. Analyse Comparative', 1),

    createTextParagraph(
      `Comparaison entre la période actuelle (${period.label}) et la période précédente (${previousPeriod?.label || 'N/A'}).`,
    ),

    createSeparator(),

    createSectionTitle('Tableau comparatif', 2),

    createDataTable(
      ['Indicateur', previousPeriod?.label || 'Période précédente', period.label, 'Évolution'],
      [
        [
          'Projets actifs',
          previousStats.activeProjects.toString(),
          currentStats.activeProjects.toString(),
          `${evolution.projectsChange >= 0 ? '+' : ''}${evolution.projectsChange.toFixed(1)}%`,
        ],
        [
          'Tâches en cours',
          previousStats.ongoingTasks.toString(),
          currentStats.ongoingTasks.toString(),
          `${evolution.tasksChange >= 0 ? '+' : ''}${evolution.tasksChange.toFixed(1)}%`,
        ],
        [
          'Tâches terminées',
          previousStats.completedTasks.toString(),
          currentStats.completedTasks.toString(),
          '-',
        ],
        [
          'Heures travaillées',
          `${previousStats.totalHours}h`,
          `${currentStats.totalHours}h`,
          `${evolution.hoursChange >= 0 ? '+' : ''}${evolution.hoursChange.toFixed(1)}%`,
        ],
        [
          'Taux de complétion',
          `${previousStats.taskCompletionRate.toFixed(1)}%`,
          `${currentStats.taskCompletionRate.toFixed(1)}%`,
          `${evolution.completionRateChange >= 0 ? '+' : ''}${evolution.completionRateChange.toFixed(1)} pts`,
        ],
      ],
    ),

    createSeparator(),

    createSectionTitle('Interprétation', 2),

    createTextParagraph(
      evolution.hoursChange > 10
        ? `L'activité a significativement augmenté (+${evolution.hoursChange.toFixed(1)}%), ce qui peut indiquer une charge de travail plus importante ou une meilleure productivité.`
        : evolution.hoursChange < -10
          ? `L'activité a diminué de ${Math.abs(evolution.hoursChange).toFixed(1)}%, ce qui peut être dû à des congés, une réorganisation ou des facteurs externes.`
          : "L'activité reste stable par rapport à la période précédente.",
    ),

    createTextParagraph(
      evolution.completionRateChange > 5
        ? `L'amélioration du taux de complétion (+${evolution.completionRateChange.toFixed(1)} points) démontre une meilleure efficacité dans la gestion des tâches.`
        : evolution.completionRateChange < -5
          ? `La baisse du taux de complétion (${evolution.completionRateChange.toFixed(1)} points) suggère des difficultés potentielles à traiter.`
          : 'Le taux de complétion est resté stable.',
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section d'activité mensuelle
 */
function createMonthlyActivitySection(data: DashboardReportData): (Paragraph | Table)[] {
  const { monthlyActivity } = data

  return [
    createSectionTitle('4. Activité Mensuelle', 1),

    createTextParagraph(
      "Évolution de l'activité sur les 6 derniers mois, permettant d'identifier les tendances saisonnières.",
    ),

    createSeparator(),

    createSectionTitle('Heures travaillées par mois', 2),

    createDataTable(
      ['Mois', 'Heures'],
      monthlyActivity.map((m) => [m.month, `${m.hours}h`]),
    ),

    createSeparator(),

    createSectionTitle('Représentation graphique', 2),

    ...createAsciiBarChart(monthlyActivity.map((m) => ({ label: m.month, value: m.hours }))),

    createSeparator(),

    createSectionTitle('Analyse', 2),

    createTextParagraph(
      (() => {
        const avgHours =
          monthlyActivity.reduce((sum, m) => sum + m.hours, 0) / monthlyActivity.length
        const trend =
          monthlyActivity.length >= 2
            ? monthlyActivity[monthlyActivity.length - 1].hours - monthlyActivity[0].hours
            : 0

        if (trend > avgHours * 0.2) {
          return `On observe une tendance à la hausse de l'activité (+${((trend / monthlyActivity[0].hours) * 100).toFixed(0)}% sur la période), avec une moyenne de ${avgHours.toFixed(0)} heures par mois.`
        } else if (trend < -avgHours * 0.2) {
          return `On note une tendance à la baisse de l'activité, avec une moyenne de ${avgHours.toFixed(0)} heures par mois. Une analyse des causes serait pertinente.`
        }
        return `L'activité reste relativement stable avec une moyenne de ${avgHours.toFixed(0)} heures par mois.`
      })(),
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section de performance des projets
 */
function createProjectPerformanceSection(data: DashboardReportData): Paragraph[] {
  const { projectPerformance } = data

  if (projectPerformance.length === 0) {
    return [
      createSectionTitle('5. Performance des Projets', 1),
      createTextParagraph('Aucun projet actif à analyser pour cette période.'),
      new Paragraph({ children: [new PageBreak()] }),
    ]
  }

  return [
    createSectionTitle('5. Performance des Projets', 1),

    createTextParagraph(
      `Analyse détaillée des ${projectPerformance.length} projet(s) actif(s) sur la période.`,
    ),

    createSeparator(),

    createSectionTitle('Tableau de performance', 2),

    createDataTable(
      ['Projet', 'Tâches', 'Terminées', 'Complétion', 'Heures'],
      projectPerformance.map((p) => [
        p.name.length > 25 ? p.name.substring(0, 22) + '...' : p.name,
        p.totalTasks.toString(),
        p.completedTasks.toString(),
        `${p.completionRate.toFixed(0)}%`,
        `${p.totalHours}h`,
      ]),
    ),

    createSeparator(),

    createSectionTitle('Projets les plus avancés', 2),

    ...projectPerformance
      .filter((p) => p.completionRate >= 50)
      .slice(0, 3)
      .map((p) =>
        createTextParagraph(
          `• ${p.name}: ${p.completionRate.toFixed(0)}% de complétion (${p.completedTasks}/${p.totalTasks} tâches)`,
        ),
      ),

    projectPerformance.filter((p) => p.completionRate < 30).length > 0 &&
      createSectionTitle("Points d'attention", 2),

    ...projectPerformance
      .filter((p) => p.completionRate < 30 && p.totalTasks > 0)
      .slice(0, 3)
      .map((p) =>
        createTextParagraph(
          `• ${p.name}: seulement ${p.completionRate.toFixed(0)}% de complétion, nécessite un suivi rapproché.`,
        ),
      ),

    new Paragraph({ children: [new PageBreak()] }),
  ].filter(Boolean) as Paragraph[]
}

/**
 * Créer la section de performance des équipes
 */
function createTeamPerformanceSection(data: DashboardReportData): (Paragraph | Table)[] {
  const { userPerformance } = data

  if (userPerformance.length === 0) {
    return [
      createSectionTitle('6. Performance des Équipes', 1),
      createTextParagraph(
        'Aucune donnée de performance utilisateur disponible pour cette période.',
      ),
      new Paragraph({ children: [new PageBreak()] }),
    ]
  }

  return [
    createSectionTitle('6. Performance des Équipes', 1),

    createTextParagraph(
      `Classement des collaborateurs les plus actifs sur la période (top ${Math.min(userPerformance.length, 10)}).`,
    ),

    createSeparator(),

    createSectionTitle('Classement par tâches complétées', 2),

    createDataTable(
      ['Collaborateur', 'Rôle', 'Tâches', 'Heures'],
      userPerformance
        .slice(0, 10)
        .map((u, i) => [
          `${i + 1}. ${u.name}`,
          u.role,
          u.tasksCompleted.toString(),
          `${u.totalHours}h`,
        ]),
    ),

    createSeparator(),

    createSectionTitle('Analyse', 2),

    createTextParagraph(
      `${userPerformance[0]?.name || 'Le premier collaborateur'} se distingue avec ${userPerformance[0]?.tasksCompleted || 0} tâches complétées et ${userPerformance[0]?.totalHours || 0} heures travaillées.`,
    ),

    createTextParagraph(
      `La moyenne de l'équipe est de ${(userPerformance.reduce((sum, u) => sum + u.tasksCompleted, 0) / userPerformance.length).toFixed(1)} tâches complétées par collaborateur.`,
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section de distribution des tâches
 */
function createTaskDistributionSection(data: DashboardReportData): Paragraph[] {
  const { taskDistribution, priorityDistribution } = data
  const totalTasks =
    taskDistribution.todo +
    taskDistribution.inProgress +
    taskDistribution.done +
    taskDistribution.blocked
  const totalPriority =
    priorityDistribution.low +
    priorityDistribution.medium +
    priorityDistribution.high +
    priorityDistribution.urgent

  return [
    createSectionTitle('7. Distribution des Tâches', 1),

    createTextParagraph('Répartition des tâches par statut et par niveau de priorité.'),

    createSeparator(),

    createSectionTitle('Par statut', 2),

    createDataTable(
      ['Statut', 'Nombre', 'Pourcentage'],
      [
        [
          'À faire',
          taskDistribution.todo.toString(),
          `${totalTasks > 0 ? ((taskDistribution.todo / totalTasks) * 100).toFixed(1) : 0}%`,
        ],
        [
          'En cours',
          taskDistribution.inProgress.toString(),
          `${totalTasks > 0 ? ((taskDistribution.inProgress / totalTasks) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Terminées',
          taskDistribution.done.toString(),
          `${totalTasks > 0 ? ((taskDistribution.done / totalTasks) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Bloquées',
          taskDistribution.blocked.toString(),
          `${totalTasks > 0 ? ((taskDistribution.blocked / totalTasks) * 100).toFixed(1) : 0}%`,
        ],
      ],
    ),

    createSeparator(),

    createSectionTitle('Par priorité', 2),

    createDataTable(
      ['Priorité', 'Nombre', 'Pourcentage'],
      [
        [
          'Basse',
          priorityDistribution.low.toString(),
          `${totalPriority > 0 ? ((priorityDistribution.low / totalPriority) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Moyenne',
          priorityDistribution.medium.toString(),
          `${totalPriority > 0 ? ((priorityDistribution.medium / totalPriority) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Haute',
          priorityDistribution.high.toString(),
          `${totalPriority > 0 ? ((priorityDistribution.high / totalPriority) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Urgente',
          priorityDistribution.urgent.toString(),
          `${totalPriority > 0 ? ((priorityDistribution.urgent / totalPriority) * 100).toFixed(1) : 0}%`,
        ],
      ],
    ),

    createSeparator(),

    createSectionTitle('Analyse', 2),

    taskDistribution.blocked > 0 &&
      createTextParagraph(
        `⚠️ Attention: ${taskDistribution.blocked} tâche(s) bloquée(s) nécessitent une intervention rapide.`,
        { bold: true },
      ),

    priorityDistribution.urgent > 5 &&
      createTextParagraph(
        `⚠️ ${priorityDistribution.urgent} tâches sont marquées comme urgentes. Une revue de la priorisation pourrait être nécessaire.`,
        { bold: true },
      ),

    new Paragraph({ children: [new PageBreak()] }),
  ].filter(Boolean) as Paragraph[]
}

/**
 * Créer la section des recommandations
 */
function createRecommendationsSection(data: DashboardReportData): Paragraph[] {
  const { recommendations } = data

  return [
    createSectionTitle('8. Recommandations', 1),

    createTextParagraph(
      "Sur la base de l'analyse des données, voici les recommandations pour améliorer la performance :",
    ),

    createSeparator(),

    ...recommendations.map(
      (rec, index) =>
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. `,
              bold: true,
              size: 24,
              color: COLORS.primary,
            }),
            new TextRun({
              text: rec,
              size: 22,
            }),
          ],
          spacing: { before: 150, after: 150 },
        }),
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/**
 * Créer la section de conclusion
 */
function createConclusionSection(data: DashboardReportData): Paragraph[] {
  const { conclusion, period: _period, previousPeriod: _previousPeriod } = data

  return [
    createSectionTitle('9. Conclusion', 1),

    createSectionTitle('Résumé', 2),
    createTextParagraph(conclusion.summary),

    createSeparator(),

    createSectionTitle('Points forts', 2),
    ...createBulletList(conclusion.highlights),

    createSeparator(),

    createSectionTitle('Défis identifiés', 2),
    ...createBulletList(conclusion.challenges),

    createSeparator(),

    createSectionTitle('Perspectives', 2),
    createTextParagraph(conclusion.outlook),

    createSeparator(),

    // Note finale
    new Paragraph({
      children: [
        new TextRun({
          text: '---',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Rapport généré automatiquement par ${data.companyName}`,
          size: 18,
          color: COLORS.gray,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: format(data.generatedAt, "'Le' d MMMM yyyy 'à' HH:mm", { locale: fr }),
          size: 18,
          color: COLORS.gray,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ]
}

// ============================================
// FONCTION PRINCIPALE D'EXPORT
// ============================================

/**
 * Exporter les données du dashboard en document Word professionnel
 */
export async function exportDashboardReportToWord(data: DashboardReportData): Promise<Buffer> {
  // Construire toutes les sections
  const sections = [
    ...createCoverPage(data),
    ...createTableOfContents(),
    ...createExecutiveSummary(data),
    ...createKPISection(data),
    ...createComparativeAnalysis(data),
    ...createMonthlyActivitySection(data),
    ...createProjectPerformanceSection(data),
    ...createTeamPerformanceSection(data),
    ...createTaskDistributionSection(data),
    ...createRecommendationsSection(data),
    ...createConclusionSection(data),
  ]

  // Créer le document
  const doc = new Document({
    creator: data.author,
    title: data.title,
    subject: `Rapport d'activité - ${data.period.label}`,
    description: `Rapport généré automatiquement par ${data.companyName}`,
    styles: {
      default: {
        heading1: {
          run: {
            size: 32,
            bold: true,
            color: COLORS.primary,
          },
          paragraph: {
            spacing: { before: 400, after: 200 },
          },
        },
        heading2: {
          run: {
            size: 26,
            bold: true,
            color: COLORS.secondary,
          },
          paragraph: {
            spacing: { before: 300, after: 150 },
          },
        },
        heading3: {
          run: {
            size: 24,
            bold: true,
            color: COLORS.black,
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
        document: {
          run: {
            size: 22,
            font: 'Calibri',
          },
        },
      },
    },
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
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${data.companyName} - ${data.title}`,
                    size: 18,
                    color: COLORS.gray,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: COLORS.gray,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: COLORS.gray,
                  }),
                  new TextRun({
                    text: ' sur ',
                    size: 18,
                    color: COLORS.gray,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: COLORS.gray,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  })

  // Générer le buffer
  const buffer = await Packer.toBuffer(doc)
  return buffer
}
