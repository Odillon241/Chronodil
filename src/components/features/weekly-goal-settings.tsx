'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { updateUserPreferences } from '@/actions/preferences.actions'

interface WeeklyGoalSettingsProps {
  currentGoal: number
  onGoalUpdated?: (newGoal: number) => void
}

export function WeeklyGoalSettings({ currentGoal, onGoalUpdated }: WeeklyGoalSettingsProps) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(currentGoal)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (goal < 1 || goal > 168) {
      toast.error("L'objectif doit être entre 1h et 168h")
      return
    }

    setIsLoading(true)
    try {
      const result = await updateUserPreferences({ weeklyGoal: goal })
      if (result?.data) {
        toast.success('Objectif hebdomadaire mis à jour !')
        setOpen(false)
        onGoalUpdated?.(goal)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (_error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Objectif hebdomadaire</DialogTitle>
          <DialogDescription>
            Définissez votre objectif d'heures de travail par semaine
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="weekly-goal">Objectif (heures/semaine)</Label>
            <Input
              id="weekly-goal"
              type="number"
              min={1}
              max={168}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              placeholder="40"
            />
            <p className="text-xs text-muted-foreground">Recommandé : 35-40h pour un temps plein</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Enregistrement...
              </span>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
