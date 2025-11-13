'use client';

import * as React from 'react';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface FilterOption {
  id: string;
  label: string;
  checked?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface FiltersProps {
  filterGroups?: FilterGroup[];
  onFilterChange?: (groupId: string, optionId: string, checked: boolean) => void;
  onClearFilters?: () => void;
  className?: string;
  startDate?: Date;
  endDate?: Date;
  onDateChange?: (startDate?: Date, endDate?: Date) => void;
}

const defaultFilterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { id: 'active', label: 'Active', checked: false },
      { id: 'inactive', label: 'Inactive', checked: false },
      { id: 'pending', label: 'Pending', checked: true },
    ],
  },
  {
    id: 'category',
    label: 'Category',
    options: [
      { id: 'sales', label: 'Sales', checked: false },
      { id: 'marketing', label: 'Marketing', checked: true },
      { id: 'support', label: 'Support', checked: false },
    ],
  },
];

export const Filters = React.forwardRef<
  HTMLButtonElement,
  FiltersProps
>(({ filterGroups = defaultFilterGroups, onFilterChange, onClearFilters, className, startDate, endDate, onDateChange }, ref) => {
  const handleFilterChange = (groupId: string, optionId: string, checked: boolean) => {
    if (onFilterChange) {
      onFilterChange(groupId, optionId, checked);
    }
  };

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const activeFiltersCount = filterGroups.reduce(
    (count, group) => count + group.options.filter(option => option.checked).length,
    0
  ) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          size="sm"
          className={className}
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Filtres</DropdownMenuLabel>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleClearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Effacer
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {filterGroups.map((group, groupIndex) => (
          <div key={group.id}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1.5">
              {group.label}
            </DropdownMenuLabel>
            {group.options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={option.checked}
                onCheckedChange={(checked) =>
                  handleFilterChange(group.id, option.id, checked)
                }
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            {groupIndex < filterGroups.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
        {onDateChange && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 space-y-3">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0 py-1.5">
                Période
              </DropdownMenuLabel>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: fr }) : "Début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => onDateChange(d, endDate)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: fr }) : "Fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => onDateChange(startDate, d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

Filters.displayName = 'Filters';

export default Filters;