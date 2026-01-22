'use client'

import { cn } from '@/lib/utils'
import './report-content-viewer.css'

interface ReportContentViewerProps {
  content: string
  className?: string
}

/**
 * Composant pour afficher le contenu HTML d'un rapport avec un styling professionnel
 * Optimisé pour les rapports mensuels/hebdomadaires avec tableaux, listes, etc.
 */
export function ReportContentViewer({ content, className }: ReportContentViewerProps) {
  return (
    <div className={cn('report-viewer', className)} dangerouslySetInnerHTML={{ __html: content }} />
  )
}
