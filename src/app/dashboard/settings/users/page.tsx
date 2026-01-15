"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit, Trash2, UserPlus, Shield, Building2, Key, Users, X,
  Search, MoreHorizontal, Mail,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from "@/actions/user.actions";
import { getDepartments } from "@/actions/settings.actions";
import { useSession } from "@/lib/auth-client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  department: { id: string; name: string } | null;
  manager: { id: string; name: string | null } | null;
  _count: { timesheetEntries: number; subordinates: number };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const ROLES = [
  { value: "EMPLOYEE", label: "Employé", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dotColor: "bg-emerald-500" },
  { value: "MANAGER", label: "Manager", color: "bg-blue-100 text-blue-800 border-blue-200", dotColor: "bg-blue-500" },
  { value: "HR", label: "RH", color: "bg-purple-100 text-purple-800 border-purple-200", dotColor: "bg-purple-500" },
  { value: "DIRECTEUR", label: "Directeur", color: "bg-amber-100 text-amber-800 border-amber-200", dotColor: "bg-amber-500" },
  { value: "ADMIN", label: "Admin", color: "bg-red-100 text-red-800 border-red-200", dotColor: "bg-red-500" },
];

export default function UsersManagementPage() {
  const { data: session } = useSession() as any;
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as string,
    departmentId: "",
    managerId: "",
  });

  const dataLoadedRef = useRef(false);
  const sessionUserId = (session?.user as any)?.id;
  const sessionUserRole = (session?.user as any)?.role;

  useEffect(() => {
    if (!sessionUserId || dataLoadedRef.current) return;
    if (!["ADMIN", "DIRECTEUR", "HR"].includes(sessionUserRole)) {
      toast.error("Accès non autorisé");
      return;
    }
    dataLoadedRef.current = true;
    loadData();
  }, [sessionUserId, sessionUserRole]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, departmentsResult] = await Promise.all([
        getUsers({}),
        getDepartments({}),
      ]);
      if (usersResult?.data) {
        let usersList = usersResult.data as unknown as User[];
        if (["DIRECTEUR", "HR"].includes(sessionUserRole)) {
          usersList = usersList.filter((u) => u.role !== "ADMIN");
        }
        setUsers(usersList);
      }
      if (departmentsResult?.data) {
        setDepartments(departmentsResult.data as Department[]);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const availableManagers = users.filter((u) =>
    ["MANAGER", "HR", "DIRECTEUR"].includes(u.role) && (!editingUser || u.id !== editingUser.id)
  );

  const getRole = (role: string) => ROLES.find((r) => r.value === role) || ROLES[0];
  const getInitials = (name: string | null) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "EMPLOYEE", departmentId: "", managerId: "" });
    setEditingUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as any,
        departmentId: form.departmentId || undefined,
        managerId: form.managerId && form.managerId !== "all" ? form.managerId : undefined,
      });
      if (result?.data) {
        toast.success("Utilisateur créé !");
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role,
      departmentId: user.department?.id || "",
      managerId: user.manager?.id || "all",
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
          role: form.role as any,
          departmentId: form.departmentId || undefined,
          managerId: form.managerId && form.managerId !== "all" ? form.managerId : undefined,
        },
      });
      if (result?.data) {
        toast.success("Utilisateur mis à jour !");
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.role === "ADMIN") {
      toast.error("Les comptes administrateurs ne peuvent pas être supprimés");
      return;
    }
    await showConfirmation({
      title: "Supprimer l'utilisateur",
      description: `Supprimer ${user.name || user.email} ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        const result = await deleteUser({ id: user.id });
        if (result?.data) {
          toast.success("Utilisateur supprimé");
          loadData();
        } else {
          toast.error(result?.serverError || "Erreur");
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setIsLoading(true);
    try {
      const result = await resetUserPassword({ id: resetPasswordUser.id, newPassword });
      if (result?.data) {
        toast.success(`Mot de passe réinitialisé !`);
        setIsResetPasswordOpen(false);
        setResetPasswordUser(null);
        setNewPassword("");
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      checked ? newSet.add(userId) : newSet.delete(userId);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? new Set(filteredUsers.map((u) => u.id)) : new Set());
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = { all: users.length };
    ROLES.forEach((r) => { stats[r.value] = users.filter((u) => u.role === r.value).length; });
    return stats;
  }, [users]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifiez les informations de l'utilisateur" : "Créez un nouveau compte utilisateur dans le système"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingUser ? handleUpdate : handleCreateUser} className="space-y-6 pt-4">
              {/* Section Identité */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Identité
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Nom complet <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Adresse email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jean.dupont@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section Sécurité */}
              {!editingUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Key className="h-4 w-4" />
                    Sécurité
                  </div>
                  <div className="pl-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Mot de passe <span className="text-destructive">*</span></Label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Minimum 6 caractères"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">L'utilisateur pourra modifier son mot de passe après sa première connexion</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Rôle & Organisation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Rôle & Organisation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Rôle <span className="text-destructive">*</span></Label>
                    <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => sessionUserRole === "ADMIN" || r.value !== "ADMIN").map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", r.dotColor)}></span>
                              {r.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Département</Label>
                    <Select value={form.departmentId || "none"} onValueChange={(val) => setForm({ ...form, departmentId: val === "none" ? "" : val })}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Manager</Label>
                    <Select value={form.managerId || "all"} onValueChange={(val) => setForm({ ...form, managerId: val === "all" ? "" : val })}>
                      <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les validateurs</SelectItem>
                        {availableManagers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-[100px]">
                  {isLoading ? <Spinner className="mr-2" /> : null}
                  {editingUser ? "Enregistrer" : "Créer l'utilisateur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-2",
            roleFilter === "all" ? "border-primary bg-primary/5" : "border-transparent"
          )}
          onClick={() => setRoleFilter("all")}
        >
          <CardContent className="p-4 flex flex-col items-center">
            <Users className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-2xl font-bold">{roleStats.all}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </CardContent>
        </Card>
        {ROLES.filter((r) => sessionUserRole === "ADMIN" || r.value !== "ADMIN").map((role) => (
          <Card
            key={role.value}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              roleFilter === role.value ? "border-primary bg-primary/5" : "border-transparent"
            )}
            onClick={() => setRoleFilter(role.value)}
          >
            <CardContent className="p-4 flex flex-col items-center">
              <Badge className={cn("mb-2", role.color)}>{role.label}</Badge>
              <span className="text-2xl font-bold">{roleStats[role.value]}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des utilisateurs */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="py-4 border-b bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-bold">Utilisateurs</CardTitle>
              <Badge variant="secondary">{filteredUsers.length}</Badge>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Spinner className="size-6 mb-4" />
              <p className="text-muted-foreground">Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {/* Header avec sélection */}
              <div className="px-4 py-3 bg-muted/30 flex items-center gap-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tout"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.size > 0 ? `${selectedUsers.size} sélectionné(s)` : "Sélectionner tout"}
                </span>
                {selectedUsers.size > 0 && (
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUsers(new Set())}>
                      <X className="h-3 w-3 mr-1" /> Désélectionner
                    </Button>
                  </div>
                )}
              </div>

              {/* Liste */}
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group",
                    selectedUsers.has(user.id) && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar?.startsWith('/') || user.avatar?.startsWith('http') ? user.avatar : undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{user.name || "Sans nom"}</div>
                    <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <Badge className={getRole(user.role).color}>{getRole(user.role).label}</Badge>
                    {user.department && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {user.department.name}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-end text-xs text-muted-foreground">
                    <span>{user._count.timesheetEntries} saisies</span>
                    <span>{user._count.subordinates} subordonné(s)</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setResetPasswordUser(user); setIsResetPasswordOpen(true); }}>
                        <Key className="h-4 w-4 mr-2" /> Réinitialiser MDP
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user)}
                        disabled={user.role === "ADMIN"}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              Réinitialiser le mot de passe
            </DialogTitle>
            <DialogDescription>
              Nouveau mot de passe pour {resetPasswordUser?.name || resetPasswordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nouveau mot de passe <span className="text-destructive">*</span></Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isLoading}>Réinitialiser</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog />
    </div>
  );
}
