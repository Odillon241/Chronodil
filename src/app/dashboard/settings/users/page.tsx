"use client";

import { useState, useEffect } from "react";
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
import { TitleWithCount } from "@/components/ui/title-with-count";
import { Plus, Edit, Trash2, Search, UserPlus, Shield, Building2, Key } from "lucide-react";
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
        managerId: form.managerId || undefined,
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
      managerId: user.manager?.id || "",
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
          managerId: form.managerId || undefined,
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
                  <Select value={form.managerId || undefined} onValueChange={(val) => setForm({ ...form, managerId: val === "no-manager" ? "" : val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-manager">Aucun</SelectItem>
                      {availableManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name || manager.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un utilisateur..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            <TitleWithCount title="Utilisateurs" count={filteredUsers.length} />
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Liste de tous les utilisateurs de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableRow key={user.id}>
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
                  <div key={user.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
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
        </CardContent>
      </Card>
      <ConfirmationDialog />
    </div>
  );
}
