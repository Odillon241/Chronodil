import { createSafeActionClient } from 'next-safe-action'
import { getSession, getUserRole } from './auth'
import { checkServerActionRateLimit } from './rate-limiter'
import { logSecurityEvent, logUnauthorizedAccess } from './security'

// ✅ SÉCURITÉ: Liste des messages d'erreur génériques pour la production
// Ne pas exposer de détails internes aux utilisateurs
const GENERIC_ERROR_MESSAGE = 'Une erreur est survenue'
const UNAUTHORIZED_MESSAGE = 'Non autorisé'
const RATE_LIMIT_MESSAGE = 'Trop de requêtes, veuillez réessayer plus tard'

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    // ✅ SÉCURITÉ: En production, ne pas exposer les messages d'erreur détaillés
    if (process.env.NODE_ENV === 'production') {
      // Logger l'erreur pour le debugging
      console.error('[SafeAction Error]', error)

      // Retourner un message générique pour les erreurs système
      if (error instanceof Error) {
        // Autoriser certains messages d'erreur métier spécifiques
        const allowedMessages = [
          'Non autorisé',
          'Unauthorized',
          'Trop de',
          'déjà existe',
          'non trouvé',
          'non modifiable',
          'non supprimable',
          'permission',
          'Fichier trop',
          'Type de fichier',
        ]

        const isAllowedMessage = allowedMessages.some((msg) =>
          error.message.toLowerCase().includes(msg.toLowerCase()),
        )

        if (isAllowedMessage) {
          return error.message
        }

        return GENERIC_ERROR_MESSAGE
      }
      return GENERIC_ERROR_MESSAGE
    }

    // En développement, retourner le message d'erreur complet
    if (error instanceof Error) {
      return error.message
    }
    return GENERIC_ERROR_MESSAGE
  },
})

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await getSession()
  const userRole = getUserRole(session)

  if (!session) {
    // ✅ SÉCURITÉ: Logger les tentatives non autorisées
    logSecurityEvent({
      type: 'unauthorized_access',
      severity: 'medium',
      details: { reason: 'No session in server action' },
    })
    throw new Error(UNAUTHORIZED_MESSAGE)
  }

  // ✅ SÉCURITÉ: Rate limiting par utilisateur pour les server actions
  const rateLimitResult = checkServerActionRateLimit(session.user.id)
  if (!rateLimitResult.allowed) {
    logSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      userId: session.user.id,
      details: { retryAfter: rateLimitResult.retryAfter },
    })
    throw new Error(`${RATE_LIMIT_MESSAGE} (${rateLimitResult.retryAfter}s)`)
  }

  return next({
    ctx: {
      userId: session.user.id,
      userRole: userRole as string,
      user: session.user,
    },
  })
})

// ✅ SÉCURITÉ: Client pour les actions admin uniquement
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.userRole !== 'ADMIN') {
    logUnauthorizedAccess(ctx.userId, 'admin_action', 'access_denied')
    throw new Error('Accès réservé aux administrateurs')
  }

  return next({ ctx })
})

// ✅ SÉCURITÉ: Client pour les actions manager/admin
export const managerActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (!['ADMIN', 'MANAGER', 'DIRECTEUR'].includes(ctx.userRole)) {
    logUnauthorizedAccess(ctx.userId, 'manager_action', 'access_denied')
    throw new Error('Accès réservé aux managers et administrateurs')
  }

  return next({ ctx })
})
