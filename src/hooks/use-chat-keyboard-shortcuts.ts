'use client'

import { useEffect } from 'react'

interface UseChatKeyboardShortcutsProps {
  onSearch?: () => void
  onNewMessage?: () => void
  onEscape?: () => void
}

export function useChatKeyboardShortcuts({
  onSearch,
  onNewMessage,
  onEscape,
}: UseChatKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onSearch?.()
      }

      // Alt+N for New Message (Ctrl+N is reserved by browser)
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key === 'n') {
        e.preventDefault()
        onNewMessage?.()
      }

      // Escape to close things
      if (e.key === 'Escape') {
        onEscape?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearch, onNewMessage, onEscape])
}
