"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createProject } from "@/actions/project.actions"; // Ensure this action exists or import correctly
import { Department, User } from "@/types/project.types";

interface ProjectCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departments: Department[];
    users: User[]; // Assuming User type is compatible or similar to what was in page.tsx
    onSuccess: () => void;
}

export function ProjectCreateDialog({
    open,
    onOpenChange,
    departments,
    users,
    onSuccess,
}: ProjectCreateDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Filter out ADMIN users if needed as per original logic
    const availableUsers = users.filter((u) => u.role !== "ADMIN");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setSubmitting(true);

        try {
            const result = await createProject({
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
                memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
            });

            if (result?.data) {
                toast.success("Projet créé avec succès");
                onSuccess();
                onOpenChange(false);
                setSelectedMemberIds([]);
            } else {
                toast.error(result?.serverError || "Erreur lors de la création");
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
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Créer un projet</DialogTitle>
                        <DialogDescription>
                            Ajoutez un nouveau projet à votre espace de travail.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create-name">Nom du projet *</Label>
                                <Input
                                    id="create-name"
                                    name="name"
                                    placeholder="Ex: Refonte Site Web"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-code">Code *</Label>
                                <Input
                                    id="create-code"
                                    name="code"
                                    placeholder="Ex: WEB-2024"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create-description">Description</Label>
                            <Textarea
                                id="create-description"
                                name="description"
                                placeholder="Description détaillée du projet..."
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create-department">Département</Label>
                                <Select name="departmentId">
                                    <SelectTrigger id="create-department">
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
                                <Label htmlFor="create-color">Couleur</Label>
                                <Input
                                    id="create-color"
                                    name="color"
                                    type="color"
                                    defaultValue="#dd2d4a"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create-budgetHours">Budget (heures)</Label>
                                <Input
                                    id="create-budgetHours"
                                    name="budgetHours"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-hourlyRate">Taux horaire (F CFA)</Label>
                                <Input
                                    id="create-hourlyRate"
                                    name="hourlyRate"
                                    type="number"
                                    step="100"
                                    min="0"
                                    placeholder="20000"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create-startDate">Date de début</Label>
                                <Input id="create-startDate" name="startDate" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-endDate">Date de fin</Label>
                                <Input id="create-endDate" name="endDate" type="date" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Membres du projet</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                Sélectionnez les membres à ajouter au projet (vous serez automatiquement ajouté)
                            </p>
                            <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                                {availableUsers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                        Aucun utilisateur disponible
                                    </p>
                                ) : (
                                    availableUsers.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={selectedMemberIds.includes(user.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedMemberIds([...selectedMemberIds, user.id]);
                                                    } else {
                                                        setSelectedMemberIds(
                                                            selectedMemberIds.filter((id) => id !== user.id)
                                                        );
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={`user-${user.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                            >
                                                {user.name}
                                                <span className="text-muted-foreground ml-2">
                                                    ({user.email})
                                                </span>
                                                {user.department && ( // Note: user.department might be TitleCase Department in types, verify
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        {user.department.name}
                                                    </Badge>
                                                )}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                            {selectedMemberIds.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {selectedMemberIds.length} membre(s) sélectionné(s)
                                </p>
                            )}
                        </div>
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
                                    Création...
                                </span>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Créer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
