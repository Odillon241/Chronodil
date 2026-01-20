'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { getDepartments, createDepartment, deleteDepartment } from '@/actions/settings.actions'
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function DepartmentsPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false)

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    description: '',
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setIsLoading(true)
    try {
      const result = await getDepartments({})
      if (result?.data) {
        setDepartments(result.data)
      }
    } catch (_error) {
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createDepartment(departmentForm)
      toast.success('Département ajouté')
      setIsDepartmentDialogOpen(false)
      setDepartmentForm({ name: '', code: '', description: '' })
      loadDepartments()
    } catch (_error) {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    await showConfirmation({
      title: 'Supprimer le département',
      description: 'Êtes-vous sûr de vouloir supprimer ce département ?',
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteDepartment({ id })
          toast.success('Département supprimé')
          loadDepartments()
        } catch (_error) {
          toast.error('Erreur lors de la suppression')
        }
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Départements</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gérez les départements de votre organisation
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un département
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau département</DialogTitle>
                <DialogDescription>Ajoutez un département à votre organisation</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dep-name">Nom *</Label>
                  <Input
                    id="dep-name"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    placeholder="Ex: Ressources Humaines"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={departmentForm.code}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })}
                    placeholder="Ex: RH"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dep-description">Description</Label>
                  <Textarea
                    id="dep-description"
                    value={departmentForm.description}
                    onChange={(e) =>
                      setDepartmentForm({ ...departmentForm, description: e.target.value })
                    }
                    placeholder="Description optionnelle"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Ajouter
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <Spinner className="size-6" />
                <p className="text-center text-muted-foreground">Chargement...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {departments.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Aucun département configuré</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ajoutez votre premier département pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map((dept) => (
                      <Card
                        key={dept.id}
                        className="relative group hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-primary shrink-0" />
                                <h3 className="font-semibold truncate">{dept.name}</h3>
                              </div>
                              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-mono mb-2">
                                {dept.code}
                              </div>
                              {dept.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {dept.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDepartment(dept.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmationDialog />
    </div>
  )
}
