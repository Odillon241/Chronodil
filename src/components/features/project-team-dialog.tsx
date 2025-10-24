"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserPlus, X, Users } from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { toast } from "sonner";
import { getUsers } from "@/actions/user.actions";
import { addProjectMember, removeProjectMember } from "@/actions/project.actions";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  department?: {
    id: string;
    name: string;
  } | null;
}

interface ProjectMember {
  id: string;
  user: User;
  User?: User; // Alias pour compatibilité avec Prisma
  role: string | null;
}

interface Project {
  id: string;
  name: string;
  code: string;
  color: string | null;
  ProjectMember?: ProjectMember[];
  members?: ProjectMember[]; // Alias pour compatibilité
}

interface ProjectTeamDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ProjectTeamDialog({
  project,
  open,
  onOpenChange,
  onUpdate,
}: ProjectTeamDialogProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [memberRole, setMemberRole] = useState<string>("MEMBER");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (open && project) {
      loadAvailableUsers();
    }
  }, [open, project]);

  const loadAvailableUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await getUsers({});
      if (result?.data) {
        // Filter out users already in the project
        const currentMemberIds = project?.ProjectMember?.map((m) => (m.user?.id || m.User?.id)) || 
                                project?.members?.map((m) => (m.user?.id || m.User?.id)) || [];
        const filtered = (result.data as any[]).filter(
          (user: any) => !currentMemberIds.includes(user.id)
        );
        setAvailableUsers(filtered as User[]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (!project || !selectedUserId) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addProjectMember({
        projectId: project.id,
        userId: selectedUserId,
        role: memberRole || undefined,
      });

      if (result?.data) {
        toast.success("Membre ajouté avec succès !");
        setSelectedUserId("");
        setMemberRole("MEMBER");
        onUpdate();
        loadAvailableUsers();
      } else {
        toast.error(result?.serverError || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du membre");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (membershipId: string, userName: string) => {
    if (!project) return;

    if (!confirm(`Voulez-vous vraiment retirer ${userName} de ce projet ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await removeProjectMember({
        id: membershipId,
      });

      if (result?.data) {
        toast.success("Membre retiré avec succès !");
        onUpdate();
        loadAvailableUsers();
      } else {
        toast.error(result?.serverError || "Erreur lors du retrait");
      }
    } catch (error) {
      toast.error("Erreur lors du retrait du membre");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800 border-red-200",
      HR: "bg-purple-100 text-purple-800 border-purple-200",
      MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
      EMPLOYEE: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[role as keyof typeof colors] || colors.EMPLOYEE;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      ADMIN: "Administrateur",
      HR: "RH",
      MANAGER: "Manager",
      EMPLOYEE: "Employé",
      MEMBER: "Membre",
      LEAD: "Chef de projet",
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color || "#dd2d4a" }}
            />
            Gérer l'équipe - {project.name}
          </DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des membres de l'équipe projet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section: Ajouter un membre */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Ajouter un membre</h3>
                </div>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <SpinnerCustom />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tous les utilisateurs sont déjà membres de ce projet
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Utilisateur</label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un utilisateur..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <span>{user.name || user.email}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.department?.name || "Pas de département"}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Rôle sur le projet (optionnel)
                      </label>
                      <Select value={memberRole} onValueChange={setMemberRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Membre</SelectItem>
                          <SelectItem value="LEAD">Chef de projet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedUserId || isLoading}
                      className="w-full bg-primary hover:bg-primary"
                    >
                      {isLoading ? (
                        <>
                          <SpinnerCustom />
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Ajouter au projet
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Section: Membres actuels */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                Membres actuels ({project.ProjectMember?.length || project.members?.length || 0})
              </h3>
            </div>

            {(!project.ProjectMember || project.ProjectMember.length === 0) && 
             (!project.members || project.members.length === 0) ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    Aucun membre assigné à ce projet
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {(project.ProjectMember || project.members || []).map((member) => (
                  <Card key={member.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials((member.user || member.User)?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {(member.user || member.User)?.name || "Utilisateur sans nom"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(member.user || member.User)?.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {member.role && (
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(member.role)}
                            </Badge>
                          )}
                          <Badge className={getRoleBadgeColor((member.user || member.User)?.role || "EMPLOYEE")}>
                            {getRoleLabel((member.user || member.User)?.role || "EMPLOYEE")}
                          </Badge>
                          {(member.user || member.User)?.department && (
                            <Badge variant="secondary" className="text-xs">
                              {(member.user || member.User)?.department?.name}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveMember(
                                member.id,
                                (member.user || member.User)?.name || (member.user || member.User)?.email || "Utilisateur"
                              )
                            }
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
