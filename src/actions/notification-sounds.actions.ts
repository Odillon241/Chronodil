'use server'

import { authActionClient } from '@/lib/safe-action'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const BUCKET_NAME = 'notification-sounds'

// Schéma pour uploader un son
const uploadSoundSchema = z.object({
  file: z.instanceof(File),
  soundId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['classic', 'soft', 'modern', 'alert', 'success', 'error']),
})

// Schéma pour supprimer un son
const deleteSoundSchema = z.object({
  soundId: z.string().min(1),
})

// Schéma pour lister les sons
const listSoundsSchema = z.object({}).optional()

/**
 * Uploader un son de notification dans Supabase Storage
 */
export const uploadNotificationSound = authActionClient
  .schema(uploadSoundSchema)
  .action(async ({ parsedInput }) => {
    const { file, soundId, name, description, category } = parsedInput

    try {
      const supabase = await createSupabaseServerClient()

      // Vérifier que le fichier est un audio
      if (!file.type.startsWith('audio/')) {
        throw new Error('Le fichier doit être un fichier audio')
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux (max 5MB)')
      }

      // Générer le chemin du fichier
      const fileExtension = file.name.split('.').pop()
      const filePath = `${soundId}.${fileExtension}`

      // Convertir le File en ArrayBuffer puis en Blob
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: file.type })

      // Uploader dans Supabase Storage
      const { data: _data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: true, // Remplacer si existe déjà
        })

      if (error) {
        throw new Error(`Erreur lors de l'upload: ${error.message}`)
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

      revalidatePath('/dashboard/settings?tab=notifications')

      return {
        success: true,
        soundId,
        url: urlData.publicUrl,
        path: filePath,
        name,
        description,
        category,
      }
    } catch (error: any) {
      console.error("Erreur lors de l'upload du son:", error)
      throw new Error(error.message || "Erreur lors de l'upload du son")
    }
  })

/**
 * Supprimer un son de notification
 */
export const deleteNotificationSound = authActionClient
  .schema(deleteSoundSchema)
  .action(async ({ parsedInput }) => {
    const { soundId } = parsedInput

    try {
      const supabase = await createSupabaseServerClient()

      // Lister les fichiers pour trouver celui correspondant au soundId
      const { data: files, error: listError } = await supabase.storage.from(BUCKET_NAME).list()

      if (listError) {
        throw new Error(`Erreur lors de la liste: ${listError.message}`)
      }

      // Trouver le fichier correspondant
      const fileToDelete = files?.find((file) => file.name.startsWith(soundId + '.'))

      if (!fileToDelete) {
        throw new Error('Son non trouvé')
      }

      // Supprimer le fichier
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileToDelete.name])

      if (deleteError) {
        throw new Error(`Erreur lors de la suppression: ${deleteError.message}`)
      }

      revalidatePath('/dashboard/settings?tab=notifications')

      return {
        success: true,
        soundId,
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression du son:', error)
      throw new Error(error.message || 'Erreur lors de la suppression du son')
    }
  })

/**
 * Lister tous les sons disponibles dans Supabase Storage
 */
export const listNotificationSounds = authActionClient.schema(listSoundsSchema).action(async () => {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list()

    if (error) {
      throw new Error(`Erreur lors de la liste: ${error.message}`)
    }

    // Construire les URLs publiques pour chaque fichier
    const sounds =
      files?.map((file) => {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name)

        return {
          id: file.name.split('.')[0], // Extraire l'ID du nom de fichier
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
        }
      }) || []

    return {
      success: true,
      sounds,
    }
  } catch (error: any) {
    console.error('Erreur lors de la liste des sons:', error)
    throw new Error(error.message || 'Erreur lors de la liste des sons')
  }
})

/**
 * Obtenir l'URL publique d'un son
 */
export async function getNotificationSoundUrl(
  soundId: string,
  extension: string = 'mp3',
): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const filePath = `${soundId}.${extension}`

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return data.publicUrl
}
