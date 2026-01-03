"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
} from "@/actions/settings.actions";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DepartmentsPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getDepartments({});
      if (result?.data) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createDepartment(departmentForm);
      if (result?.data) {
        toast.success("Département créé !");
        setIsDepartmentDialogOpen(false);
        setDepartmentForm({ name: "", code: "", description: "" });
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer le département",
      description: "Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteDepartment({ id });
          if (result?.data) {
            toast.success("Département supprimé");
            loadData();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Départements</h1>
        <p className="text-base text-muted-foreground mt-1">
          Gérez les départements de votre organisation
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Départements</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gérez les départements de votre organisation
              </CardDescription>
            </div>
            <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
                  <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouveau département</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau département
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">Nom *</Label>
                    <Input
                      id="dept-name"
                      value={departmentForm.name}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                      placeholder="Ex: Développement"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dept-code">Code *</Label>
                    <Input
                      id="dept-code"
                      value={departmentForm.code}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: DEV"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dept-description">Description</Label>
                    <Textarea
                      id="dept-description"
                      value={departmentForm.description}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                      placeholder="Description optionnelle..."
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDepartmentDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                      Annuler
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
                      Créer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : departments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun département défini</p>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg hover:bg-muted/50 gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base">{dept.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Code: {dept.code} • {dept._count?.User || 0} utilisateur(s) • {dept._count?.Project || 0} projet(s)
                      </div>
                      {dept.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {dept.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="self-end sm:self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog />
    </div>
  );
}

