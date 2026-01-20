'use client'

import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ProjectHealthIndicatorProps {
  budgetHours?: number
  consumedHours: number
  daysRemaining?: number
  size?: 'sm' | 'md' | 'lg'
}

export function ProjectHealthIndicator({
  budgetHours,
  consumedHours,
  daysRemaining,
  size = 'md',
}: ProjectHealthIndicatorProps) {
  // Calculer le pourcentage de budget consommé
  const budgetPercentage = budgetHours ? (consumedHours / budgetHours) * 100 : null

  // Déterminer la santé du projet
  let _health: 'excellent' | 'good' | 'warning' | 'critical' = 'good'
  let message = 'Projet en bonne santé'
  let color = 'text-green-600'
  let bgColor = 'bg-green-100'
  let Icon = CheckCircle

  if (budgetPercentage !== null) {
    if (budgetPercentage < 60) {
      _health = 'excellent'
      message = 'Consommation optimale du budget'
      color = 'text-green-600'
      bgColor = 'bg-green-100'
      Icon = CheckCircle
    } else if (budgetPercentage < 80) {
      _health = 'good'
      message = 'Budget consommé dans les normes'
      color = 'text-blue-600'
      bgColor = 'bg-blue-100'
      Icon = TrendingUp
    } else if (budgetPercentage < 100) {
      _health = 'warning'
      message = 'Attention : budget bientôt épuisé'
      color = 'text-amber-600'
      bgColor = 'bg-amber-100'
      Icon = AlertTriangle
    } else {
      _health = 'critical'
      message = 'Alerte : budget dépassé'
      color = 'text-red-600'
      bgColor = 'bg-red-100'
      Icon = AlertCircle
    }
  }

  // Ajuster en fonction des jours restants
  if (
    daysRemaining !== undefined &&
    daysRemaining < 7 &&
    budgetPercentage &&
    budgetPercentage < 90
  ) {
    _health = 'warning'
    message = 'Projet en fin de délai'
    color = 'text-amber-600'
    bgColor = 'bg-amber-100'
    Icon = AlertTriangle
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const badgeSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${bgColor} ${color} border-0 gap-1 ${badgeSizes[size]}`}
          >
            <Icon className={iconSizes[size]} />
            {budgetPercentage !== null && <span>{Math.round(budgetPercentage)}%</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{message}</p>
            {budgetHours && (
              <p className="text-xs">
                {consumedHours.toFixed(1)}h / {budgetHours}h consommés
              </p>
            )}
            {daysRemaining !== undefined && (
              <p className="text-xs">
                {daysRemaining > 0
                  ? `${daysRemaining} jour(s) restant(s)`
                  : daysRemaining === 0
                    ? 'Dernier jour'
                    : 'Délai dépassé'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
