"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

/**
 * Une version simplifiée du composant Command, sans la dépendance cmdk.
 * Utilise des composants standards pour une maintenance facile.
 */

const Command = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)}>
        {children}
    </div>
)

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                ref={ref}
                className={cn(
                    "flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 !border-none !ring-0 !shadow-none !m-0",
                    className
                )}
                {...props}
            />
        </div>
    )
)
CommandInput.displayName = "CommandInput"

const CommandList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden p-1", className)}>
        {children}
    </div>
)

const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
    <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>
)

const CommandGroup = ({ children, heading, className }: { children: React.ReactNode; heading?: string; className?: string }) => (
    <div className={cn("overflow-hidden p-1 text-foreground", className)}>
        {heading && (
            <h3 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {heading}
            </h3>
        )}
        {children}
    </div>
)

const CommandItem = ({
    children,
    onSelect,
    className,
    selected
}: {
    children: React.ReactNode;
    onSelect?: () => void;
    className?: string;
    selected?: boolean;
}) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
            selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
            className
        )}
    >
        {children}
    </div>
)

const CommandSeparator = ({ className }: { className?: string }) => (
    <div className={cn("-mx-1 h-px bg-border", className)} />
)

const CommandShortcut = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
    return (
        <span
            className={cn(
                "ml-auto text-xs tracking-widest text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}
CommandShortcut.displayName = "CommandShortcut"

const CommandDialog = ({ children, ...props }: any) => {
    return (
        <Dialog {...props}>
            <DialogContent className="overflow-hidden p-0 shadow-lg">
                <DialogTitle className="sr-only">Menu de commande</DialogTitle>
                <Command>
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    )
}

export {
    Command,
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
    CommandSeparator,
}
