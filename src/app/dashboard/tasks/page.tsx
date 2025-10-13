"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, Circle, FolderOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { createTask, updateTask, deleteTask, getMyTasks } from "@/actions/task.actions";
import { getMyProjects } from "@/actions/project.actions";

export default function TasksPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "none",
    estimatedHours: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const result = await getMyProjects({});
      if (result?.data) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    }
  };

  const loadTasks = async () => {
    try {
      const result = await getMyTasks({
        projectId: selectedProject === "all" ? undefined : selectedProject || undefined,
      });
      if (result?.data) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      toast.error("Erreur lors du chargement");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingTask) {
        const result = await updateTask({
          id: editingTask.id,
          name: formData.name,
          description: formData.description,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        });

        if (result?.data) {
          toast.success("Tâche mise à jour !");
        } else {
          toast.error(result?.serverError || "Erreur");
        }
      } else {
        const result = await createTask({
          name: formData.name,
          description: formData.description,
          projectId: formData.projectId === "none" ? undefined : formData.projectId || undefined,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        });

        if (result?.data) {
          toast.success("Tâche créée !");
        } else {
          toast.error(result?.serverError || "Erreur");
        }
      }

      setIsDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || "",
      projectId: task.projectId,
      estimatedHours: task.estimatedHours?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer la tâche",
      description: "Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteTask({ id });
          if (result?.data) {
            toast.success("Tâche supprimée");
            loadTasks();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleToggleActive = async (task: any) => {
    try {
      const result = await updateTask({
        id: task.id,
        isActive: !task.isActive,
      });

      if (result?.data) {
        toast.success(task.isActive ? "Tâche désactivée" : "Tâche activée");
        loadTasks();
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      projectId: "none",
      estimatedHours: "",
    });
    setEditingTask(null);
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTasks.size === 0) return;

    const confirmed = await showConfirmation({
      title: "Supprimer les tâches sélectionnées",
      description: `Êtes-vous sûr de vouloir supprimer ${selectedTasks.size} tâche(s) ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const deletePromises = Array.from(selectedTasks).map(id => deleteTask({ id }));
          await Promise.all(deletePromises);
          toast.success(`${selectedTasks.size} tâche(s) supprimée(s)`);
          setSelectedTasks(new Set());
          loadTasks();
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Trier les tâches par projet puis par nom
  const sortedTasks = [...tasks].sort((a, b) => {
    const projectA = a.Project?.name || "Sans projet";
    const projectB = b.Project?.name || "Sans projet";
    if (projectA !== projectB) {
      return projectA.localeCompare(projectB);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tâches</h1>
          <p className="text-muted-foreground">
            Gérez les tâches de vos projets
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-rusty-red hover:bg-ou-crimson">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Modifiez les informations de la tâche" : "Créez une nouvelle tâche pour votre projet"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTask && (
                <div className="space-y-2">
                  <Label htmlFor="project">Projet</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un projet (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nom de la tâche *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Développement API REST"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de la tâche..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimation (heures)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="Ex: 40"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-rusty-red hover:bg-ou-crimson"
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : editingTask ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center justify-between">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedTasks.size} tâche(s) sélectionnée(s)
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer sélection
            </Button>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucune tâche trouvée
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Créez votre première tâche pour commencer
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTasks.size === tasks.length && tasks.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Estimation</TableHead>
                <TableHead>Saisies</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task: any) => (
                <TableRow key={task.id} className={selectedTasks.has(task.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => handleSelectTask(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleToggleActive(task)}
                    >
                      {task.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${!task.isActive && "line-through text-muted-foreground"}`}>
                        {task.name}
                      </span>
                      {!task.isActive && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: task.Project?.color || '#6b7280'
                        }}
                      />
                      <span>{task.Project?.name || "Sans projet"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-xs block">
                      {task.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {task.estimatedHours ? `${task.estimatedHours}h` : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {task._count.TimesheetEntry}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(task)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <ConfirmationDialog />
    </div>
  );
}
