"use client";

import { ReactNode } from "react";

interface ProjectsHeaderProps {
    action?: ReactNode;
}

export function ProjectsHeader({ action }: ProjectsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-2 sm:space-y-0">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Projets</h2>
                <p className="text-muted-foreground">
                    Gérez vos projets, suivez leur progression et allouez des ressources.
                </p>
            </div>
            {action && (
                <div className="flex items-center space-x-2">
                    {action}
                </div>
            )}
        </div>
    );
}
