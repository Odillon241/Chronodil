// Types pour les projets
export interface Department {
  id: string
  name: string
  code: string
}

export interface User {
  id: string
  name: string | null
  email: string
  role: string
  avatar?: string | null
  image?: string | null
  department?: Department | null
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: string | null
  User: User
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  code: string
  description: string | null
  color: string | null
  isActive: boolean
  departmentId: string | null
  budgetHours: number | null
  hourlyRate: number | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  Department?: Department | null
  User?: User | null // Créateur du projet
  ProjectMember?: ProjectMember[]
  usedHours?: number
  _count?: {
    Task: number
  }
}

export interface ProjectWithMembers extends Project {
  members: Array<{
    id: string
    role: string | null
    user: User
  }>
}

export type ProjectViewMode = 'grid' | 'list' | 'table'

export type ProjectSortField = 'name' | 'code' | 'createdAt' | 'budgetHours' | 'progress'
export type SortOrder = 'asc' | 'desc'

export interface ProjectFilters {
  search: string
  departmentId?: string
  isActive?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  totalBudgetHours: number
  totalUsedHours: number
  averageProgress: number
}
