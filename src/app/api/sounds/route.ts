import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'

/**
 * Configuration rate limiting pour l'API sounds
 * Plus restrictif que l'API générale car endpoint moins fréquemment utilisé
 */
const SOUNDS_RATE_LIMIT = {
  maxRequests: 10, // 10 requêtes max
  windowMs: 60 * 1000, // par minute
  blockDurationMs: 5 * 60 * 1000, // 5 minutes de blocage si dépassé
}

/**
 * GET /api/sounds
 * Liste les fichiers audio disponibles dans le répertoire public/sounds
 *
 * Sécurité:
 * - Authentification requise (401 si non connecté)
 * - Rate limiting: 10 requêtes/minute par utilisateur (429 si dépassé)
 */
export async function GET(_request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Appliquer le rate limiting basé sur l'userId
    const userId = session.user.id
    const rateLimitResult = checkRateLimit(`sounds:${userId}`, SOUNDS_RATE_LIMIT)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(SOUNDS_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    // 3. Traitement de la requête
    const soundsDir = path.join(process.cwd(), 'public', 'sounds')

    // Vérifier que le répertoire existe
    if (!fs.existsSync(soundsDir)) {
      return NextResponse.json({ error: 'Sounds directory not found' }, { status: 404 })
    }

    // Lire les fichiers du répertoire
    const files = fs.readdirSync(soundsDir)

    // Filtrer pour ne garder que les fichiers audio
    const audioFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)
    })

    // Extraire les IDs (noms sans extension)
    const soundIds = audioFiles.map((file) => {
      const nameWithoutExt = path.parse(file).name
      return {
        id: nameWithoutExt,
        filename: file,
        url: `/sounds/${file}`,
      }
    })

    // Ajouter les headers de rate limiting dans la réponse
    return NextResponse.json(soundIds, {
      headers: {
        'X-RateLimit-Limit': String(SOUNDS_RATE_LIMIT.maxRequests),
        'X-RateLimit-Remaining': String(rateLimitResult.remainingRequests),
      },
    })
  } catch (error) {
    console.error('[GET /api/sounds] Error:', error)
    return NextResponse.json({ error: 'Failed to list sounds' }, { status: 500 })
  }
}
