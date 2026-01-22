// Types pour le module Reports

export type ReportFormat = 'pdf' | 'word' | 'excel'
export type ReportType = 'WEEKLY' | 'MONTHLY' | 'INDIVIDUAL' | null
export type ReportFrequency = 'WEEKLY' | 'MONTHLY' | 'INDIVIDUAL'

export interface ReportUser {
  id: string
  name: string | null
  email: string
}

export interface ReportTemplate {
  id: string
  name: string
  description: string | null
  frequency: ReportFrequency
  format: string
  templateContent: string
  variables: unknown
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  User: ReportUser
  _count: {
    Report: number
  }
}

export interface ReportRecipient {
  id: string
  email: string
  name: string | null
  status: string
  sentAt: Date
  User?: ReportUser | null
}

export interface ReportHRTimesheet {
  id: string
  weekStartDate: Date
  weekEndDate: Date
  employeeName: string
}

export interface Report {
  id: string
  title: string
  content: string
  format: ReportFormat
  period: string | null
  includeSummary: boolean
  fileSize: number
  reportType: ReportType
  createdAt: Date
  updatedAt: Date
  createdById: string
  templateId: string | null
  hrTimesheetId: string | null
  User: ReportUser
  ReportTemplate?: {
    id: string
    name: string
  } | null
  HRTimesheet?: ReportHRTimesheet | null
  ReportRecipient?: ReportRecipient[]
}

export interface ReportStats {
  total: number
  weekly: number
  monthly: number
  individual: number
  byFormat: {
    pdf: number
    word: number
    excel: number
  }
  thisMonth: number
  thisYear: number
}

export interface ReportFilters {
  search: string
  type: ReportType | 'all'
  format: ReportFormat | 'all'
  period: 'all' | 'thisMonth' | 'thisYear' | 'custom'
  startDate?: Date
  endDate?: Date
}

export type ReportViewMode = 'list' | 'calendar'
