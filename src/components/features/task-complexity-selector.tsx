'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskComplexity } from '@prisma/client';
import { TaskComplexityBadge } from './task-complexity-badge';

interface TaskComplexitySelectorProps {
  value?: TaskComplexity;
  onValueChange?: (value: TaskComplexity) => void;
  disabled?: boolean;
  required?: boolean;
}

const complexityOptions: TaskComplexity[] = ['FAIBLE', 'MOYEN', 'LEV_'];

export function TaskComplexitySelector({
  value = 'MOYEN',
  onValueChange,
  disabled = false,
  required = false,
}: TaskComplexitySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Complexité de la tâche {required && <span className="text-red-500">*</span>}
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner un niveau de complexité">
            {value && <TaskComplexityBadge complexity={value} size="sm" />}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {complexityOptions.map((option) => (
            <SelectItem key={option} value={option}>
              <div className="flex items-center gap-2">
                <TaskComplexityBadge complexity={option} size="sm" />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-slate-500 mt-2">
        Sélectionnez le niveau de complexité pour déterminer les ressources et la formation requises.
      </p>
    </div>
  );
}

