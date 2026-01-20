'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  sendMessage,
  sendMessageWithThread,
  updateMessage,
  deleteMessage,
  toggleReaction,
  pinMessage,
  unpinMessage,
} from '@/actions/chat.actions'

interface UseChatMessagesProps {
  conversationId: string
  onUpdate: () => void
}

export function useChatMessages({ conversationId, onUpdate }: UseChatMessagesProps) {
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  // Fonction d'upload
  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return []

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const uploadResponse = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData,
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(errorData.error || "Erreur lors de l'upload des fichiers")
    }

    const uploadResult = await uploadResponse.json()
    return uploadResult.files || []
  }, [])

  // Envoyer un message
  const handleSendMessage = useCallback(
    async (
      content: string,
      attachments: { name: string; url: string; type: string; size: number }[] = [],
      replyToId?: string,
    ) => {
      // Si nous avons des fichiers "raw" (simulés par URL.createObjectURL dans le composant),
      // nous devrions idéalement gérer l'upload ici si ce n'est pas déjà fait.
      // Mais pour simplifier, nous supposons que le caller (ChatMessageList) gère l'upload
      // ou que nous refactorisons pour passer les File[] directement.

      // Pour l'instant, nous gardons la signature compatible avec ce qui est attendu,
      // mais nous allons permettre de passer des File[] dans une surcharge future si besoin.
      // Actuellement ChatMessageList passe des objets { name, url, type, size }.
      // Si l'URL est un blob, c'est qu'il faut upload.

      if (!content.trim() && attachments.length === 0) return

      setSending(true)
      try {
        const finalAttachments = [...attachments]

        // S'il y a des blobs, il faudrait les uploader.
        // Cependant, ChatMessageInput nous donne des File objets, mais ChatMessageList les transforme.
        // On va changer ChatMessageList pour appeler uploadFiles d'abord.

        const result = replyToId
          ? await sendMessageWithThread({
              conversationId,
              content: content.trim() || '(Fichier joint)',
              replyToId,
              attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
            })
          : await sendMessage({
              conversationId,
              content: content.trim() || '(Fichier joint)',
              attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
            })

        if (result?.data) {
          onUpdate()
          // Toast supprimé - le message apparaît immédiatement, pas besoin de confirmation
          return true
        } else {
          toast.error(result?.serverError || "Erreur lors de l'envoi")
          return false
        }
      } catch (_error: any) {
        toast.error(_error.message || "Erreur lors de l'envoi du message")
        return false
      } finally {
        setSending(false)
      }
    },
    [conversationId, onUpdate],
  )

  // Modifier un message
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim()) return

      try {
        const result = await updateMessage({
          messageId,
          content: newContent.trim(),
        })

        if (result?.data) {
          setEditingMessageId(null)
          setEditingContent('')
          onUpdate()
          toast.success('Message modifié')
        } else {
          toast.error(result?.serverError || 'Erreur lors de la modification')
        }
      } catch (_error) {
        toast.error('Erreur lors de la modification du message')
      }
    },
    [onUpdate],
  )

  // Supprimer un message
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return

      try {
        const result = await deleteMessage({ messageId })

        if (result?.data) {
          onUpdate()
          toast.success('Message supprimé')
        } else {
          toast.error(result?.serverError || 'Erreur lors de la suppression')
        }
      } catch (_error) {
        toast.error('Erreur lors de la suppression du message')
      }
    },
    [onUpdate],
  )

  // Toggle réaction
  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const result = await toggleReaction({ messageId, emoji })

        if (result?.data) {
          onUpdate()
        } else {
          toast.error(result?.serverError || 'Erreur')
        }
      } catch (_error) {
        toast.error("Erreur lors de l'ajout de la réaction")
      }
    },
    [onUpdate],
  )

  // Épingler un message
  const handlePinMessage = useCallback(
    async (messageId: string) => {
      try {
        const result = await pinMessage({
          messageId,
          conversationId,
        })

        if (result?.serverError) {
          toast.error(result.serverError)
        } else {
          toast.success('Message épinglé')
          onUpdate()
        }
      } catch (_error) {
        toast.error("Erreur lors de l'épinglage du message")
      }
    },
    [conversationId, onUpdate],
  )

  // Désépingler un message
  const handleUnpinMessage = useCallback(
    async (messageId: string) => {
      try {
        const result = await unpinMessage({ messageId })

        if (result?.serverError) {
          toast.error(result.serverError)
        } else {
          toast.success('Message désépinglé')
          onUpdate()
        }
      } catch (_error) {
        toast.error('Erreur lors du désépinglage du message')
      }
    },
    [onUpdate],
  )

  // Démarrer l'édition
  const startEditing = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }, [])

  // Annuler l'édition
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null)
    setEditingContent('')
  }, [])

  return {
    sending,
    editingMessageId,
    editingContent,
    setEditingContent,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleToggleReaction,
    handlePinMessage,
    handleUnpinMessage,
    uploadFiles,
    startEditing,
    cancelEditing,
  }
}
