"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTimesheetEntry } from "@/actions/timesheet.actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TimesheetQuickEntryProps {
  projects: Array<{ id: string; name: string; color: string }>;
  onEntryCreated?: () => void;
}

export function TimesheetQuickEntry({ projects, onEntryCreated }: TimesheetQuickEntryProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    projectId: "",
    duration: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  // Charger les projets récents depuis localStorage
  useEffect(() => {
    const recent = localStorage.getItem("recentProjects");
    if (recent) {
      try {
        setRecentProjects(JSON.parse(recent));
      } catch (e) {
        console.error("Error loading recent projects:", e);
      }
    }
  }, []);

  // Écouter l'événement personnalisé pour ouvrir le dialogue
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-new-timesheet" as any, handleOpen);
    return () => window.removeEventListener("open-new-timesheet" as any, handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.duration || !formData.date) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const duration = parseFloat(formData.duration);
    if (isNaN(duration) || duration <= 0 || duration > 24) {
      toast.error("La durée doit être entre 0 et 24 heures");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createTimesheetEntry({
        projectId: formData.projectId,
        duration,
        date: new Date(formData.date),
        description: formData.description || undefined,
        type: "NORMAL",
      });

      if (result?.data) {
        toast.success("Saisie créée avec succès !");

        // Mettre à jour les projets récents
        const updated = [formData.projectId, ...recentProjects.filter(id => id !== formData.projectId)].slice(0, 3);
        setRecentProjects(updated);
        localStorage.setItem("recentProjects", JSON.stringify(updated));

        // Réinitialiser le formulaire
        setFormData({
          projectId: "",
          duration: "",
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
        });
        setOpen(false);
        onEntryCreated?.();
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  // Projets suggérés (récents + tous)
  const suggestedProjects = [
    ...projects.filter(p => recentProjects.includes(p.id)),
    ...projects.filter(p => !recentProjects.includes(p.id)),
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-primary hover:bg-primary"
        size="sm"
      >
        <Plus className="mr-2 h-4 w-4" />
        Saisie rapide
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Saisie rapide de temps</DialogTitle>
            <DialogDescription>
              Ajoutez rapidement une nouvelle saisie de temps
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-project">Projet *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  required
                >
                  <SelectTrigger id="quick-project">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentProjects.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Récents
                        </div>
                        {suggestedProjects.slice(0, recentProjects.length).map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span>{project.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="border-t my-1" />
                      </>
                    )}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Tous les projets
                    </div>
                    {suggestedProjects.slice(recentProjects.length).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-duration">Durée (heures) *</Label>
                  <Input
                    id="quick-duration"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="8"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-date">Date *</Label>
                  <Input
                    id="quick-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-description">Description</Label>
                <Input
                  id="quick-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionnel..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary"
                disabled={isLoading}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
