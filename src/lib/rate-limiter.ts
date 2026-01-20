/**
 * ✅ SÉCURITÉ: Rate Limiter pour protection contre les attaques par force brute
 * Utilise un stockage en mémoire avec nettoyage automatique
 */

interface RateLimitEntry {
  count: number
  firstRequest: number
  blocked: boolean
  blockExpires?: number
}

interface RateLimiterConfig {
  maxRequests: number // Nombre max de requêtes
  windowMs: number // Fenêtre de temps en ms
  blockDurationMs: number // Durée du blocage en ms
}

// Stockage en mémoire des tentatives (en production, utiliser Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Nettoyage automatique toutes les 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000

// Configurations par type d'endpoint
export const RATE_LIMIT_CONFIGS = {
  // Authentification - très strict
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes de blocage
  },
  // API générale
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes de blocage
  },
  // Server Actions
  serverAction: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000, // 2 minutes de blocage
  },
  // Upload de fichiers
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000, // 10 minutes de blocage
  },
} as const

/**
 * Vérifie si une requête doit être limitée
 * @param identifier - Identifiant unique (IP, userId, etc.)
 * @param config - Configuration du rate limiter
 * @returns true si la requête est autorisée, false si elle doit être bloquée
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimiterConfig,
): { allowed: boolean; remainingRequests: number; retryAfter?: number } {
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // Vérifier si l'utilisateur est bloqué
  if (entry?.blocked && entry.blockExpires && entry.blockExpires > now) {
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfter: Math.ceil((entry.blockExpires - now) / 1000),
    }
  }

  // Réinitialiser si la fenêtre est expirée ou si le blocage est terminé
  if (
    !entry ||
    now - entry.firstRequest > config.windowMs ||
    (entry.blocked && entry.blockExpires && entry.blockExpires <= now)
  ) {
    entry = {
      count: 1,
      firstRequest: now,
      blocked: false,
    }
    rateLimitStore.set(key, entry)
    return {
      allowed: true,
      remainingRequests: config.maxRequests - 1,
    }
  }

  // Incrémenter le compteur
  entry.count++

  // Vérifier si la limite est dépassée
  if (entry.count > config.maxRequests) {
    entry.blocked = true
    entry.blockExpires = now + config.blockDurationMs
    rateLimitStore.set(key, entry)

    return {
      allowed: false,
      remainingRequests: 0,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
    }
  }

  rateLimitStore.set(key, entry)
  return {
    allowed: true,
    remainingRequests: config.maxRequests - entry.count,
  }
}

/**
 * Rate limiter pour l'authentification
 */
export function checkAuthRateLimit(identifier: string) {
  return checkRateLimit(`auth:${identifier}`, RATE_LIMIT_CONFIGS.auth)
}

/**
 * Rate limiter pour les API
 */
export function checkApiRateLimit(identifier: string) {
  return checkRateLimit(`api:${identifier}`, RATE_LIMIT_CONFIGS.api)
}

/**
 * Rate limiter pour les Server Actions
 */
export function checkServerActionRateLimit(identifier: string) {
  return checkRateLimit(`action:${identifier}`, RATE_LIMIT_CONFIGS.serverAction)
}

/**
 * Rate limiter pour les uploads
 */
export function checkUploadRateLimit(identifier: string) {
  return checkRateLimit(`upload:${identifier}`, RATE_LIMIT_CONFIGS.upload)
}

/**
 * Réinitialiser le rate limit pour un identifiant (après login réussi)
 */
export function resetRateLimit(
  identifier: string,
  type: 'auth' | 'api' | 'serverAction' | 'upload' = 'auth',
) {
  rateLimitStore.delete(`${type}:${identifier}`)
}

/**
 * Nettoyer les entrées expirées
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  const maxAge = Math.max(
    RATE_LIMIT_CONFIGS.auth.windowMs + RATE_LIMIT_CONFIGS.auth.blockDurationMs,
    RATE_LIMIT_CONFIGS.api.windowMs + RATE_LIMIT_CONFIGS.api.blockDurationMs,
    RATE_LIMIT_CONFIGS.serverAction.windowMs + RATE_LIMIT_CONFIGS.serverAction.blockDurationMs,
    RATE_LIMIT_CONFIGS.upload.windowMs + RATE_LIMIT_CONFIGS.upload.blockDurationMs,
  )

  for (const [key, entry] of rateLimitStore.entries()) {
    const entryAge = now - entry.firstRequest
    const blockExpired = entry.blockExpires ? entry.blockExpires <= now : true

    if (entryAge > maxAge && blockExpired) {
      rateLimitStore.delete(key)
    }
  }
}

// Démarrer le nettoyage automatique
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL)
}

/**
 * Obtenir les statistiques du rate limiter (pour monitoring)
 */
export function getRateLimitStats() {
  return {
    totalEntries: rateLimitStore.size,
    blockedEntries: Array.from(rateLimitStore.values()).filter((e) => e.blocked).length,
  }
}
