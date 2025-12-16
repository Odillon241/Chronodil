import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function parseTimeToHours(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours + minutes / 60
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Récupère l'adresse IP du client depuis les headers Next.js
 * Gère les proxies et load balancers (x-forwarded-for, x-real-ip)
 */
export function getClientIP(headers: Headers): string | null {
  // Vérifier x-forwarded-for (utilisé par les proxies et load balancers)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for peut contenir plusieurs IPs séparées par des virgules
    // La première est généralement l'IP originale du client
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0] || null
  }

  // Vérifier x-real-ip (utilisé par certains proxies)
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Vérifier cf-connecting-ip (Cloudflare)
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP.trim()
  }

  // Vérifier x-client-ip
  const clientIP = headers.get('x-client-ip')
  if (clientIP) {
    return clientIP.trim()
  }

  return null
}
