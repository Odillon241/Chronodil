'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { MonitoringDashboard } from '@/components/monitoring'
import { Spinner } from '@/components/ui/spinner'
import { ShieldAlert } from 'lucide-react'

export default function AuditPage() {
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Attendre le montage et la session
  if (!mounted || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    )
  }

  // Vérifier l'accès - ADMIN ou DIRECTEUR uniquement
  const userRole = session?.user?.role
  if (!session || !['ADMIN', 'DIRECTEUR'].includes(userRole as string)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Accès refusé</h2>
          <p className="text-muted-foreground mt-1">
            Cette page est réservée aux administrateurs et directeurs.
          </p>
        </div>
      </div>
    )
  }

  return <MonitoringDashboard />
}
