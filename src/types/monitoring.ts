/**
 * Types pour le module de Monitoring temps réel
 * Dashboard /dashboard/audit
 */

// ============================================
// FILTRES DE MONITORING
// ============================================

export interface MonitoringFilters {
  entity?: string
  action?: string
  userId?: string
  departmentId?: string
  startDate?: string
  endDate?: string
  search?: string
}

// ============================================
// STATISTIQUES DE MONITORING
// ============================================

export interface MonitoringStats {
  eventsLast24h: number
  eventsLastHour: number
  usersOnline: number
  activeAlerts: number
  securityEvents: number
  totalUsers: number
}

export interface ActionStats {
  action: string
  count: number
  percentage: number
}

export interface EntityStats {
  entity: string
  count: number
  percentage: number
}

export interface HourlyActivity {
  hour: number
  count: number
}

// ============================================
// DEPARTEMENTS
// ============================================

export interface DepartmentStats {
  departmentId: string
  departmentName: string
  userCount: number
  activeUsers: number
  eventsLast24h: number
  topPerformers: DepartmentTopPerformer[]
  recentActivity: DepartmentRecentActivity[]
}

export interface DepartmentTopPerformer {
  userId: string
  userName: string
  userEmail: string
  eventCount: number
}

export interface DepartmentRecentActivity {
  id: string
  action: string
  entity: string
  userId: string
  userName: string
  createdAt: Date
}

// ============================================
// SECURITE
// ============================================

export interface SecurityEventAggregation {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
  lastOccurred: Date
}

export interface SecuritySummary {
  authFailures: number
  rateLimitHits: number
  unauthorizedAccess: number
  xssAttempts: number
  criticalEvents: number
  lastSecurityEvent: Date | null
}

// ============================================
// ALERTES
// ============================================

export interface AlertConfig {
  id: string
  name: string
  type: 'threshold' | 'anomaly' | 'security'
  enabled: boolean
  threshold?: number
  metric: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  updatedAt: Date
}

export interface AlertTriggered {
  id: string
  alertConfigId: string
  alertName: string
  triggeredAt: Date
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  message: string
}

// ============================================
// SANTE SYSTEME
// ============================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  lastSync: Date
  realtimeConnected: boolean
  databaseResponseMs: number
  activeConnections: number
}

// ============================================
// AUDIT LOG (avec user inclus)
// ============================================

export interface AuditLogWithUser {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string
  changes: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  User: {
    id: string
    name: string
    email: string
    departmentId: string | null
  } | null
}

// ============================================
// REALTIME
// ============================================

export interface RealtimeAuditEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  record: AuditLogWithUser
  timestamp: Date
}

export interface ConnectionStatus {
  connected: boolean
  lastConnected: Date | null
  reconnectAttempts: number
  error: string | null
}

// ============================================
// CONFIGURATION UI
// ============================================

export const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  CREATE: { label: 'Création', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  UPDATE: { label: 'Modification', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  DELETE: { label: 'Suppression', color: 'text-red-700', bgColor: 'bg-red-100' },
  LOGIN: { label: 'Connexion', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  LOGOUT: { label: 'Déconnexion', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

export const ENTITY_CONFIG: Record<string, string> = {
  User: 'Utilisateur',
  Project: 'Projet',
  Task: 'Tâche',
  HRTimesheet: 'Feuille de temps RH',
  Message: 'Message',
  Settings: 'Paramètres',
  Conversation: 'Conversation',
  Notification: 'Notification',
}

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Faible', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  medium: { label: 'Moyen', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { label: 'Élevé', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  critical: { label: 'Critique', color: 'text-red-700', bgColor: 'bg-red-100' },
}
