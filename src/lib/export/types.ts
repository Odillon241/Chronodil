/**
 * Interface pour les données du rapport utilisée par tous les exports
 */
export interface ReportData {
  /** Titre principal du rapport */
  title: string
  /** Contenu HTML du rapport */
  content: string
  /** Période couverte (ex: "01/01/2026 - 31/01/2026" ou "Janvier 2026") */
  period?: string
  /** Nom de l'auteur du rapport */
  author?: string
  /** Date de création du rapport */
  createdAt?: Date
  /** Métadonnées additionnelles */
  metadata?: {
    /** Type de rapport: WEEKLY, MONTHLY, INDIVIDUAL */
    reportType?: 'WEEKLY' | 'MONTHLY' | 'INDIVIDUAL' | string | null
    /** Format de sortie: word, excel, pdf */
    format?: 'word' | 'excel' | 'pdf' | string
    /** Inclure un résumé statistique */
    includeSummary?: boolean
    /** Autres métadonnées */
    [key: string]: any
  }
  /** Liste des activités (utilisé pour l'export Excel) */
  activities?: Array<{
    /** Nom de l'activité */
    name: string
    /** Type d'activité (ex: "Développement", "Réunion") */
    type: string
    /** Périodicité: DAILY, WEEKLY, MONTHLY, ONE_TIME */
    periodicity: string
    /** Nombre d'heures */
    hours: number
    /** Statut: "Terminée" ou "En cours" */
    status: string
    /** Date de début (optionnel) */
    startDate?: Date
    /** Date de fin (optionnel) */
    endDate?: Date
  }>
}

/**
 * Interface pour les statistiques du rapport
 */
export interface ReportStatistics {
  /** Total des heures travaillées */
  totalHours: number
  /** Nombre de semaines couvertes */
  weekCount: number
  /** Nombre total d'activités */
  totalActivities: number
  /** Nombre d'activités terminées */
  completedActivities: number
  /** Moyenne d'heures par semaine */
  averageHoursPerWeek: number
  /** Répartition par type d'activité */
  byType: Record<string, { count: number; hours: number }>
}

/**
 * Options d'export
 */
export interface ExportOptions {
  /** Inclure l'en-tête avec logo/nom entreprise */
  includeHeader?: boolean
  /** Inclure le pied de page avec numéros de page */
  includeFooter?: boolean
  /** Inclure la table des matières (pour multi-rapports) */
  includeTableOfContents?: boolean
  /** Nom de l'entreprise pour l'en-tête */
  companyName?: string
  /** Langue du document */
  locale?: 'fr' | 'en'
}
