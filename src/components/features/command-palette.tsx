"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Clock,
  FileText,
  FolderKanban,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  Plus,
  Search,
  CheckSquare,
  ListTodo,
  Loader2,
} from "lucide-react";
import { globalSearch } from "@/actions/search.actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
  projects: Array<{
    id: string;
    name: string;
    code: string;
    color: string;
    isActive: boolean;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    projectId: string | null;
    Project: {
      name: string;
      code: string;
    } | null;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    image: string | null;
  }>;
  total: number;
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: CommandPaletteProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Utiliser les props contrôlées si fournies, sinon utiliser l'état interne
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ? controlledOnOpenChange : setInternalOpen;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (controlledOnOpenChange) {
          controlledOnOpenChange(!open);
        } else {
          setInternalOpen((prev) => !prev);
        }
      }
    };

    // Écouter les événements personnalisés pour ouvrir la palette
    const handleOpenSearch = () => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(true);
      } else {
        setInternalOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    document.addEventListener("open-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-search", handleOpenSearch);
    };
  }, [open, controlledOnOpenChange]);

  // Recherche globale lorsque l'utilisateur tape
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      setIsSearching(true);
      globalSearch({ query: debouncedSearchQuery, limit: 5 })
        .then((result) => {
          if (result?.data) {
            setSearchResults(result.data);
          }
          setIsSearching(false);
        })
        .catch((error) => {
          console.error("Erreur de recherche:", error);
          setIsSearching(false);
        });
    } else {
      setSearchResults(null);
    }
  }, [debouncedSearchQuery]);

  // Réinitialiser la recherche quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults(null);
    }
  }, [open]);

  const runCommand = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  // Navigation items statiques
  const navigationItems = useMemo(
    () => [
      {
        title: "Tableau de bord",
        url: "/dashboard",
        icon: BarChart3,
        keywords: ["dashboard", "accueil", "home"],
      },
      {
        title: "Saisie des temps",
        url: "/dashboard/timesheet",
        icon: Clock,
        keywords: ["timesheet", "temps", "saisie", "feuille"],
      },
      {
        title: "Feuilles RH",
        url: "/dashboard/hr-timesheet",
        icon: FileText,
        keywords: ["rh", "hr", "feuille", "ressources"],
      },
      {
        title: "Tâches",
        url: "/dashboard/tasks",
        icon: ListTodo,
        keywords: ["task", "tâche", "todo"],
      },
      {
        title: "Projets",
        url: "/dashboard/projects",
        icon: FolderKanban,
        keywords: ["project", "projet"],
      },
      {
        title: "Chat",
        url: "/dashboard/chat",
        icon: MessageSquare,
        keywords: ["chat", "message", "discussion"],
      },
      {
        title: "Validation",
        url: "/dashboard/validation",
        icon: CheckSquare,
        keywords: ["validation", "approbation", "approve"],
      },
      {
        title: "Rapports",
        url: "/dashboard/reports",
        icon: FileText,
        keywords: ["report", "rapport", "statistique"],
      },
      {
        title: "Paramètres",
        url: "/dashboard/settings",
        icon: Settings,
        keywords: ["settings", "paramètre", "config"],
      },
    ],
    []
  );

  // Filtrer les items de navigation basés sur la recherche
  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return navigationItems;
    }

    const query = searchQuery.toLowerCase();
    return navigationItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  }, [navigationItems, searchQuery]);

  const hasSearchResults =
    searchResults &&
    (searchResults.projects.length > 0 ||
      searchResults.tasks.length > 0 ||
      searchResults.users.length > 0);

  const showSearchResults = searchQuery.length >= 2 && hasSearchResults;
  const showNavigation = searchQuery.length < 2 || filteredNavigationItems.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher une page, un projet, une tâche, un utilisateur..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
          </div>
        )}

        {!isSearching && (
          <>
            {/* Résultats de recherche dans les données */}
            {showSearchResults && (
              <>
                {searchResults.projects.length > 0 && (
                  <CommandGroup heading="Projets">
                    {searchResults.projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() =>
                          runCommand(() => router.push(`/dashboard/projects?project=${project.id}`))
                        }
                      >
                        <div
                          className="mr-2 h-3 w-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="flex-1">{project.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {project.code}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {searchResults.tasks.length > 0 && (
                  <CommandGroup heading="Tâches">
                    {searchResults.tasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        onSelect={() =>
                          runCommand(() => router.push(`/dashboard/tasks?task=${task.id}`))
                        }
                      >
                        <ListTodo className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col">
                          <span>{task.name}</span>
                          {task.Project && (
                            <span className="text-xs text-muted-foreground">
                              {task.Project.name}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-2",
                            task.status === "COMPLETED" && "bg-green-100 text-green-800",
                            task.status === "IN_PROGRESS" && "bg-blue-100 text-blue-800",
                            task.status === "TODO" && "bg-gray-100 text-gray-800"
                          )}
                        >
                          {task.status}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {searchResults.users.length > 0 && (
                  <CommandGroup heading="Utilisateurs">
                    {searchResults.users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() =>
                          runCommand(() => router.push(`/dashboard/settings/users?user=${user.id}`))
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {user.role}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {hasSearchResults && <CommandSeparator />}
              </>
            )}

            {/* Navigation et actions rapides */}
            {showNavigation && (
              <>
                <CommandGroup heading="Navigation">
                  {filteredNavigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.url}
                        onSelect={() => runCommand(() => router.push(item.url))}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                {searchQuery.length < 2 && (
                  <>
                    <CommandSeparator />

                    <CommandGroup heading="Actions rapides">
                      <CommandItem
                        onSelect={() => {
                          runCommand(() => {
                            router.push("/dashboard/timesheet");
                            setTimeout(() => {
                              const event = new CustomEvent("open-new-timesheet");
                              window.dispatchEvent(event);
                            }, 100);
                          });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Nouvelle saisie de temps</span>
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          <span className="text-xs">Ctrl+N</span>
                        </kbd>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          runCommand(() => {
                            router.push("/dashboard/tasks");
                            setTimeout(() => {
                              const event = new CustomEvent("open-new-task");
                              window.dispatchEvent(event);
                            }, 100);
                          });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Nouvelle tâche</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          runCommand(() => {
                            router.push("/dashboard/projects");
                            setTimeout(() => {
                              const event = new CustomEvent("open-new-project");
                              window.dispatchEvent(event);
                            }, 100);
                          });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Nouveau projet</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}

            {!isSearching && !showSearchResults && searchQuery.length >= 2 && (
              <CommandEmpty>
                Aucun résultat trouvé pour &quot;{searchQuery}&quot;
              </CommandEmpty>
            )}

            {!isSearching && searchQuery.length < 2 && (
              <CommandEmpty>
                Tapez au moins 2 caractères pour rechercher dans les données...
              </CommandEmpty>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
