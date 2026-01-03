"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { TitleWithCount } from "@/components/ui/title-with-count";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, UserPlus, Shield, Building2, Key, Users, X, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from "@/actions/user.actions";
import { getDepartments } from "@/actions/settings.actions";
import { useSession } from "@/lib/auth-client";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  manager: {
    id: string;
    name: string | null;
  } | null;
  _count: {
    timesheetEntries: number;
    subordinates: number;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function UsersManagementPage() {
  const { data: session } = useSession() as any;
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as "EMPLOYEE" | "MANAGER" | "HR" | "DIRECTEUR" | "ADMIN",
    departmentId: "",
    managerId: "",
  });

  // Détecter si on est côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Attendre que la session soit chargée et qu'on soit côté client
    if (!isClient || !session) return;

    const user = session?.user as any;
    console.log("Session user:", user); // Debug
    console.log("User role:", user?.role); // Debug

    // Permettre l'accès aux ADMIN, DIRECTEUR, et HR
    if (user && !["ADMIN", "DIRECTEUR", "HR"].includes(user.role)) {
      toast.error("Accès non autorisé - Rôle requis: ADMIN, DIRECTEUR ou HR");
      setTimeout(() => {
        window.location.href = "/dashboard/settings";
      }, 1500);
      return;
    }

    // Si la session est chargée et le rôle est autorisé, charger les données
    if (user && ["ADMIN", "DIRECTEUR", "HR"].includes(user.role)) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isClient]);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, departmentsResult] = await Promise.all([
        getUsers({}),
        getDepartments({}),
      ]);

      if (usersResult?.data) {
        let usersList = usersResult.data as unknown as User[];

        // Filtrer les comptes ADMIN si l'utilisateur est DIRECTEUR ou HR
        const currentUser = session?.user as any;
        if (currentUser && ["DIRECTEUR", "HR"].includes(currentUser.role)) {
          usersList = usersList.filter((u) => u.role !== "ADMIN");
        }

        setUsers(usersList);
        setFilteredUsers(usersList);
      }

      if (departmentsResult?.data) {
        setDepartments(departmentsResult.data as Department[]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId || undefined,
        managerId: form.managerId && form.managerId !== "all-validators" ? form.managerId : undefined,
      });

      if (result?.data) {
        toast.success("Utilisateur créé avec succès !");
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    // Empêcher la modification du rôle et de l'email de l'admin principal
    if (user.email === "admin@chronodil.com" && user.role === "ADMIN") {
      toast.info("Seul le mot de passe peut être modifié pour le compte administrateur principal");
    }

    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role as any,
      departmentId: user.department?.id || "",
      managerId: user.manager?.id || "all-validators",
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsLoading(true);
    try {
      const result = await updateUser({
        id: editingUser.id,
        data: {
          name: form.name,
          email: form.email,
          role: form.role,
          departmentId: form.departmentId || undefined,
          managerId: form.managerId && form.managerId !== "all-validators" ? form.managerId : undefined,
        },
      });

      if (result?.data) {
        toast.success("Utilisateur mis à jour !");
        setIsDialogOpen(false);
        setEditingUser(null);
        resetForm();
        loadData();
      } else {
        toast.error(result?.serverError || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      departmentId: "",
      managerId: "",
    });
    setEditingUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800 border-red-200",
      DIRECTEUR: "bg-orange-100 text-orange-800 border-orange-200",
      HR: "bg-purple-100 text-purple-800 border-purple-200",
      MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
      EMPLOYEE: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[role as keyof typeof colors] || colors.EMPLOYEE;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      ADMIN: "Admin Technique",
      DIRECTEUR: "Directeur",
      HR: "RH",
      MANAGER: "Manager",
      EMPLOYEE: "Employé",
    };
    return labels[role as keyof typeof labels] || role;
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

  // Gestion de la sélection multiple
  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;
  const isIndeterminate = selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length;

  // Gérer l'état indeterminate pour la checkbox "Tout sélectionner"
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const element = selectAllCheckboxRef.current as unknown as HTMLInputElement;
      if (element) {
        element.indeterminate = isIndeterminate;
      }
    }
  }, [isIndeterminate]);

  // Actions en masse
  const handleBulkDelete = async () => {
    const selectedUsersList = filteredUsers.filter((u) => selectedUsers.has(u.id));
    const admins = selectedUsersList.filter((u) => u.role === "ADMIN");
    
    if (admins.length > 0) {
      toast.error("Les comptes administrateurs ne peuvent pas être supprimés");
      return;
    }

    const confirmed = await showConfirmation({
      title: "Supprimer les utilisateurs",
      description: `Êtes-vous sûr de vouloir supprimer ${selectedUsersList.length} utilisateur(s) ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const deletePromises = selectedUsersList.map((user) => deleteUser({ id: user.id }));
          const results = await Promise.all(deletePromises);
          
          const successCount = results.filter((r) => r?.data).length;
          if (successCount === selectedUsersList.length) {
            toast.success(`${successCount} utilisateur(s) supprimé(s) avec succès`);
            setSelectedUsers(new Set());
            loadData();
          } else {
            toast.error(`Erreur lors de la suppression de certains utilisateurs`);
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleBulkRoleChange = async (newRole: "EMPLOYEE" | "MANAGER" | "HR" | "DIRECTEUR" | "ADMIN") => {
    const selectedUsersList = filteredUsers.filter((u) => selectedUsers.has(u.id));
    
    // Vérifier les permissions
    const currentUser = session?.user as any;
    if (newRole === "ADMIN" && currentUser?.role !== "ADMIN") {
      toast.error("Seul un ADMIN peut créer ou modifier des comptes ADMIN");
      return;
    }

    const confirmed = await showConfirmation({
      title: "Changer le rôle",
      description: `Voulez-vous changer le rôle de ${selectedUsersList.length} utilisateur(s) en "${getRoleLabel(newRole)}" ?`,
      confirmText: "Confirmer",
      cancelText: "Annuler",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const updatePromises = selectedUsersList.map((user) =>
            updateUser({
              id: user.id,
              data: { role: newRole },
            })
          );
          const results = await Promise.all(updatePromises);
          
          const successCount = results.filter((r) => r?.data).length;
          if (successCount === selectedUsersList.length) {
            toast.success(`${successCount} utilisateur(s) mis à jour avec succès`);
            setSelectedUsers(new Set());
            loadData();
          } else {
            const errors = results.filter((r) => !r?.data).map((r) => r?.serverError || "Erreur inconnue");
            console.error("Erreurs de mise à jour:", errors);
            toast.error(`Erreur lors de la mise à jour de certains utilisateurs`);
          }
        } catch (error) {
          console.error("Erreur dans handleBulkRoleChange:", error);
          toast.error(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleBulkDepartmentChange = async (departmentId: string) => {
    const selectedUsersList = filteredUsers.filter((u) => selectedUsers.has(u.id));

    const departmentLabel = departmentId === "no-department"
      ? "Aucun département"
      : departments.find(d => d.id === departmentId)?.name || "ce département";

    const confirmed = await showConfirmation({
      title: "Assigner un département",
      description: `Voulez-vous assigner "${departmentLabel}" à ${selectedUsersList.length} utilisateur(s) ?`,
      confirmText: "Confirmer",
      cancelText: "Annuler",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const updatePromises = selectedUsersList.map((user) =>
            updateUser({
              id: user.id,
              data: { departmentId: departmentId === "no-department" ? null : departmentId },
            })
          );
          const results = await Promise.all(updatePromises);
          
          const successCount = results.filter((r) => r?.data).length;
          if (successCount === selectedUsersList.length) {
            toast.success(`${successCount} utilisateur(s) mis à jour avec succès`);
            setSelectedUsers(new Set());
            loadData();
          } else {
            const errors = results.filter((r) => !r?.data).map((r) => r?.serverError || "Erreur inconnue");
            console.error("Erreurs de mise à jour:", errors);
            toast.error(`Erreur lors de la mise à jour de certains utilisateurs`);
          }
        } catch (error) {
          console.error("Erreur dans handleBulkDepartmentChange:", error);
          toast.error(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleBulkManagerChange = async (managerId: string) => {
    const selectedUsersList = filteredUsers.filter((u) => selectedUsers.has(u.id));

    const managerLabel = managerId === "all-validators" 
      ? "Tous les validateurs" 
      : availableManagers.find(m => m.id === managerId)?.name || "ce manager";

    const confirmed = await showConfirmation({
      title: "Assigner un manager",
      description: `Voulez-vous assigner "${managerLabel}" à ${selectedUsersList.length} utilisateur(s) ?`,
      confirmText: "Confirmer",
      cancelText: "Annuler",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const updatePromises = selectedUsersList.map((user) =>
            updateUser({
              id: user.id,
              data: { 
                managerId: managerId === "all-validators" || managerId === "no-manager" ? null : managerId 
              },
            })
          );
          const results = await Promise.all(updatePromises);
          
          const successCount = results.filter((r) => r?.data).length;
          if (successCount === selectedUsersList.length) {
            toast.success(`${successCount} utilisateur(s) mis à jour avec succès`);
            setSelectedUsers(new Set());
            loadData();
          } else {
            const errors = results.filter((r) => !r?.data).map((r) => r?.serverError || "Erreur inconnue");
            console.error("Erreurs de mise à jour:", errors);
            toast.error(`Erreur lors de la mise à jour de certains utilisateurs`);
          }
        } catch (error) {
          console.error("Erreur dans handleBulkManagerChange:", error);
          toast.error(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleBulkResetPassword = async () => {
    const selectedUsersList = filteredUsers.filter((u) => selectedUsers.has(u.id));

    const confirmed = await showConfirmation({
      title: "Réinitialiser les mots de passe",
      description: `Voulez-vous réinitialiser les mots de passe de ${selectedUsersList.length} utilisateur(s) ? Un nouveau mot de passe temporaire sera généré pour chacun.`,
      confirmText: "Confirmer",
      cancelText: "Annuler",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          // Générer un mot de passe temporaire commun
          const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
          
          const resetPromises = selectedUsersList.map((user) =>
            resetUserPassword({
              id: user.id,
              newPassword: tempPassword,
            })
          );
          const results = await Promise.all(resetPromises);
          
          const successCount = results.filter((r) => r?.data).length;
          if (successCount === selectedUsersList.length) {
            toast.success(`${successCount} mot(s) de passe réinitialisé(s)`, {
              description: `Mot de passe temporaire : ${tempPassword}`,
              duration: 10000,
            });
            setSelectedUsers(new Set());
            loadData();
          } else {
            toast.error(`Erreur lors de la réinitialisation de certains mots de passe`);
          }
        } catch (error) {
          toast.error("Erreur lors de la réinitialisation");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // Get available managers (managers, HR, directeurs - exclude ADMIN as it's technical)
  const availableManagers = users.filter((u) =>
    ["MANAGER", "HR", "DIRECTEUR"].includes(u.role) && (!editingUser || u.id !== editingUser.id)
  );

  const handleDeleteUser = async (user: User) => {
    // Empêcher la suppression de l'admin principal
    if (user.role === "ADMIN") {
      toast.error("Les comptes administrateurs ne peuvent pas être supprimés");
      return;
    }

    const confirmed = await showConfirmation({
      title: "Supprimer l'utilisateur",
      description: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name || user.email} ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const result = await deleteUser({ id: user.id });
          if (result?.data) {
            toast.success("Utilisateur supprimé avec succès");
            loadData();
          } else {
            toast.error(result?.serverError || "Erreur lors de la suppression");
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    setIsLoading(true);
    try {
      const result = await resetUserPassword({
        id: resetPasswordUser.id,
        newPassword: newPassword,
      });

      if (result?.data) {
        toast.success(`Mot de passe réinitialisé ! Nouveau mot de passe : ${result.data.tempPassword}`);
        setIsResetPasswordDialogOpen(false);
        setResetPasswordUser(null);
        setNewPassword("");
      } else {
        toast.error(result?.serverError || "Erreur lors de la réinitialisation");
      }
    } catch (error) {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  const openResetPasswordDialog = (user: User) => {
    setResetPasswordUser(user);
    setNewPassword("");
    setIsResetPasswordDialogOpen(true);
  };

  // Afficher un loader uniquement côté client si la session n'est pas encore chargée
  if (isClient && !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-6" />
      </div>
    );
  }

  // Pendant l'hydratation, rendre la structure principale pour éviter les erreurs d'hydratation
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {((session?.user as any)?.role === "DIRECTEUR")
              ? "Gestion de l'équipe"
              : "Gestion des utilisateurs"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {((session?.user as any)?.role === "DIRECTEUR")
              ? "Gérez votre équipe et assignez des managers"
              : "Gérez les comptes utilisateurs et leurs permissions"}
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
              <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Modifiez les informations de l'utilisateur"
                  : "Créez un nouveau compte utilisateur"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingUser ? handleUpdate : handleCreateUser} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jean.dupont@example.com"
                    required
                    disabled={editingUser?.email === "admin@chronodil.com" && editingUser?.role === "ADMIN"}
                  />
                  {editingUser?.email === "admin@chronodil.com" && editingUser?.role === "ADMIN" && (
                    <p className="text-xs text-muted-foreground">
                      L'email du compte administrateur principal ne peut pas être modifié
                    </p>
                  )}
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe * </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="********"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(val: any) => setForm({ ...form, role: val })}
                    disabled={editingUser?.email === "admin@chronodil.com" && editingUser?.role === "ADMIN"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employé</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="HR">RH</SelectItem>
                      <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                      {((session?.user as any)?.role === "ADMIN") && (
                        <SelectItem value="ADMIN">Admin Technique (Maintenance)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {editingUser?.email === "admin@chronodil.com" && editingUser?.role === "ADMIN" && (
                    <p className="text-xs text-muted-foreground">
                      Le rôle du compte administrateur principal ne peut pas être modifié
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Select value={form.departmentId || undefined} onValueChange={(val) => setForm({ ...form, departmentId: val === "no-department" ? "" : val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-department">Aucun</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Select value={form.managerId || "all-validators"} onValueChange={(val) => setForm({ ...form, managerId: val === "all-validators" ? "" : val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-validators">
                        <span className="font-medium">Tous les validateurs</span>
                      </SelectItem>
                      {availableManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name || manager.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Tous les validateurs :</strong> Tous les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN pourront voir et valider les feuilles de temps de cet utilisateur.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      {editingUser ? "Mise à jour..." : "Création..."}
                    </span>
                  ) : editingUser ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
              <DialogDescription>
                Définissez un nouveau mot de passe pour {resetPasswordUser?.name || resetPasswordUser?.email}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe *</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Saisir le nouveau mot de passe"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsResetPasswordDialogOpen(false);
                    setResetPasswordUser(null);
                    setNewPassword("");
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm" disabled={isLoading}>
                  Réinitialiser
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Barre d'actions en masse */}
      {selectedUsers.size > 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* En-tête avec compteur et fermeture */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-base">
                      {selectedUsers.size} utilisateur(s) sélectionné(s)
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choisissez une action à appliquer à tous les utilisateurs sélectionnés
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                  className="h-8 w-8 p-0"
                  title="Désélectionner tout"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Actions groupées par catégorie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Groupe 1: Modifications d'organisation */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Organisation
                  </Label>
                  <div className="space-y-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value === "EMPLOYEE" || value === "MANAGER" || value === "HR" || value === "DIRECTEUR" || value === "ADMIN") {
                          handleBulkRoleChange(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Changer le rôle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employé</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="HR">RH</SelectItem>
                        <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                        {((session?.user as any)?.role === "ADMIN") && (
                          <SelectItem value="ADMIN">Admin Technique</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value) {
                          handleBulkDepartmentChange(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assigner un département..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-department">Aucun département</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value) {
                          handleBulkManagerChange(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assigner un manager..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-validators">
                          <span className="font-medium">Tous les validateurs</span>
                        </SelectItem>
                        {availableManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name || manager.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Groupe 2: Actions de sécurité et suppression */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Sécurité & Actions
                  </Label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkResetPassword}
                      disabled={isLoading}
                      className="w-full justify-start"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Réinitialiser les mots de passe
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isLoading}
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer les utilisateurs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            <TitleWithCount title="Utilisateurs" count={filteredUsers.length} />
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Liste de tous les utilisateurs de l'application
          </p>
        </div>
        <div>
          {/* Search bar */}
          <div className="relative max-w-md mb-4">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="size-6" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        ref={selectAllCheckboxRef}
                        checked={isAllSelected && !isIndeterminate}
                        onCheckedChange={handleSelectAll}
                        aria-label="Sélectionner tout"
                        className={isIndeterminate ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                    </div>
                  </TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={selectedUsers.has(user.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          aria-label={`Sélectionner ${user.name || user.email}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={
                              user.avatar?.startsWith('/uploads') || 
                              user.avatar?.startsWith('http') 
                                ? user.avatar 
                                : undefined
                            } 
                            alt={user.name || "User"} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || "Sans nom"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.department.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.manager ? (
                        <span className="text-sm">{user.manager.name || "Manager"}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>{user._count.timesheetEntries} saisies</div>
                        <div>{user._count.subordinates} subordonné(s)</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          title={user.email === "admin@chronodil.com" && user.role === "ADMIN" ? "Modification limitée" : "Modifier"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResetPasswordDialog(user)}
                          title="Réinitialiser le mot de passe"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title={user.role === "ADMIN" ? "Les comptes administrateurs sont protégés" : "Supprimer"}
                          disabled={user.role === "ADMIN"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`border rounded-lg p-3 space-y-3 ${selectedUsers.has(user.id) ? "bg-muted/50 border-primary/20" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center pt-1">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          aria-label={`Sélectionner ${user.name || user.email}`}
                        />
                      </div>
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage
                          src={
                            user.avatar?.startsWith('/uploads') ||
                            user.avatar?.startsWith('http')
                              ? user.avatar
                              : undefined
                          }
                          alt={user.name || "User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{user.name || "Sans nom"}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        <div className="mt-1">
                          <Badge className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs border-t pt-2">
                      {user.department && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{user.department.name}</span>
                        </div>
                      )}
                      {user.manager && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Manager: {user.manager.name || "Manager"}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{user._count.timesheetEntries} saisies</span>
                        <span>•</span>
                        <span>{user._count.subordinates} subordonné(s)</span>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="flex-1 text-xs"
                        title={user.email === "admin@chronodil.com" && user.role === "ADMIN" ? "Modification limitée" : "Modifier"}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResetPasswordDialog(user)}
                        className="flex-1 text-xs"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="h-3 w-3 mr-1" />
                        Mot de passe
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs"
                        title={user.role === "ADMIN" ? "Les comptes administrateurs sont protégés" : "Supprimer"}
                          disabled={user.role === "ADMIN"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmationDialog />
    </div>
  );
}
