/**
 * Configuration de version de l'application
 * Centralise les informations de version pour l'affichage dans l'UI
 */

// Utilise la variable d'environnement exposée par next.config.mjs
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'

export const APP_INFO = {
  name: 'Chronodil',
  version: APP_VERSION,
  description: 'Application de gestion des feuilles de temps',
  author: 'Odillon',
  repository: 'https://github.com/odillon/chronodil-app',
  license: 'Proprietary',
} as const

/**
 * Retourne la version formatée pour l'affichage
 * @example "v0.1.0"
 */
export function getFormattedVersion(): string {
  return `v${APP_VERSION}`
}

/**
 * Retourne les informations complètes de version
 */
export function getVersionInfo() {
  return {
    ...APP_INFO,
    formattedVersion: getFormattedVersion(),
    buildDate: process.env.BUILD_DATE || new Date().toISOString().split('T')[0],
    nodeEnv: process.env.NODE_ENV,
  }
}
