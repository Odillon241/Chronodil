'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { DashboardReportDialog } from '@/components/features/dashboard-report-dialog'

export function DashboardReportButton() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Download className="mr-2 h-4 w-4" />
        Rapport
      </Button>

      <DashboardReportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
