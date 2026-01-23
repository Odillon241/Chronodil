'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  Search,
  Users,
  Calendar,
  Briefcase,
  Palette,
  ChevronDown,
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Actions
import { createProject } from '@/actions/project.actions'
import { getDepartments } from '@/actions/settings.actions'
import { getAllUsers } from '@/actions/user.actions'

// Types
import type { Department, User } from '@/types/project.types'

// Draft storage key
const DRAFT_KEY = 'project-create-draft'

interface ProjectDraft {
  name: string
  code: string
  description: string
  color: string
  departmentId: string
  budgetHours: string
  hourlyRate: string
  startDate: string
  endDate: string
  memberIds: string[]
  timestamp: number
}

export default function NewProjectPage() {
  const router = useRouter()

  // Form state
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#dd2d4a')
  const [departmentId, setDepartmentId] = useState('')
  const [budgetHours, setBudgetHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  // Data state
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // UI state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(true)
  const [membersOpen, setMembersOpen] = useState(true)

  // Actions
  const { execute: fetchDepartments } = useAction(getDepartments, {
    onSuccess: ({ data }) => {
      if (data) setDepartments(data as Department[])
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement des departements')
    },
  })

  const { execute: fetchUsers } = useAction(getAllUsers, {
    onSuccess: ({ data }) => {
      if (data) setUsers(data as User[])
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement des utilisateurs')
    },
  })

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createProject, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success('Projet créé avec succès')
        clearDraft()
        router.push('/dashboard/projects')
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la création du projet')
    },
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true)
      await Promise.all([fetchDepartments({}), fetchUsers({})])
      setLoadingData(false)
    }
    loadData()
  }, [])

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft: ProjectDraft = JSON.parse(savedDraft)
        const isDraftValid = Date.now() - draft.timestamp < 24 * 60 * 60 * 1000

        if (isDraftValid) {
          setName(draft.name || '')
          setCode(draft.code || '')
          setDescription(draft.description || '')
          setColor(draft.color || '#dd2d4a')
          setDepartmentId(draft.departmentId || '')
          setBudgetHours(draft.budgetHours || '')
          setHourlyRate(draft.hourlyRate || '')
          setStartDate(draft.startDate || '')
          setEndDate(draft.endDate || '')
          setSelectedMemberIds(draft.memberIds || [])
          toast.info('Brouillon restauré')
        } else {
          localStorage.removeItem(DRAFT_KEY)
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY)
      }
    }
  }, [])

  // Mark form as changed
  useEffect(() => {
    if (name || code || description || departmentId || selectedMemberIds.length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [name, code, description, departmentId, selectedMemberIds])

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Filter users (exclude ADMIN role)
  const availableUsers = useMemo(() => {
    return users.filter((u) => u.role !== 'ADMIN')
  }, [users])

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!memberSearchQuery.trim()) return availableUsers
    const query = memberSearchQuery.toLowerCase()
    return availableUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.department?.name?.toLowerCase().includes(query),
    )
  }, [availableUsers, memberSearchQuery])

  // Selected users data
  const selectedUsers = useMemo(() => {
    return availableUsers.filter((u) => selectedMemberIds.includes(u.id))
  }, [availableUsers, selectedMemberIds])

  // Draft management
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setHasUnsavedChanges(false)
  }, [])

  const saveDraft = useCallback(() => {
    const draft: ProjectDraft = {
      name,
      code,
      description,
      color,
      departmentId,
      budgetHours,
      hourlyRate,
      startDate,
      endDate,
      memberIds: selectedMemberIds,
      timestamp: Date.now(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setHasUnsavedChanges(false)
    toast.success('Brouillon sauvegardé')
  }, [
    name,
    code,
    description,
    color,
    departmentId,
    budgetHours,
    hourlyRate,
    startDate,
    endDate,
    selectedMemberIds,
  ])

  // Form handlers
  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      toast.error('Le nom du projet est requis')
      return
    }
    if (!code.trim()) {
      toast.error('Le code du projet est requis')
      return
    }

    executeCreate({
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || undefined,
      color,
      departmentId: departmentId || undefined,
      budgetHours: budgetHours ? parseFloat(budgetHours) : undefined,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
    })
  }, [
    name,
    code,
    description,
    color,
    departmentId,
    budgetHours,
    hourlyRate,
    startDate,
    endDate,
    selectedMemberIds,
    executeCreate,
  ])

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous quitter ?')) {
        router.push('/dashboard/projects')
      }
    } else {
      router.push('/dashboard/projects')
    }
  }, [hasUnsavedChanges, router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveDraft()
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveDraft, handleCancel])

  const toggleMember = useCallback((userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }, [])

  const removeMember = useCallback((userId: string) => {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== userId))
  }, [])

  // Auto-generate code from name
  const generateCode = useCallback(() => {
    if (name && !code) {
      const generatedCode = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.slice(0, 3))
        .join('-')
      setCode(`${generatedCode}-${new Date().getFullYear()}`)
    }
  }, [name, code])

  // Get user initials for avatar
  const getInitials = (userName: string | null) => {
    if (!userName) return '?'
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Retour aux projets</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Nouveau projet</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Créez un nouveau projet pour votre espace de travail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400 hidden sm:inline">
                Modifications non sauvegardées
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={saveDraft}
              disabled={isCreating}
              className="hidden sm:flex"
            >
              <Save className="h-4 w-4 mr-2" />
              Brouillon
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating || !name.trim() || !code.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le projet
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Section: Informations générales */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Informations générales
            </div>

            <div className="space-y-4">
              {/* Name and Code */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom du projet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Refonte Site Web"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={generateCode}
                    disabled={isCreating}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="Ex: WEB-2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">Identifiant unique du projet</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description détaillée du projet, objectifs, contexte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isCreating}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Department and Color */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  {loadingData ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                      disabled={isCreating}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-department">Aucun département</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Couleur
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '#dd2d4a',
                      '#ef4444',
                      '#f97316',
                      '#f59e0b',
                      '#eab308',
                      '#84cc16',
                      '#22c55e',
                      '#10b981',
                      '#14b8a6',
                      '#06b6d4',
                      '#0ea5e9',
                      '#3b82f6',
                      '#6366f1',
                      '#8b5cf6',
                      '#a855f7',
                      '#d946ef',
                      '#ec4899',
                      '#f43f5e',
                      '#78716c',
                      '#64748b',
                    ].map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        onClick={() => setColor(presetColor)}
                        disabled={isCreating}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          color === presetColor
                            ? 'border-foreground ring-2 ring-offset-2 ring-foreground/20'
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                        style={{ backgroundColor: presetColor }}
                        title={presetColor}
                      />
                    ))}
                    <label
                      className={`w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 cursor-pointer flex items-center justify-center hover:border-muted-foreground transition-all hover:scale-110 overflow-hidden ${
                        ![
                          '#dd2d4a',
                          '#ef4444',
                          '#f97316',
                          '#f59e0b',
                          '#eab308',
                          '#84cc16',
                          '#22c55e',
                          '#10b981',
                          '#14b8a6',
                          '#06b6d4',
                          '#0ea5e9',
                          '#3b82f6',
                          '#6366f1',
                          '#8b5cf6',
                          '#a855f7',
                          '#d946ef',
                          '#ec4899',
                          '#f43f5e',
                          '#78716c',
                          '#64748b',
                        ].includes(color)
                          ? 'ring-2 ring-offset-2 ring-foreground/20 border-foreground'
                          : ''
                      }`}
                      style={{
                        backgroundColor: ![
                          '#dd2d4a',
                          '#ef4444',
                          '#f97316',
                          '#f59e0b',
                          '#eab308',
                          '#84cc16',
                          '#22c55e',
                          '#10b981',
                          '#14b8a6',
                          '#06b6d4',
                          '#0ea5e9',
                          '#3b82f6',
                          '#6366f1',
                          '#8b5cf6',
                          '#a855f7',
                          '#d946ef',
                          '#ec4899',
                          '#f43f5e',
                          '#78716c',
                          '#64748b',
                        ].includes(color)
                          ? color
                          : undefined,
                      }}
                      title="Couleur personnalisée"
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={isCreating}
                        className="opacity-0 absolute w-0 h-0"
                      />
                      {[
                        '#dd2d4a',
                        '#ef4444',
                        '#f97316',
                        '#f59e0b',
                        '#eab308',
                        '#84cc16',
                        '#22c55e',
                        '#10b981',
                        '#14b8a6',
                        '#06b6d4',
                        '#0ea5e9',
                        '#3b82f6',
                        '#6366f1',
                        '#8b5cf6',
                        '#a855f7',
                        '#d946ef',
                        '#ec4899',
                        '#f43f5e',
                        '#78716c',
                        '#64748b',
                      ].includes(color) && <Plus className="h-4 w-4 text-muted-foreground" />}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section: Budget et planification */}
          <Collapsible open={budgetOpen} onOpenChange={setBudgetOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Budget et planification
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${budgetOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Budget */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budgetHours">Budget (heures)</Label>
                  <Input
                    id="budgetHours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ex: 500"
                    value={budgetHours}
                    onChange={(e) => setBudgetHours(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Taux horaire (F CFA)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="100"
                    min="0"
                    placeholder="Ex: 20000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Estimated budget display */}
              {budgetHours && hourlyRate && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Budget total estimé</p>
                  <p className="text-xl font-bold">
                    {(parseFloat(budgetHours) * parseFloat(hourlyRate)).toLocaleString('fr-FR')} F
                    CFA
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section: Membres de l'équipe */}
          <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold group">
                <Users className="h-5 w-5 text-muted-foreground" />
                Membres de l'équipe
                {selectedMemberIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedMemberIds.length}
                  </Badge>
                )}
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${membersOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  disabled={isCreating}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <CollapsibleContent className="pt-4">
              {/* Users grid */}
              {loadingData ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex flex-col items-center gap-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {memberSearchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedMemberIds.includes(user.id)
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleMember(user.id)}
                        disabled={isCreating}
                        className={`relative p-3 border rounded-lg text-center transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                            <svg
                              className="h-3 w-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                        <Avatar className="h-12 w-12 mx-auto">
                          <AvatarImage
                            src={user.avatar || user.image || undefined}
                            alt={user.name || ''}
                          />
                          <AvatarFallback className="text-sm font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="mt-2 text-sm font-medium truncate">
                          {user.name?.split(' ')[0] || 'Sans nom'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.department?.name || user.email.split('@')[0]}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Keyboard shortcuts info */}
          <div className="text-center text-xs text-muted-foreground py-4 space-x-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">S</kbd>
              {' Sauvegarder le brouillon'}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Esc</kbd>
              {' Annuler'}
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
