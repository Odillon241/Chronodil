'use client'

import { useState } from 'react'
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
} from '@/components/ui/menubar'
import { cn } from '@/lib/utils'

interface StatusOption {
  id: string
  label: string
  value: string
  count?: number
}

interface StatusMenubarProps {
  options: StatusOption[]
  selectedValue: string
  onValueChange: (value: string) => void
  label?: string
  className?: string
}

export function StatusMenubar({
  options,
  selectedValue,
  onValueChange,
  label = 'Statut',
  className,
}: StatusMenubarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === selectedValue)

  return (
    <Menubar className={cn('w-fit', className)}>
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}:</span>
            <span className="text-primary font-semibold">
              {selectedOption?.label || 'Sélectionner'}
            </span>
            {selectedOption?.count !== undefined && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {selectedOption.count}
              </span>
            )}
          </div>
        </MenubarTrigger>
        <MenubarContent align="start">
          <MenubarRadioGroup value={selectedValue} onValueChange={onValueChange}>
            {options.map((option) => (
              <MenubarRadioItem key={option.id} value={option.value} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">({option.count})</span>
                  )}
                </div>
              </MenubarRadioItem>
            ))}
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

// StatusTabs a été déplacé vers @/components/ui/status-tabs
// Importez-le depuis : import { StatusTabs } from "@/components/ui/status-tabs"
