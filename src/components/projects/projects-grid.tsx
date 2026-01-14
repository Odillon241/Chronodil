"use client";

import { Project } from "@/types/project.types";
import { ProjectCard } from "@/components/features/project-card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Eye, Archive, RotateCcw, FolderKanban, Users } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectsGridProps {
    projects: Project[];
    onView: (project: Project) => void;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
    onArchive: (project: Project) => void;
    onManageTeam: (project: Project) => void;
    onClone: (project: Project) => void;
    canDelete: (project: Project) => boolean;
    currentUser?: any;
}

export function ProjectsGrid({
    projects,
    onView,
    onEdit,
    onDelete,
    onArchive,
    onManageTeam,
    onClone,
    canDelete,
}: ProjectsGridProps) {
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed hover:bg-muted/20 transition-colors h-64">
                <div className="rounded-full bg-muted p-3 mb-4">
                    <FolderKanban className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Aucun projet trouvé</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Essayez de modifier vos filtres ou créez un nouveau projet.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
                <div key={project.id} className="relative group">
                    <ProjectCard
                        project={project as any}
                        onDetails={() => onView(project)}
                        onManage={() => onManageTeam(project)}
                    />
                    {/* Overlay Menu for Grid Item - optional, or we could add it to ProjectCard. 
                 But ProjectCard seems generic. Let's add a menu button absolutely positioned or rely on the cards actions.
                 ProjectCard has onDetails and onManage. It suppresses other actions.
                 I should probably extend ProjectCard or wrap it.
                 For now, I'll add a dropdown in the top right corner.
             */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onView(project)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onManageTeam(project)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Équipe
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(project)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onClone(project)}>
                                    <FolderKanban className="mr-2 h-4 w-4" />
                                    Cloner
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onArchive(project)}>
                                    {project.isActive ? (
                                        <>
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archiver
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Réactiver
                                        </>
                                    )}
                                </DropdownMenuItem>
                                {canDelete(project) && (
                                    <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ))}
        </div>
    );
}
