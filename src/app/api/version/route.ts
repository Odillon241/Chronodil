/**
 * API Route pour récupérer la version de l'application
 * Utilisé par les clients pour vérifier si une mise à jour est disponible
 */

import { NextResponse } from 'next/server'
import { getVersionInfo } from '@/lib/version'

export const dynamic = 'force-dynamic' // Toujours exécuter côté serveur
export const revalidate = 0 // Pas de cache

export async function GET() {
  try {
    const versionInfo = getVersionInfo()

    return NextResponse.json(
      {
        success: true,
        data: {
          version: versionInfo.version,
          formattedVersion: versionInfo.formattedVersion,
          buildDate: versionInfo.buildDate,
          nodeEnv: versionInfo.nodeEnv,
          name: versionInfo.name,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
  } catch (error) {
    console.error('[API /version] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve version information',
      },
      { status: 500 },
    )
  }
}
