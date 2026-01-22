'use client'

import { Button } from '@/components/ui/button'
import { Plus, Settings, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReportsHeaderProps {
  onNewReport: () => void
}

export function ReportsHeader({ onNewReport }: ReportsHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rapports</h2>
        <p className="text-muted-foreground">Créez et gérez vos rapports d'activité.</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/reports/templates')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Modèles
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/reports/monthly')}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Mensuel
        </Button>
        <Button onClick={onNewReport}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rapport
        </Button>
      </div>
    </div>
  )
}
