'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { createReport } from '@/actions/report.actions'
import { getReportTemplates } from '@/actions/report-template.actions'
import { useAction } from 'next-safe-action/hooks'
import type { ReportFormat } from '@/types/report.types'
import type { ReportTemplate } from '@/types/report.types'

// Dynamic import for rich text editor
const MinimalTiptapEditor = dynamic(
  () => import('@/components/ui/minimal-tiptap-dynamic').then((mod) => mod.MinimalTiptap),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
)

// Editor skeleton component
function EditorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

// Preview component
function PreviewPanel({ content, title }: { content: string; title: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>Aperçu en temps réel</span>
      </div>
      <div className="border rounded-lg p-6 bg-background min-h-[500px]">
        <h1 className="text-2xl font-bold mb-4">{title || 'Sans titre'}</h1>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  )
}

// Local storage draft key
const DRAFT_KEY = 'report-draft'

interface ReportDraft {
  title: string
  content: string
  format: ReportFormat
  period: string
  includeSummary: boolean
  templateId: string
  timestamp: number
}

export default function NewReportPage() {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [period, setPeriod] = useState('')
  const [includeSummary, setIncludeSummary] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // UI state
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Actions
  const { execute: fetchTemplates } = useAction(getReportTemplates, {
    onSuccess: ({ data }) => {
      if (data) setTemplates(data as ReportTemplate[])
      setLoadingTemplates(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement des modèles')
      setLoadingTemplates(false)
    },
  })

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createReport, {
    onSuccess: () => {
      toast.success('Rapport créé avec succès')
      clearDraft()
      router.push('/dashboard/reports')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la création')
    },
  })

  // Load templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft: ReportDraft = JSON.parse(savedDraft)
        // Check if draft is less than 24 hours old
        const isDraftValid = Date.now() - draft.timestamp < 24 * 60 * 60 * 1000

        if (isDraftValid) {
          setTitle(draft.title)
          setContent(draft.content)
          setFormat(draft.format)
          setPeriod(draft.period)
          setIncludeSummary(draft.includeSummary)
          setSelectedTemplateId(draft.templateId)
          toast.info('Brouillon restauré')
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
  }, [title, content, format, period, includeSummary, selectedTemplateId, hasUnsavedChanges])

  // Mark form as changed
  useEffect(() => {
    if (title || content || period || selectedTemplateId) {
      setHasUnsavedChanges(true)
    }
  }, [title, content, period, selectedTemplateId])

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

  // Template selection handler
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId)

      if (templateId && templateId !== 'none') {
        const template = templates.find((t) => t.id === templateId)
        if (template) {
          setContent(template.templateContent)
          setFormat(template.format as ReportFormat)
          toast.success(`Modèle "${template.name}" chargé`)
        }
      }
    },
    [templates],
  )

  // Save draft
  const saveDraft = useCallback(() => {
    const draft: ReportDraft = {
      title,
      content,
      format,
      period,
      includeSummary,
      templateId: selectedTemplateId,
      timestamp: Date.now(),
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setHasUnsavedChanges(false)
  }, [title, content, format, period, includeSummary, selectedTemplateId])

  const handleSaveDraft = useCallback(() => {
    saveDraft()
    toast.success('Brouillon sauvegardé')
  }, [saveDraft])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setHasUnsavedChanges(false)
  }, [])

  // Submit handlers
  const handlePublish = useCallback(() => {
    if (!title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    executeCreate({
      title: title.trim(),
      content,
      format,
      period: period.trim() || undefined,
      includeSummary,
    })
  }, [title, content, format, period, includeSummary, executeCreate])

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous quitter ?')) {
        router.push('/dashboard/reports')
      }
    } else {
      router.push('/dashboard/reports')
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
            <h1 className="text-xl font-semibold">Nouveau rapport</h1>
            <p className="text-sm text-muted-foreground">Créez un nouveau rapport personnalisé</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Modifications non sauvegardées
            </span>
          )}
          <Button variant="outline" onClick={handleSaveDraft} disabled={isCreating}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button onClick={handlePublish} disabled={isCreating || !title.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publier
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Metadata Form */}
        <aside className="w-[280px] border-r bg-muted/20 overflow-y-auto">
          <div className="p-4 space-y-6">
            <div>
              <h2 className="font-semibold mb-4">Configuration</h2>
              <Separator />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Titre du rapport"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label htmlFor="template">Modèle</Label>
              {loadingTemplates ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateChange}
                  disabled={isCreating}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun modèle</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedTemplateId && selectedTemplateId !== 'none' && (
                <p className="text-xs text-muted-foreground">
                  {templates.find((t) => t.id === selectedTemplateId)?.description}
                </p>
              )}
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label htmlFor="format">Format d'export</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as ReportFormat)}
                disabled={isCreating}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="word">Word (.docx)</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label htmlFor="period">Période</Label>
              <Input
                id="period"
                placeholder="ex: Janvier 2026"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground break-words">
                Optionnel - Période couverte par le rapport
              </p>
            </div>

            {/* AI Summary Toggle */}
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-summary">Résumé IA</Label>
                  <p className="text-xs text-muted-foreground">Générer un résumé automatique</p>
                </div>
                <Switch
                  id="ai-summary"
                  checked={includeSummary}
                  onCheckedChange={setIncludeSummary}
                  disabled={isCreating}
                />
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
          <div className="max-w-4xl mx-auto">
            <MinimalTiptapEditor
              content={content}
              onChange={setContent}
              className="min-h-[600px]"
              placeholder="Commencez à rédiger votre rapport..."
              editable={!isCreating}
            />
          </div>
        </main>

        {/* Right Sidebar - Preview Panel */}
        {!previewCollapsed && (
          <aside className="w-[320px] border-l bg-muted/10 overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Aperçu</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewCollapsed(true)}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <PreviewPanel content={content} title={title} />
            </div>
          </aside>
        )}

        {/* Collapsed preview toggle */}
        {previewCollapsed && (
          <div className="border-l">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewCollapsed(false)}
              className="h-full rounded-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
