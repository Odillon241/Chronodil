"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
    Users,
    Clock,
    TrendingUp,
    Calendar,
    DollarSign,
    CheckCircle2,
    XCircle,
    Edit,
} from "lucide-react";
import { Project } from "@/types/project.types";

interface ProjectDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
    onEdit: (project: Project) => void;
    onManageTeam: (project: Project) => void;
}

export function ProjectDetailsDialog({
    open,
    onOpenChange,
    project,
    onEdit,
    onManageTeam,
}: ProjectDetailsDialogProps) {
    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || "#dd2d4a" }}
                        />
                        {project.name}
                    </DialogTitle>
                    <DialogDescription>
                        Code: {project.code}
                        {project.Department && ` • ${project.Department.name}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Description */}
                    {project.description && (
                        <div>
                            <h3 className="text-sm font-semibold mb-2">Description</h3>
                            <p className="text-sm text-muted-foreground">
                                {project.description}
                            </p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Équipe</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {project.ProjectMember?.length || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Membres</p>
                            </CardContent>
                        </Card>

                        {project.budgetHours && (
                            <>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Budget</span>
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {project.budgetHours}h
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {project.usedHours?.toFixed(0) || 0}h utilisées
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Progression</span>
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {(((project.usedHours || 0) / project.budgetHours) * 100).toFixed(0)}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">Complété</p>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    {/* Timeline */}
                    {(project.startDate || project.endDate) && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Calendrier</h3>
                            <div className="space-y-2">
                                {project.startDate && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Début:</span>
                                        <span className="font-medium">
                                            {new Date(project.startDate).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}
                                {project.endDate && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Fin:</span>
                                        <span className="font-medium">
                                            {new Date(project.endDate).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Financial Info */}
                    {project.hourlyRate && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Informations financières</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Taux horaire:</span>
                                    <span className="font-medium">
                                        {project.hourlyRate.toFixed(2)} F CFA/h
                                    </span>
                                </div>
                                {project.budgetHours && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Budget total:</span>
                                        <span className="font-medium">
                                            {(project.budgetHours * project.hourlyRate).toFixed(2)} F CFA
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Statut</h3>
                        <div className="flex items-center gap-2">
                            {project.isActive ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-500 font-medium">Actif</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground font-medium">
                                        Archivé
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            onEdit(project);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary"
                        onClick={() => {
                            onOpenChange(false);
                            onManageTeam(project);
                        }}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Gérer l'équipe
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
