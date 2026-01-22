'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { createReportTemplate } from '@/actions/report-template.actions'
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
  employeeName: "Nom complet de l'employé",
  position: "Poste / Fonction de l'employé",
  site: "Site d'affectation",
  weekStart: 'Date de début de semaine',
  weekEnd: 'Date de fin de semaine',
  totalHours: 'Total des heures travaillées',
  observations: 'Observations générales',
  activities: 'Liste des activités',
  activityCount: "Nombre d'activités",
  month: 'Mois du rapport',
  year: 'Année du rapport',
  weekCount: 'Nombre de semaines',
  totalActivities: 'Total des activités',
  title: 'Titre du rapport',
  date: 'Date du rapport',
  content: 'Contenu libre',
}

// Local storage draft key
const DRAFT_KEY = 'report-template-draft'

interface TemplateDraft {
  name: string
  description: string
  frequency: ReportFrequency
  format: ReportFormat
  content: string
  isActive: boolean
  isDefault: boolean
  timestamp: number
}

export default function NewTemplatePage() {
  const router = useRouter()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<ReportFrequency>('WEEKLY')
  const [format, setFormat] = useState<ReportFormat>('word')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)

  // UI state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const editorRef = useRef<MinimalTiptapHandle>(null)

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Actions
  const { execute: executeCreate, isExecuting: isCreating } = useAction(createReportTemplate, {
    onSuccess: () => {
      toast.success('Modele cree avec succes')
      clearDraft()
      router.push('/dashboard/reports/templates')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la creation')
    },
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft: TemplateDraft = JSON.parse(savedDraft)
        // Check if draft is less than 24 hours old
        const isDraftValid = Date.now() - draft.timestamp < 24 * 60 * 60 * 1000

        if (isDraftValid) {
          setName(draft.name)
          setDescription(draft.description)
          setFrequency(draft.frequency)
          setFormat(draft.format)
          setContent(draft.content)
          setIsActive(draft.isActive)
          setIsDefault(draft.isDefault)
          toast.info('Brouillon restaure')
        } else {
          clearDraft()
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
        clearDraft()
      }
    }
  }, [])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (hasUnsavedChanges) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft()
      }, 30000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [name, description, frequency, format, content, isActive, isDefault, hasUnsavedChanges])

  // Mark form as changed
  useEffect(() => {
    if (name || description || content) {
      setHasUnsavedChanges(true)
    }
  }, [name, description, content])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveDraft()
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Save draft
  const saveDraft = useCallback(() => {
    const draft: TemplateDraft = {
      name,
      description,
      frequency,
      format,
      content,
      isActive,
      isDefault,
      timestamp: Date.now(),
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setHasUnsavedChanges(false)
  }, [name, description, frequency, format, content, isActive, isDefault])

  const handleSaveDraft = useCallback(() => {
    saveDraft()
    toast.success('Brouillon sauvegarde')
  }, [saveDraft])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setHasUnsavedChanges(false)
  }, [])

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

    executeCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      format,
      templateContent: content,
      variables: AVAILABLE_VARIABLES[frequency],
      isActive,
      isDefault,
      sortOrder: 0,
    })
  }, [name, description, frequency, format, content, isActive, isDefault, executeCreate])

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

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden -m-3 sm:-m-4 lg:-m-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background shrink-0">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isCreating}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nouveau modele
            </h1>
            <p className="text-sm text-muted-foreground">
              Creez un nouveau modele de rapport reutilisable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Modifications non sauvegardees
            </span>
          )}
          <Button variant="outline" onClick={handleSaveDraft} disabled={isCreating}>
            <Save className="h-4 w-4 mr-2" />
            Brouillon
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !name.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creation...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Creer le modele
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
                disabled={isCreating}
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
                disabled={isCreating}
                rows={2}
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequence</Label>
              <Select
                value={frequency}
                onValueChange={(v: ReportFrequency) => setFrequency(v)}
                disabled={isCreating}
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
                disabled={isCreating}
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
                  disabled={isCreating}
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
                  disabled={isCreating}
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
                  <span>Sauvegarder</span>
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
              editable={!isCreating}
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
