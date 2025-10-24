"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
} from "@/components/ui/menubar"
import { cn } from "@/lib/utils"

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
  label = "Statut",
  className,
}: StatusMenubarProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = options.find(option => option.value === selectedValue)

  return (
    <Menubar className={cn("w-fit", className)}>
      <MenubarMenu>
        <MenubarTrigger
          className="cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}:</span>
            <span className="text-primary font-semibold">
              {selectedOption?.label || "Sélectionner"}
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
              <MenubarRadioItem
                key={option.id}
                value={option.value}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({option.count})
                    </span>
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

// Composant alternatif avec des boutons en style onglets
interface StatusTabsProps {
  options: StatusOption[]
  selectedValue: string
  onValueChange: (value: string) => void
  className?: string
}

export function StatusTabs({
  options,
  selectedValue,
  onValueChange,
  className,
}: StatusTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            "hover:bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
            selectedValue === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                selectedValue === option.value
                  ? "bg-primary/10 text-primary"
                  : "bg-muted-foreground/10 text-muted-foreground"
              )}>
                {option.count}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
