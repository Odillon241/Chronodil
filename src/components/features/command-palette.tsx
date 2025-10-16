"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une action ou une page..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Tableau de bord</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/timesheet"))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Saisie des temps</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/tasks"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Tâches</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/projects"))}>
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Projets</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/validation"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Validation</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/reports"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Rapports</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/chat"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => runCommand(() => {
            router.push("/dashboard/timesheet");
            // Trigger new entry dialog after navigation
            setTimeout(() => {
              const event = new CustomEvent("open-new-timesheet");
              window.dispatchEvent(event);
            }, 100);
          })}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouvelle saisie de temps</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">Ctrl+N</span>
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            router.push("/dashboard/tasks");
            setTimeout(() => {
              const event = new CustomEvent("open-new-task");
              window.dispatchEvent(event);
            }, 100);
          })}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouvelle tâche</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            router.push("/dashboard/projects");
            setTimeout(() => {
              const event = new CustomEvent("open-new-project");
              window.dispatchEvent(event);
            }, 100);
          })}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouveau projet</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aide">
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            <span>Palette de commandes</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">Ctrl+K</span>
            </kbd>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
