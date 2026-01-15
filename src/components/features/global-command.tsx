"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Settings,
    User,
    LayoutDashboard,
    FileText,
    Clock,
    FolderOpen,
    Search,
    Bell,
    Plus,
    Loader2,
    Zap,
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { globalSearch } from "@/actions/search.actions"
import { useAction } from "next-safe-action/hooks"

// Mapping des icônes
const ICON_MAP: Record<string, React.ElementType> = {
    LayoutDashboard,
    FileText,
    Clock,
    FolderOpen,
    Settings,
    User,
    Bell,
    Plus,
}

// Hook de debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

export function GlobalCommand() {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const router = useRouter()
    const debouncedSearch = useDebounce(search, 300)

    const { execute, result, isPending } = useAction(globalSearch)

    // Effect pour ouvrir avec Ctrl+K
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

    // Effect pour lancer la recherche
    React.useEffect(() => {
        if (debouncedSearch.length >= 2) {
            execute({ query: debouncedSearch, limit: 5 })
        }
    }, [debouncedSearch, execute])

    // Reset search when dialog closes
    React.useEffect(() => {
        if (!open) {
            setSearch("")
        }
    }, [open])

    const navigate = (path: string) => {
        setOpen(false)
        router.push(path)
        setSearch("")
    }

    const data = result?.data
    const hasResults = data && data.total > 0
    const showInitialState = search.length < 2

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Rechercher dans Chronodil..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <CommandList>
                {/* État initial - Afficher les actions rapides */}
                {showInitialState && (
                    <>
                        <CommandGroup heading="Actions rapides">
                            <CommandItem onSelect={() => navigate("/dashboard/tasks?new=true")}>
                                <Plus className="mr-2 h-4 w-4 text-emerald-500" />
                                <span>Créer une tâche</span>
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/dashboard/hr-timesheet/new")}>
                                <Plus className="mr-2 h-4 w-4 text-blue-500" />
                                <span>Nouvelle feuille de temps</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Navigation">
                            <CommandItem onSelect={() => navigate("/dashboard")}>
                                <LayoutDashboard className="mr-2 h-4 w-4 opacity-70" />
                                <span>Tableau de bord</span>
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/dashboard/tasks")}>
                                <FileText className="mr-2 h-4 w-4 opacity-70" />
                                <span>Tâches</span>
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/dashboard/hr-timesheet")}>
                                <Clock className="mr-2 h-4 w-4 opacity-70" />
                                <span>Feuilles de temps</span>
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/dashboard/projects")}>
                                <FolderOpen className="mr-2 h-4 w-4 opacity-70" />
                                <span>Projets</span>
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/dashboard/settings")}>
                                <Settings className="mr-2 h-4 w-4 opacity-70" />
                                <span>Paramètres</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}

                {/* État de chargement */}
                {!showInitialState && isPending && (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recherche en cours...
                    </div>
                )}

                {/* Aucun résultat */}
                {!showInitialState && !isPending && !hasResults && (
                    <CommandEmpty>
                        Aucun résultat pour "{search}"
                    </CommandEmpty>
                )}

                {/* Résultats de recherche */}
                {!showInitialState && !isPending && hasResults && (
                    <>
                        {/* Actions rapides */}
                        {data.quickActions.length > 0 && (
                            <CommandGroup heading="Actions & Navigation">
                                {data.quickActions.map((action) => {
                                    const IconComponent = ICON_MAP[action.icon] || Zap
                                    return (
                                        <CommandItem
                                            key={action.id}
                                            onSelect={() => navigate(action.path)}
                                        >
                                            <IconComponent className="mr-2 h-4 w-4 opacity-70" />
                                            <div className="flex flex-col">
                                                <span>{action.name}</span>
                                                <span className="text-xs text-muted-foreground">{action.description}</span>
                                            </div>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )}

                        {/* Projets */}
                        {data.projects.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Projets">
                                    {data.projects.map((project) => (
                                        <CommandItem
                                            key={project.id}
                                            onSelect={() => navigate(`/dashboard/projects/${project.id}`)}
                                        >
                                            <div
                                                className="mr-2 h-3 w-3 rounded-full"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <div className="flex flex-col">
                                                <span>{project.name}</span>
                                                <span className="text-xs text-muted-foreground">{project.code}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Tâches */}
                        {data.tasks.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Tâches">
                                    {data.tasks.map((task) => (
                                        <CommandItem
                                            key={task.id}
                                            onSelect={() => navigate(`/dashboard/tasks/${task.id}`)}
                                        >
                                            <FileText className="mr-2 h-4 w-4 opacity-70" />
                                            <div className="flex flex-col">
                                                <span>{task.name}</span>
                                                {task.Project && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {task.Project.name}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Utilisateurs */}
                        {data.users.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Utilisateurs">
                                    {data.users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            onSelect={() => navigate(`/dashboard/users/${user.id}`)}
                                        >
                                            <User className="mr-2 h-4 w-4 opacity-70" />
                                            <div className="flex flex-col">
                                                <span>{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Feuilles de temps */}
                        {data.timesheets.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Feuilles de temps">
                                    {data.timesheets.map((ts) => (
                                        <CommandItem
                                            key={ts.id}
                                            onSelect={() => navigate(`/dashboard/hr-timesheet/${ts.id}`)}
                                        >
                                            <Clock className="mr-2 h-4 w-4 opacity-70" />
                                            <div className="flex flex-col">
                                                <span>{ts.employeeName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(ts.weekStartDate).toLocaleDateString("fr-FR")} - {ts.totalHours}h
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Notifications */}
                        {data.notifications.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Notifications">
                                    {data.notifications.map((notif) => (
                                        <CommandItem
                                            key={notif.id}
                                            onSelect={() => notif.link && navigate(notif.link)}
                                        >
                                            <Bell className="mr-2 h-4 w-4 opacity-70" />
                                            <div className="flex flex-col">
                                                <span>{notif.title}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {notif.message}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    )
}
