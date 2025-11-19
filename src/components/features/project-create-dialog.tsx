"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";

interface ProjectCreateDialogProps {
  onSubmit: (data: FormData) => Promise<void>;
  trigger?: React.ReactNode;
}

export function ProjectCreateDialog({ onSubmit, trigger }: ProjectCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
      setOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
            <DialogDescription>
              Ajoutez les informations du projet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Application Mobile"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                placeholder="Ex: APP-MOB"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brève description du projet"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budgetHours">Budget (heures)</Label>
                <Input
                  id="budgetHours"
                  name="budgetHours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="500"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Taux horaire (F CFA)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="20000"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue="#dd2d4a"
                  className="w-20"
                  disabled={isLoading}
                />
                <Input
                  type="text"
                  value="#dd2d4a"
                  disabled
                  className="flex-1 text-muted-foreground"
                />
              </div>
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
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Création...
                </span>
              ) : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
