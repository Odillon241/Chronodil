'use client';

import { Badge } from '@/components/ui/badge';
import { Zap, Gauge, AlertCircle } from 'lucide-react';
import { TaskComplexity } from '@prisma/client';

interface TaskComplexityBadgeProps {
  complexity: TaskComplexity;
  size?: 'sm' | 'md' | 'lg';
}

const complexityConfig = {
  FAIBLE: {
    label: 'Faible',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: Gauge,
    description: 'Tâche simple et récurrente',
  },
  MOYEN: {
    label: 'Moyen',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Zap,
    description: 'Tâche nécessitant expertise modérée',
  },
  LEV_: {
    label: 'Élevé',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertCircle,
    description: 'Tâche complexe nécessitant expertise',
  },
};

export function TaskComplexityBadge({
  complexity,
  size = 'md',
}: TaskComplexityBadgeProps) {
  const config = complexityConfig[complexity];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs gap-1 px-2 py-1',
    md: 'text-sm gap-1.5 px-2.5 py-1.5',
    lg: 'text-base gap-2 px-3 py-2',
  };

  return (
    <div className="group relative inline-block">
      <Badge
        variant="outline"
        className={`${config.color} ${sizeClasses[size]} flex items-center gap-1 cursor-help`}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span className="font-medium">{config.label}</span>
      </Badge>
      <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
        {config.description}
      </div>
    </div>
  );
}

