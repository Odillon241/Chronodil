import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import dns from 'dns/promises'
import { isIP } from 'net'

// Cache en mémoire pour les previews (5 minutes)
const previewCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Liste des hostnames internes bloques (SSRF protection)
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'local',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '::ffff:127.0.0.1',
  '[::1]',
  '[::ffff:127.0.0.1]',
])

/**
 * Verifie si une adresse IPv4 est dans une plage privee/interne
 * Bloque: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x, 169.254.x.x, 0.x.x.x
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true // IP invalide = bloquer par securite
  }

  const [a, b] = parts

  // Loopback: 127.0.0.0/8
  if (a === 127) return true

  // Private Class A: 10.0.0.0/8
  if (a === 10) return true

  // Private Class B: 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  if (a === 172 && b >= 16 && b <= 31) return true

  // Private Class C: 192.168.0.0/16
  if (a === 192 && b === 168) return true

  // Link-local / APIPA: 169.254.0.0/16 (AWS/GCP metadata)
  if (a === 169 && b === 254) return true

  // Current network: 0.0.0.0/8
  if (a === 0) return true

  // Broadcast: 255.255.255.255
  if (parts.every((p) => p === 255)) return true

  return false
}

/**
 * Verifie si une adresse IPv6 est privee/interne
 * Bloque: ::1, fe80::/10, fc00::/7, ::ffff:x.x.x.x (IPv4-mapped)
 */
function isPrivateIPv6(ip: string): boolean {
  // Normaliser l'adresse (retirer les crochets si presents)
  const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase()

  // Loopback ::1
  if (cleanIp === '::1') return true

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (cleanIp.startsWith('::ffff:')) {
    const ipv4Part = cleanIp.slice(7)
    if (isIP(ipv4Part) === 4) {
      return isPrivateIPv4(ipv4Part)
    }
    return true // Format invalide = bloquer
  }

  // Expander les :: pour analyser
  const fullAddress = expandIPv6(cleanIp)
  if (!fullAddress) return true // Invalide = bloquer

  const firstSegment = parseInt(fullAddress.split(':')[0], 16)

  // Link-local: fe80::/10
  if ((firstSegment & 0xffc0) === 0xfe80) return true

  // Unique Local Address (ULA): fc00::/7
  if ((firstSegment & 0xfe00) === 0xfc00) return true

  // Loopback: ::1/128 (deja gere mais au cas ou)
  if (fullAddress === '0000:0000:0000:0000:0000:0000:0000:0001') return true

  // Unspecified: ::/128
  if (fullAddress === '0000:0000:0000:0000:0000:0000:0000:0000') return true

  return false
}

/**
 * Expande une adresse IPv6 compacte en forme complete
 */
function expandIPv6(ip: string): string | null {
  try {
    // Gerer le cas :: (double colon)
    if (ip.includes('::')) {
      const [left, right] = ip.split('::')
      const leftParts = left ? left.split(':') : []
      const rightParts = right ? right.split(':') : []
      const missingCount = 8 - leftParts.length - rightParts.length

      if (missingCount < 0) return null

      const middleParts = Array(missingCount).fill('0000')
      const allParts = [...leftParts, ...middleParts, ...rightParts]

      return allParts.map((p) => p.padStart(4, '0')).join(':')
    }

    const parts = ip.split(':')
    if (parts.length !== 8) return null

    return parts.map((p) => p.padStart(4, '0')).join(':')
  } catch {
    return null
  }
}

/**
 * Verifie si une URL pointe vers une adresse interne (SSRF protection)
 * Resout le DNS pour detecter les redirections vers des IPs privees
 */
async function isInternalUrl(url: URL): Promise<{ blocked: boolean; reason?: string }> {
  const hostname = url.hostname.toLowerCase()

  // Verifier les hostnames connus comme internes
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { blocked: true, reason: 'Adresse interne bloquee' }
  }

  // Verifier si c'est une IP directe
  const ipVersion = isIP(hostname)

  if (ipVersion === 4) {
    if (isPrivateIPv4(hostname)) {
      return { blocked: true, reason: 'Adresse IPv4 privee bloquee' }
    }
  } else if (ipVersion === 6 || hostname.startsWith('[')) {
    // IPv6 (avec ou sans crochets)
    if (isPrivateIPv6(hostname)) {
      return { blocked: true, reason: 'Adresse IPv6 privee bloquee' }
    }
  } else {
    // C'est un hostname - resoudre le DNS pour verifier l'IP reelle
    try {
      const addresses = await dns.resolve4(hostname).catch(() => [])
      const addresses6 = await dns.resolve6(hostname).catch(() => [])

      // Verifier toutes les adresses IPv4 resolues
      for (const addr of addresses) {
        if (isPrivateIPv4(addr)) {
          return {
            blocked: true,
            reason: `Le domaine ${hostname} resout vers une adresse privee (${addr})`,
          }
        }
      }

      // Verifier toutes les adresses IPv6 resolues
      for (const addr of addresses6) {
        if (isPrivateIPv6(addr)) {
          return {
            blocked: true,
            reason: `Le domaine ${hostname} resout vers une adresse IPv6 privee`,
          }
        }
      }
    } catch {
      // Si la resolution DNS echoue, on laisse passer (sera gere par le fetch)
    }
  }

  return { blocked: false }
}

interface OpenGraphData {
  title?: string
  description?: string
  image?: string
  url?: string
  siteName?: string
  type?: string
}

/**
 * Extrait les meta tags OpenGraph d'une page HTML
 */
function extractOpenGraphData(html: string, url: string): OpenGraphData {
  const ogData: OpenGraphData = {
    url,
  }

  // Regex pour extraire les meta tags OpenGraph
  const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi
  const twitterRegex = /<meta\s+name=["']twitter:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi
  const titleRegex = /<title[^>]*>([^<]+)<\/title>/i
  const descriptionRegex = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?>/i

  // Extraire les balises OpenGraph
  let match
  while ((match = ogRegex.exec(html)) !== null) {
    const [, property, content] = match

    switch (property) {
      case 'title':
        ogData.title = content
        break
      case 'description':
        ogData.description = content
        break
      case 'image':
        ogData.image = content
        break
      case 'url':
        ogData.url = content
        break
      case 'site_name':
        ogData.siteName = content
        break
      case 'type':
        ogData.type = content
        break
    }
  }

  // Fallback sur les balises Twitter si OpenGraph manquant
  while ((match = twitterRegex.exec(html)) !== null) {
    const [, property, content] = match

    switch (property) {
      case 'title':
        if (!ogData.title) ogData.title = content
        break
      case 'description':
        if (!ogData.description) ogData.description = content
        break
      case 'image':
        if (!ogData.image) ogData.image = content
        break
    }
  }

  // Fallback sur les balises HTML standards
  if (!ogData.title) {
    const titleMatch = titleRegex.exec(html)
    if (titleMatch) ogData.title = titleMatch[1]
  }

  if (!ogData.description) {
    const descMatch = descriptionRegex.exec(html)
    if (descMatch) ogData.description = descMatch[1]
  }

  // Normaliser l'URL de l'image (relative -> absolue)
  if (ogData.image && !ogData.image.startsWith('http')) {
    try {
      const baseUrl = new URL(url)
      ogData.image = new URL(ogData.image, baseUrl.origin).toString()
    } catch (_e) {
      // Ignorer les erreurs de parsing d'URL
    }
  }

  return ogData
}

/**
 * Route API pour récupérer les previews de liens (OpenGraph)
 * GET /api/link-preview?url=https://example.com
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'URL depuis les query params
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
    }

    // Valider l'URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
      // Autoriser seulement HTTP et HTTPS
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Protocole non autorisé')
      }
    } catch (_e) {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 })
    }

    // SSRF Protection: Verifier que l'URL n'est pas interne
    const ssrfCheck = await isInternalUrl(validUrl)
    if (ssrfCheck.blocked) {
      console.warn(`[SSRF Protection] Requete bloquee vers ${url}: ${ssrfCheck.reason}`)
      return NextResponse.json(
        { error: 'URL non autorisee: adresses internes bloquees' },
        { status: 400 },
      )
    }

    // Vérifier le cache
    const cached = previewCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Fetch la page HTML (URL validee contre SSRF)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChronodilBot/1.0; +https://chronodil.com)',
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erreur HTTP: ${response.status}` },
        { status: response.status },
      )
    }

    const html = await response.text()

    // Extraire les données OpenGraph
    const ogData = extractOpenGraphData(html, url)

    // Mettre en cache
    previewCache.set(url, {
      data: ogData,
      timestamp: Date.now(),
    })

    // Nettoyer le cache (garder seulement les 100 dernières entrées)
    if (previewCache.size > 100) {
      const sortedEntries = Array.from(previewCache.entries()).sort(
        (a, b) => b[1].timestamp - a[1].timestamp,
      )

      previewCache.clear()
      sortedEntries.slice(0, 100).forEach(([key, value]) => {
        previewCache.set(key, value)
      })
    }

    return NextResponse.json(ogData)
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la preview:', error)

    // Timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Timeout lors de la récupération de la page' },
        { status: 504 },
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la preview' },
      { status: 500 },
    )
  }
}
