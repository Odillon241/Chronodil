"use client";

import * as React from "react";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SearchWithFiltersProps {
    /** Valeur actuelle de la recherche */
    value: string;
    /** Callback appelé quand la valeur change */
    onChange: (value: string) => void;
    /** Placeholder du champ de recherche */
    placeholder?: string;
    /** Variante du composant */
    variant?: "simple" | "with-filter-button" | "with-filter-icon";
    /** Contenu du popover de filtres (requis pour les variantes avec filtre) */
    filterContent?: React.ReactNode;
    /** Indicateur visuel de filtres actifs */
    hasActiveFilters?: boolean;
    /** Contenu additionnel à droite (ex: DateRangePicker) */
    trailingContent?: React.ReactNode;
    /** Taille du composant */
    size?: "sm" | "default" | "lg";
    /** Classes CSS additionnelles pour le conteneur */
    className?: string;
    /** Classes CSS additionnelles pour l'input */
    inputClassName?: string;
    /** Largeur de l'input */
    inputWidth?: string;
    /** Alignement du popover de filtres */
    filterAlign?: "start" | "center" | "end";
    /** Callback quand le popover de filtres s'ouvre/ferme */
    onFilterOpenChange?: (open: boolean) => void;
    /** État ouvert du popover (mode contrôlé) */
    filterOpen?: boolean;
    /** Texte du bouton de filtre (pour la variante with-filter-button) */
    filterButtonText?: string;
    /** Désactiver l'input */
    disabled?: boolean;
    /** Auto-focus sur l'input */
    autoFocus?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SearchWithFilters({
    value,
    onChange,
    placeholder = "Rechercher...",
    variant = "simple",
    filterContent,
    hasActiveFilters = false,
    trailingContent,
    size = "default",
    className,
    inputClassName,
    inputWidth,
    filterAlign = "end",
    onFilterOpenChange,
    filterOpen,
    filterButtonText = "Filtres",
    disabled = false,
    autoFocus = false,
}: SearchWithFiltersProps) {
    const [internalFilterOpen, setInternalFilterOpen] = React.useState(false);

    // Mode contrôlé ou non contrôlé pour le popover
    const isControlled = filterOpen !== undefined;
    const isOpen = isControlled ? filterOpen : internalFilterOpen;
    const setIsOpen = (open: boolean) => {
        if (!isControlled) {
            setInternalFilterOpen(open);
        }
        onFilterOpenChange?.(open);
    };

    // Tailles
    const sizeClasses = {
        sm: "h-8",
        default: "h-9",
        lg: "h-10",
    };

    const iconSizes = {
        sm: "h-3.5 w-3.5",
        default: "h-4 w-4",
        lg: "h-5 w-5",
    };

    const inputSizeClasses = {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
    };

    // Largeurs par défaut selon la variante
    const defaultWidths = {
        simple: "w-[200px] lg:w-[280px]",
        "with-filter-button": "w-[150px] lg:w-[250px]",
        "with-filter-icon": "w-[180px] lg:w-[260px]",
    };

    const handleClear = () => {
        onChange("");
    };

    // Rendu du bouton/icône de filtre
    const renderFilterTrigger = () => {
        if (variant === "simple") return null;

        if (variant === "with-filter-button") {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn(
                        sizeClasses[size],
                        "px-3 gap-2",
                        hasActiveFilters && "border-primary text-primary bg-primary/5"
                    )}
                    suppressHydrationWarning
                >
                    <Filter className={iconSizes[size]} />
                    <span className="hidden sm:inline">{filterButtonText}</span>
                    {hasActiveFilters && (
                        <span className="flex h-2 w-2 rounded-full bg-primary" />
                    )}
                </Button>
            );
        }

        // with-filter-icon
        return (
            <Button
                variant="outline"
                size="icon"
                disabled={disabled}
                className={cn(
                    sizeClasses[size],
                    "relative shrink-0",
                    hasActiveFilters && "border-primary text-primary bg-primary/5"
                )}
                suppressHydrationWarning
            >
                <SlidersHorizontal className={iconSizes[size]} />
                {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-primary" />
                )}
            </Button>
        );
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Champ de recherche */}
            <div className="relative">
                <Search
                    className={cn(
                        "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
                        iconSizes[size]
                    )}
                />
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    className={cn(
                        "pl-8 pr-8 bg-background",
                        sizeClasses[size],
                        inputSizeClasses[size],
                        inputWidth || defaultWidths[variant],
                        inputClassName
                    )}
                />
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className={cn(
                            "absolute right-0 top-0 p-0 hover:bg-transparent",
                            sizeClasses[size],
                            "w-8"
                        )}
                        onClick={handleClear}
                    >
                        <X className={cn("text-muted-foreground", iconSizes[size])} />
                        <span className="sr-only">Effacer la recherche</span>
                    </Button>
                )}
            </div>

            {/* Bouton/Icône de filtre avec Popover */}
            {variant !== "simple" && filterContent && (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        {renderFilterTrigger()}
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-80"
                        align={filterAlign}
                        sideOffset={5}
                    >
                        {filterContent}
                    </PopoverContent>
                </Popover>
            )}

            {/* Contenu additionnel à droite */}
            {trailingContent}
        </div>
    );
}

// ============================================================================
// Sous-composants utilitaires pour le contenu des filtres
// ============================================================================

interface FilterSectionProps {
    children: React.ReactNode;
    className?: string;
}

export function FilterSection({ children, className }: FilterSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    );
}

interface FilterFieldProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

export function FilterField({ label, children, className }: FilterFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}

interface FilterActionsProps {
    onClear?: () => void;
    onApply?: () => void;
    showClear?: boolean;
    showApply?: boolean;
    clearText?: string;
    applyText?: string;
    className?: string;
}

export function FilterActions({
    onClear,
    onApply,
    showClear = true,
    showApply = true,
    clearText = "Effacer",
    applyText = "Appliquer",
    className,
}: FilterActionsProps) {
    return (
        <div className={cn("flex justify-end gap-2 pt-4 border-t", className)}>
            {showClear && onClear && (
                <Button variant="outline" size="sm" onClick={onClear}>
                    {clearText}
                </Button>
            )}
            {showApply && onApply && (
                <Button size="sm" onClick={onApply}>
                    {applyText}
                </Button>
            )}
        </div>
    );
}

// Export par défaut
export default SearchWithFilters;
