'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Building2,
  Key,
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Briefcase,
  User,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '@/actions/user.actions'
import { getDepartments } from '@/actions/settings.actions'
import { useSession } from '@/lib/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  avatar: string | null
  department: { id: string; name: string } | null
  manager: { id: string; name: string | null } | null
  _count: { timesheetEntries: number; subordinates: number }
}

interface Department {
  id: string
  name: string
  code: string
}

const ROLES = [
  {
    value: 'EMPLOYEE',
    label: 'Employé',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  { value: 'MANAGER', label: 'Manager', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'HR', label: 'RH', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  {
    value: 'DIRECTEUR',
    label: 'Directeur',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  { value: 'ADMIN', label: 'Admin', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
]

export default function UsersManagementPage() {
  const { data: session } = useSession() as any
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as string,
    departmentId: '',
    managerId: '',
  })

  const dataLoadedRef = useRef(false)
  const sessionUserId = (session?.user as any)?.id
  const sessionUserRole = (session?.user as any)?.role

  useEffect(() => {
    if (!sessionUserId || dataLoadedRef.current) return
    if (!['ADMIN', 'DIRECTEUR', 'HR'].includes(sessionUserRole)) {
      toast.error('Accès non autorisé')
      return
    }
    dataLoadedRef.current = true
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, sessionUserRole])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersResult, departmentsResult] = await Promise.all([getUsers({}), getDepartments({})])
      if (usersResult?.data) {
        let usersList = usersResult.data as unknown as User[]
        if (['DIRECTEUR', 'HR'].includes(sessionUserRole)) {
          usersList = usersList.filter((u) => u.role !== 'ADMIN')
        }
        setUsers(usersList)
      }
      if (departmentsResult?.data) {
        setDepartments(departmentsResult.data as Department[])
      }
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const availableManagers = users.filter(
    (u) =>
      ['MANAGER', 'HR', 'DIRECTEUR'].includes(u.role) && (!editingUser || u.id !== editingUser.id),
  )

  const getRole = (role: string) => ROLES.find((r) => r.value === role) || ROLES[0]

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      departmentId: '',
      managerId: '',
    })
    setEditingUser(null)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as any,
        departmentId: form.departmentId || undefined,
        managerId: form.managerId && form.managerId !== 'all' ? form.managerId : undefined,
      })
      if (result?.data) {
        toast.success('Utilisateur créé !')
        setIsDialogOpen(false)
        resetForm()
        loadData()
      } else {
        toast.error(result?.serverError || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setForm({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      departmentId: user.department?.id || '',
      managerId: user.manager?.id || 'all',
    })
    setIsDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setIsLoading(true)
    try {
      const result = await updateUser({
        id: editingUser.id,
        data: {
          name: form.name,
          email: form.email,
          role: form.role as any,
          departmentId: form.departmentId || undefined,
          managerId: form.managerId && form.managerId !== 'all' ? form.managerId : undefined,
        },
      })
      if (result?.data) {
        toast.success('Utilisateur mis à jour !')
        setIsDialogOpen(false)
        resetForm()
        loadData()
      } else {
        toast.error(result?.serverError || 'Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (user.role === 'ADMIN') {
      toast.error('Les comptes administrateurs ne peuvent pas être supprimés')
      return
    }
    await showConfirmation({
      title: "Supprimer l'utilisateur",
      description: `Supprimer ${user.name || user.email} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        const result = await deleteUser({ id: user.id })
        if (result?.data) {
          toast.success('Utilisateur supprimé')
          loadData()
        } else {
          toast.error(result?.serverError || 'Erreur')
        }
      },
    })
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordUser) return
    setIsLoading(true)
    try {
      const result = await resetUserPassword({ id: resetPasswordUser.id, newPassword })
      if (result?.data) {
        toast.success(`Mot de passe réinitialisé !`)
        setIsResetPasswordOpen(false)
        setResetPasswordUser(null)
        setNewPassword('')
      } else {
        toast.error(result?.serverError || 'Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = { all: users.length }
    ROLES.forEach((r) => {
      stats[r.value] = users.filter((u) => u.role === r.value).length
    })
    return stats
  }, [users])

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gérez les comptes et permissions · {users.length} utilisateur{users.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tous <span className="text-muted-foreground ml-1">({roleStats.all})</span>
              </SelectItem>
              {ROLES.filter((r) => sessionUserRole === 'ADMIN' || r.value !== 'ADMIN').map(
                (role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}{' '}
                    <span className="text-muted-foreground ml-1">({roleStats[role.value]})</span>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {editingUser ? (
                    <Edit className="h-5 w-5 text-primary" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    {editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-0.5">
                    {editingUser
                      ? 'Modifiez les informations de cet utilisateur'
                      : 'Créez un nouveau compte utilisateur'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form
              onSubmit={editingUser ? handleUpdate : handleCreateUser}
              className="p-6 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jean@example.com"
                    required
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    Mot de passe <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Rôle
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={(val) => setForm({ ...form, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter((r) => sessionUserRole === 'ADMIN' || r.value !== 'ADMIN').map(
                        (r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Département
                  </Label>
                  <Select
                    value={form.departmentId || 'none'}
                    onValueChange={(val) =>
                      setForm({ ...form, departmentId: val === 'none' ? '' : val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    Manager
                  </Label>
                  <Select
                    value={form.managerId || 'all'}
                    onValueChange={(val) =>
                      setForm({ ...form, managerId: val === 'all' ? '' : val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Aucun</SelectItem>
                      {availableManagers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name || m.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                  {editingUser ? 'Enregistrer' : "Créer l'utilisateur"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg mb-8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="hidden md:table-cell">Département</TableHead>
              <TableHead className="hidden lg:table-cell">Manager</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Spinner className="mx-auto h-5 w-5" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.name || '—'}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('font-normal', getRole(user.role).color)}
                    >
                      {getRole(user.role).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.department ? (
                      <span className="text-sm">{user.department.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.manager ? (
                      <span className="text-sm">{user.manager.name || user.manager.id}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setResetPasswordUser(user)
                            setIsResetPasswordOpen(true)
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Réinitialiser MDP
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          disabled={user.role === 'ADMIN'}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Key className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">Réinitialiser le mot de passe</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  Pour {resetPasswordUser?.name || resetPasswordUser?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                Nouveau mot de passe <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Ce mot de passe sera communiqué à l'utilisateur
              </p>
            </div>
            <DialogFooter className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                Réinitialiser
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog />
    </div>
  )
}
