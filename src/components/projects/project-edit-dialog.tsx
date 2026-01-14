"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { updateProject } from "@/actions/project.actions";
import { Department, Project } from "@/types/project.types";

interface ProjectEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
    departments: Department[];
    onSuccess: () => void;
}

export function ProjectEditDialog({
    open,
    onOpenChange,
    project,
    departments,
    onSuccess,
}: ProjectEditDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    // Reset logic is essentially handled by mounting/unmounting or form key, 
    // but here we render inputs with defaultValues which react to `project` prop changes if we use key={project.id} or similar

    if (!project) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!project) return;

        const formData = new FormData(e.currentTarget);
        setSubmitting(true);

        try {
            const result = await updateProject({
                id: project.id,
                data: {
                    name: formData.get("name") as string,
                    code: formData.get("code") as string,
                    description: formData.get("description") as string,
                    color: formData.get("color") as string,
                    budgetHours: parseFloat(formData.get("budgetHours") as string) || undefined,
                    hourlyRate: parseFloat(formData.get("hourlyRate") as string) || undefined,
                    departmentId: formData.get("departmentId") as string || undefined,
                    startDate: formData.get("startDate")
                        ? new Date(formData.get("startDate") as string)
                        : undefined,
                    endDate: formData.get("endDate")
                        ? new Date(formData.get("endDate") as string)
                        : undefined,
                },
            });

            if (result?.data) {
                toast.success("Projet mis à jour avec succès");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result?.serverError || "Erreur lors de la mise à jour");
            }
        } catch (error) {
            toast.error("Erreur inattendue");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} key={project.id}> {/* Force re-render when project changes */}
                    <DialogHeader>
                        <DialogTitle>Modifier le projet</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations du projet "{project.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nom du projet *</Label>
                                <Input
                                    id="edit-name"
                                    name="name"
                                    defaultValue={project.name}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Code *</Label>
                                <Input
                                    id="edit-code"
                                    name="code"
                                    defaultValue={project.code}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                name="description"
                                defaultValue={project.description || ""}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-department">Département</Label>
                                <Select name="departmentId" defaultValue={project.departmentId || ""}>
                                    <SelectTrigger id="edit-department">
                                        <SelectValue placeholder="Sélectionner un département" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-color">Couleur</Label>
                                <Input
                                    id="edit-color"
                                    name="color"
                                    type="color"
                                    defaultValue={project.color || "#dd2d4a"}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-budgetHours">Budget (heures)</Label>
                                <Input
                                    id="edit-budgetHours"
                                    name="budgetHours"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    defaultValue={project.budgetHours || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hourlyRate">Taux horaire (F CFA)</Label>
                                <Input
                                    id="edit-hourlyRate"
                                    name="hourlyRate"
                                    type="number"
                                    step="100"
                                    min="0"
                                    defaultValue={project.hourlyRate || ""}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-startDate">Date de début</Label>
                                <Input
                                    id="edit-startDate"
                                    name="startDate"
                                    type="date"
                                    defaultValue={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-endDate">Date de fin</Label>
                                <Input
                                    id="edit-endDate"
                                    name="endDate"
                                    type="date"
                                    defaultValue={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ""}
                                />
                            </div>
                        </div>
                        {/* Team management is done in a separate dialog */}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    Enregistrement...
                                </span>
                            ) : (
                                "Enregistrer"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
