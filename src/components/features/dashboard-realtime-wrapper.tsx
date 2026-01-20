'use client'

import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

/**
 * Composant wrapper pour gérer le real-time sur le dashboard
 * Comme le dashboard est un Server Component, ce composant client
 * gère les mises à jour en temps réel et rafraîchit la page
 */
export function DashboardRealtimeWrapper() {
  const { data: session } = useSession()
  const router = useRouter()

  useRealtimeDashboard({
    onDataChange: (_source, _eventType, _id) => {
      // Rafraîchir la page pour recharger les données du serveur
      router.refresh()
    },
    userId: session?.user?.id,
  })

  // Ce composant ne rend rien, il gère juste le real-time
  return null
}
