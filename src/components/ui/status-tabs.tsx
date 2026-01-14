"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusTabOption {
  id: string
  label: string
  value: string
  count?: number
}

export interface StatusTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Options des onglets à afficher
   */
  options: StatusTabOption[]
  /**
   * Valeur actuellement sélectionnée
   */
  selectedValue: string
  /**
   * Callback appelé lors du changement de valeur
   */
  onValueChange: (value: string) => void
  /**
   * Afficher les compteurs même s'ils sont à 0
   * @default false
   */
  showZeroCounts?: boolean
  /**
   * Variante de style
   * @default "default"
   */
  variant?: "default" | "compact" | "pills"
}

/**
 * Composant d'onglets de statut réutilisable avec compteurs
 * 
 * @example
 * ```tsx
 * <StatusTabs
 *   options={[
 *     { id: 'active', label: 'Actifs', value: 'active', count: 10 },
 *     { id: 'archived', label: 'Archivés', value: 'archived', count: 5 },
 *     { id: 'all', label: 'Tous', value: 'all', count: 15 },
 *   ]}
 *   selectedValue="active"
 *   onValueChange={(value) => setFilter(value)}
 * />
 * ```
 */
export const StatusTabs = React.forwardRef<HTMLDivElement, StatusTabsProps>(
  (
    {
      options,
      selectedValue,
      onValueChange,
      showZeroCounts = false,
      variant = "default",
      className,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, value: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onValueChange(value)
      }
    }

    const containerClasses = cn(
      "inline-flex items-center gap-2 p-1.5 bg-muted rounded-lg",
      {
        "gap-1 p-1": variant === "compact",
        "gap-3 p-2": variant === "pills",
      },
      className
    )

    const buttonClasses = (isSelected: boolean) =>
      cn(
        "px-5 py-2.5 text-lg font-medium rounded-md transition-all duration-200",
        "hover:bg-background/50 focus:outline-hidden focus:ring-2 focus:ring-primary/20",
        "disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-background text-foreground shadow-2xs": isSelected,
          "text-muted-foreground hover:text-foreground": !isSelected,
          "px-4 py-2 text-base": variant === "compact",
          "px-6 py-3 text-lg": variant === "pills",
          "rounded-full": variant === "pills",
        }
      )

    const countBadgeClasses = (isSelected: boolean) =>
      cn(
        "text-base px-2.5 py-0.5 rounded-full font-medium",
        {
          "bg-primary/10 text-primary": isSelected,
          "bg-muted-foreground/10 text-muted-foreground": !isSelected,
          "px-2 py-0.5 text-sm": variant === "compact",
        }
      )

    return (
      <div
        ref={ref}
        className={containerClasses}
        role="tablist"
        aria-label="Onglets de statut"
        {...props}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value
          const showCount = option.count !== undefined && (showZeroCounts || option.count > 0)

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${option.id}`}
              id={`tab-${option.id}`}
              onClick={() => onValueChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              className={buttonClasses(isSelected)}
              tabIndex={isSelected ? 0 : -1}
            >
              <div className="flex items-center gap-2">
                <span>{option.label}</span>
                {showCount && (
                  <span className={countBadgeClasses(isSelected)}>
                    {option.count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }
)

StatusTabs.displayName = "StatusTabs"

