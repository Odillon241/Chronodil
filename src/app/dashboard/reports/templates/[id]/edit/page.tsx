'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { ArrowLeft, Save, FileText, Loader2, Info } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getReportTemplateById, updateReportTemplate } from '@/actions/report-template.actions'
import { useAction } from 'next-safe-action/hooks'
import type { ReportFrequency, ReportFormat } from '@/types/report.types'

// Import types for editor ref
import type { MinimalTiptapHandle } from '@/components/ui/minimal-tiptap-dynamic'

// Dynamic import for rich text editor
const MinimalTiptapEditor = dynamic(
  () => import('@/components/ui/minimal-tiptap-dynamic').then((mod) => mod.MinimalTiptap),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
) as React.ForwardRefExoticComponent<
  React.ComponentProps<typeof import('@/components/ui/minimal-tiptap-dynamic').MinimalTiptap> &
    React.RefAttributes<MinimalTiptapHandle>
>

// Editor skeleton component
function EditorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

// Variables disponibles par type de fréquence
const AVAILABLE_VARIABLES: Record<ReportFrequency, string[]> = {
  WEEKLY: [
    'employeeName',
    'position',
    'site',
    'weekStart',
    'weekEnd',
    'totalHours',
    'observations',
    'activities',
    'activityCount',
  ],
  MONTHLY: [
    'employeeName',
    'position',
    'month',
    'year',
    'totalHours',
    'weekCount',
    'totalActivities',
    'activities',
  ],
  INDIVIDUAL: ['employeeName', 'position', 'title', 'date', 'content'],
}

// Variable descriptions for tooltips
const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  employeeName: "Nom complet de l'employe",
  position: "Poste / Fonction de l'employe",
  site: "Site d'affectation",
  weekStart: 'Date de debut de semaine',
  weekEnd: 'Date de fin de semaine',
  totalHours: 'Total des heures travaillees',
  observations: 'Observations generales',
  activities: 'Liste des activites',
  activityCount: "Nombre d'activites",
  month: 'Mois du rapport',
  year: 'Annee du rapport',
  weekCount: 'Nombre de semaines',
  totalActivities: 'Total des activites',
  title: 'Titre du rapport',
  date: 'Date du rapport',
  content: 'Contenu libre',
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  // Loading state
  const [loading, setLoading] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<ReportFrequency>('WEEKLY')
  const [format, setFormat] = useState<ReportFormat>('word')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)

  // UI state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const editorRef = useRef<MinimalTiptapHandle>(null)

  // Actions
  const { execute: fetchTemplate } = useAction(getReportTemplateById, {
    onSuccess: ({ data }) => {
      if (data) {
        setName(data.name)
        setDescription(data.description || '')
        setFrequency(data.frequency as ReportFrequency)
        setFormat(data.format as ReportFormat)
        setContent(data.templateContent)
        setIsActive(data.isActive)
        setIsDefault(data.isDefault)
        setSortOrder(data.sortOrder)
        setInitialLoaded(true)
      }
      setLoading(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement')
      setLoading(false)
      router.push('/dashboard/reports/templates')
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateReportTemplate, {
    onSuccess: () => {
      toast.success('Modele mis a jour avec succes')
      setHasUnsavedChanges(false)
      router.push('/dashboard/reports/templates')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la mise a jour')
    },
  })

  // Load template on mount
  useEffect(() => {
    if (templateId) {
      fetchTemplate({ id: templateId })
    }
  }, [templateId])

  // Mark form as changed (only after initial load)
  useEffect(() => {
    if (initialLoaded) {
      setHasUnsavedChanges(true)
    }
  }, [name, description, frequency, format, content, isActive, isDefault])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSubmit()
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [name, content]) // Re-bind when these change for validation

  // Insert variable into editor at cursor position
  const insertVariable = useCallback((variable: string) => {
    const variableText = `{{${variable}}}`
    if (editorRef.current) {
      editorRef.current.insertText(variableText)
      // Also update the content state
      const newContent = editorRef.current.getHTML()
      setContent(newContent)
    } else {
      // Fallback: append to content if ref not available
      setContent((prev) => prev + variableText)
    }
    toast.success(`Variable {{${variable}}} inseree`)
  }, [])

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    if (!content.trim()) {
      toast.error('Le contenu du modele est requis')
      return
    }

    executeUpdate({
      id: templateId,
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      format,
      templateContent: content,
      variables: AVAILABLE_VARIABLES[frequency],
      isActive,
      isDefault,
      sortOrder,
    })
  }, [
    templateId,
    name,
    description,
    frequency,
    format,
    content,
    isActive,
    isDefault,
    sortOrder,
    executeUpdate,
  ])

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardees. Voulez-vous quitter ?')) {
        router.push('/dashboard/reports/templates')
      }
    } else {
      router.push('/dashboard/reports/templates')
    }
  }, [hasUnsavedChanges, router])

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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] -m-3 sm:-m-4 lg:-m-6">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Chargement du modele...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden -m-3 sm:-m-4 lg:-m-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background shrink-0">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isUpdating}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modifier le modele
            </h1>
            <p className="text-sm text-muted-foreground">{name || 'Sans titre'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Modifications non sauvegardees
            </span>
          )}
          <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating || !name.trim()}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Metadata Form */}
        <aside className="w-[300px] border-r bg-muted/20 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="font-semibold mb-4">Configuration</h2>
              <Separator />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du modele <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Modele Hebdomadaire Standard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Decrivez brievement ce modele..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUpdating}
                rows={2}
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequence</Label>
              <Select
                value={frequency}
                onValueChange={(v: ReportFrequency) => setFrequency(v)}
                disabled={isUpdating}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                  <SelectItem value="MONTHLY">Mensuel</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Determine les variables disponibles</p>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label htmlFor="format">Format par defaut</Label>
              <Select
                value={format}
                onValueChange={(v: ReportFormat) => setFormat(v)}
                disabled={isUpdating}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Word (.docx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-4">
              <Label>Options</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                  disabled={isUpdating}
                />
                <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                  Modele actif
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                  disabled={isUpdating}
                />
                <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                  Modele par defaut
                </Label>
              </div>
            </div>

            <Separator />

            {/* Available Variables */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Variables disponibles</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cliquez pour inserer une variable</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES[frequency].map((variable) => (
                  <TooltipProvider key={variable}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={() => insertVariable(variable)}
                        >
                          {`{{${variable}}}`}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{VARIABLE_DESCRIPTIONS[variable] || variable}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Keyboard shortcuts info */}
            <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t">
              <p className="font-medium">Raccourcis clavier:</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Enregistrer</span>
                  <code className="px-1.5 py-0.5 bg-muted rounded">Ctrl+S</code>
                </div>
                <div className="flex justify-between">
                  <span>Annuler</span>
                  <code className="px-1.5 py-0.5 bg-muted rounded">Esc</code>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Contenu du modele <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Utilisez les variables dynamiques (ex: {`{{employeeName}}`}) pour les donnees
              </p>
            </div>

            <MinimalTiptapEditor
              ref={editorRef}
              content={content}
              onChange={setContent}
              className="min-h-[500px]"
              placeholder="Redigez le contenu de votre modele ici... Utilisez les variables de la barre laterale pour inserer des donnees dynamiques."
              editable={!isUpdating}
            />

            <p className="text-sm text-muted-foreground">
              Les variables seront remplacees par les donnees reelles lors de la generation du
              rapport.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
