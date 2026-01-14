"use client";

import { Button } from "@/components/ui/button";
import {
    ClipboardList,
    Clock,
    FolderKanban,
    MessageSquare,
    BarChart3,
    Settings,
    Plus
} from "lucide-react";
import Link from "next/link";

const actions = [
    {
        label: "Nouvelle Tâche",
        icon: Plus,
        href: "/dashboard/tasks/new",
        primary: true
    },
    {
        label: "Tâches",
        icon: ClipboardList,
        href: "/dashboard/tasks",
    },
    {
        label: "Feuilles de temps",
        icon: Clock,
        href: "/dashboard/hr-timesheet",
    },
    {
        label: "Projets",
        icon: FolderKanban,
        href: "/dashboard/projects",
    },
    {
        label: "Chat",
        icon: MessageSquare,
        href: "/dashboard/chat",
    },
    {
        label: "Rapports",
        icon: BarChart3,
        href: "/dashboard/reports",
    },
    {
        label: "Paramètres",
        icon: Settings,
        href: "/dashboard/settings",
    },
];

export function QuickActions() {
    return (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            {actions.map((action) => (
                <Button
                    key={action.label}
                    variant={action.primary ? "default" : "ghost"}
                    size="sm"
                    className={`
                    gap-2 rounded-full
                    ${action.primary ? '' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                `}
                    asChild
                >
                    <Link href={action.href}>
                        <action.icon className="h-4 w-4" />
                        <span>{action.label}</span>
                    </Link>
                </Button>
            ))}
        </div>
    );
}
