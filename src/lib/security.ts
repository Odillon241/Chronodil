/**
 * ✅ SÉCURITÉ: Module de sécurité centralisé
 * Contient les fonctions de validation, sanitisation et protection
 */

import { z } from 'zod'

// ============================================
// CONFIGURATION
// ============================================

// Types MIME autorisés pour les uploads
const MIME_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'] as const

const MIME_DOCUMENTS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const

export const ALLOWED_MIME_TYPES = {
  images: MIME_IMAGES,
  documents: MIME_DOCUMENTS,
  all: [...MIME_IMAGES, ...MIME_DOCUMENTS],
} as const

// Tailles maximales par type (en bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5 MB
  document: 10 * 1024 * 1024, // 10 MB
  avatar: 2 * 1024 * 1024, // 2 MB
} as const

// ============================================
// SANITISATION HTML
// ============================================

/**
 * Tags HTML autorisés pour la sanitisation
 */
const _ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'span',
  'div',
]

/**
 * Attributs HTML autorisés
 */
const _ALLOWED_ATTRS = ['href', 'target', 'rel', 'class']

/**
 * Sanitise le contenu HTML pour éviter les XSS (version serveur légère)
 * Note: Pour une sanitisation complète côté client, utiliser DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Supprimer les scripts et event handlers
  const sanitized = html
    // Supprimer les balises script
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Supprimer les event handlers (onclick, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
    // Supprimer javascript: dans les attributs
    .replace(/javascript:/gi, '')
    // Supprimer data: dans les attributs (sauf pour images base64 légitimes)
    .replace(/data:(?!image\/(?:png|jpeg|jpg|gif|webp);base64,)/gi, '')
    // Supprimer les balises style avec du contenu potentiellement dangereux
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Supprimer les attributs style avec expression() ou url()
    .replace(/style\s*=\s*["'][^"']*(?:expression|url)\s*\([^)]*\)[^"']*["']/gi, '')

  return sanitized
}

/**
 * Sanitise le contenu en supprimant tout le HTML
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// ============================================
// VALIDATION DES ENTRÉES
// ============================================

/**
 * Valide et sanitise une adresse email
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string } {
  const sanitized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return {
    valid: emailRegex.test(sanitized) && sanitized.length <= 254,
    sanitized,
  }
}

/**
 * Valide un nom d'utilisateur ou texte simple
 */
export function validateName(name: string, maxLength = 100): { valid: boolean; sanitized: string } {
  const sanitized = stripHtml(name).trim().slice(0, maxLength)
  // Autoriser lettres, chiffres, espaces, tirets, apostrophes, accents
  const nameRegex = /^[\p{L}\p{N}\s\-'.]+$/u
  return {
    valid: sanitized.length >= 1 && nameRegex.test(sanitized),
    sanitized,
  }
}

/**
 * Valide un UUID
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Valide un ID nanoid (21 caractères alphanumériques)
 */
export function validateNanoid(id: string): boolean {
  const nanoidRegex = /^[A-Za-z0-9_-]{21}$/
  return nanoidRegex.test(id)
}

/**
 * Valide un identifiant (UUID ou nanoid)
 */
export function validateId(id: string): boolean {
  return validateUUID(id) || validateNanoid(id)
}

// ============================================
// VALIDATION DES FICHIERS
// ============================================

/**
 * Valide un fichier uploadé
 */
export function validateFile(
  file: { name: string; type: string; size: number },
  options: {
    allowedTypes?: readonly string[]
    maxSize?: number
  } = {},
): { valid: boolean; error?: string } {
  const { allowedTypes = ALLOWED_MIME_TYPES.all, maxSize = MAX_FILE_SIZES.document } = options

  // Vérifier le type MIME
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Type de fichier non autorisé: ${file.type}` }
  }

  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024)
    return { valid: false, error: `Fichier trop volumineux (max ${maxSizeMB} MB)` }
  }

  // Vérifier le nom de fichier (pas de caractères dangereux)
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
  if (dangerousChars.test(file.name)) {
    return { valid: false, error: 'Nom de fichier invalide' }
  }

  // Vérifier l'extension double (ex: file.php.jpg)
  const nameParts = file.name.split('.')
  if (nameParts.length > 2) {
    const suspiciousExtensions = ['php', 'exe', 'js', 'sh', 'bat', 'cmd', 'ps1']
    for (let i = 0; i < nameParts.length - 1; i++) {
      if (suspiciousExtensions.includes(nameParts[i].toLowerCase())) {
        return { valid: false, error: 'Extension de fichier suspecte détectée' }
      }
    }
  }

  return { valid: true }
}

/**
 * Valide une image uploadée
 */
export function validateImage(
  file: { name: string; type: string; size: number },
  maxSize = MAX_FILE_SIZES.image,
): { valid: boolean; error?: string } {
  return validateFile(file, {
    allowedTypes: ALLOWED_MIME_TYPES.images,
    maxSize,
  })
}

/**
 * Valide un avatar
 */
export function validateAvatar(file: { name: string; type: string; size: number }): {
  valid: boolean
  error?: string
} {
  return validateImage(file, MAX_FILE_SIZES.avatar)
}

// ============================================
// PROTECTION CSRF
// ============================================

/**
 * Génère un token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback pour environnement serveur
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Valide un token CSRF
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false
  }
  // Comparaison en temps constant pour éviter les timing attacks
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i)
  }
  return result === 0
}

// ============================================
// SCHÉMAS ZOD SÉCURISÉS
// ============================================

/**
 * Schéma Zod pour email sécurisé
 */
export const secureEmailSchema = z
  .string()
  .email('Email invalide')
  .max(254, 'Email trop long')
  .transform((email) => email.trim().toLowerCase())

/**
 * Schéma Zod pour mot de passe sécurisé
 */
export const securePasswordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe est trop long')
  .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre')
  .regex(/[^a-zA-Z0-9]/, 'Le mot de passe doit contenir un caractère spécial')

/**
 * Schéma Zod pour ID sécurisé
 */
export const secureIdSchema = z.string().refine((id) => validateId(id), 'ID invalide')

/**
 * Schéma Zod pour nom/texte sécurisé
 */
export const secureNameSchema = z
  .string()
  .min(1, 'Ce champ est requis')
  .max(100, 'Texte trop long')
  .transform((name) => stripHtml(name).trim())

/**
 * Schéma Zod pour contenu HTML sécurisé
 */
export const secureHtmlSchema = z
  .string()
  .max(10000, 'Contenu trop long')
  .transform((html) => sanitizeHtml(html))

// ============================================
// LOGGING DE SÉCURITÉ
// ============================================

export interface SecurityEvent {
  type:
    | 'auth_failure'
    | 'rate_limit'
    | 'xss_attempt'
    | 'sql_injection'
    | 'invalid_input'
    | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ip?: string
  userAgent?: string
  details: Record<string, unknown>
  timestamp: Date
}

/**
 * Log un événement de sécurité
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  }

  // En production, envoyer vers un service de logging (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY]', JSON.stringify(fullEvent))
    // TODO: Envoyer vers un service de monitoring
  } else {
    console.warn('[SECURITY]', fullEvent)
  }
}

/**
 * Log une tentative d'authentification échouée
 */
export function logAuthFailure(email: string, ip?: string, reason?: string): void {
  logSecurityEvent({
    type: 'auth_failure',
    severity: 'medium',
    ip,
    details: {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Masquer partiellement
      reason,
    },
  })
}

/**
 * Log une tentative de rate limiting
 */
export function logRateLimitHit(identifier: string, endpoint: string, ip?: string): void {
  logSecurityEvent({
    type: 'rate_limit',
    severity: 'medium',
    ip,
    details: {
      identifier,
      endpoint,
    },
  })
}

/**
 * Log un accès non autorisé
 */
export function logUnauthorizedAccess(userId: string, resource: string, action: string): void {
  logSecurityEvent({
    type: 'unauthorized_access',
    severity: 'high',
    userId,
    details: {
      resource,
      action,
    },
  })
}
