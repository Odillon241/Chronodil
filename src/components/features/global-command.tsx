"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Settings,
    User,
    LayoutDashboard,
    FileText,
    Clock,
    FolderOpen
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"

export function GlobalCommand() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        const openSearch = () => setOpen(true)

        document.addEventListener("keydown", down)
        document.addEventListener("open-search", openSearch)

        return () => {
            document.removeEventListener("keydown", down)
            document.removeEventListener("open-search", openSearch)
        }
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Tapez une commande ou recherchez..." />
            <CommandList>
                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard"))}
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Tableau de bord</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/tasks"))}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Tâches</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/hr-timesheet"))}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Feuilles de temps</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/projects"))}
                    >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        <span>Projets</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Paramètres">
                    <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                        <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
