'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Keyboard } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Composant d'aide aux raccourcis clavier pour le chat
 * S'affiche automatiquement lors de la première visite
 */
export function ChatKeyboardHints() {
  const [isVisible, setIsVisible] = useState(false)
  const STORAGE_KEY = 'chat-keyboard-hints-dismissed'

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu les hints
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      // Afficher après 2 secondes pour ne pas être trop intrusif
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const shortcuts = [
    {
      key: 'Échap',
      description: 'Revenir en arrière',
      detail: 'Ferme le thread, dialog, ou revient à la liste',
    },
    {
      key: 'Alt + N',
      description: 'Nouvelle conversation',
      detail: 'Ouvre le dialog de création rapide',
    },
    {
      key: 'Ctrl + K',
      description: 'Rechercher (bientôt)',
      detail: 'Recherche dans les conversations et messages',
      disabled: true,
    },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Keyboard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Raccourcis Clavier</h3>
                    <p className="text-xs text-muted-foreground">Gagnez du temps</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6 shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-3 ${shortcut.disabled ? 'opacity-50' : ''}`}
                  >
                    <kbd className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-mono border border-muted-foreground/20 shadow-sm shrink-0">
                      {shortcut.key}
                    </kbd>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{shortcut.description}</p>
                      <p className="text-xs text-muted-foreground">{shortcut.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Appuyez sur{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-muted-foreground/20">
                    ?
                  </kbd>{' '}
                  pour réafficher cette aide
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Version compacte pour le menu d'aide
 */
export function ChatKeyboardHintsCompact({ onClose }: { onClose?: () => void }) {
  const shortcuts = [
    { key: 'Échap', description: 'Revenir en arrière' },
    { key: 'Alt + N', description: 'Nouvelle conversation' },
    { key: 'Ctrl + K', description: 'Rechercher (bientôt)', disabled: true },
  ]

  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Raccourcis Clavier
        </h4>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.key}
            className={`flex items-center justify-between ${shortcut.disabled ? 'opacity-50' : ''}`}
          >
            <span className="text-sm">{shortcut.description}</span>
            <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono border border-muted-foreground/20">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Hook pour gérer l'affichage des hints au clavier
 * Appuyer sur "?" affiche les hints
 */
export function useKeyboardHintsToggle() {
  const [showHints, setShowHints] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + ? (touche ?) pour afficher les hints
      if (e.shiftKey && e.key === '?') {
        e.preventDefault()
        setShowHints(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { showHints, setShowHints }
}
