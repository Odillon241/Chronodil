'use server'

import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { checkUploadRateLimit } from '@/lib/rate-limiter'
import { logSecurityEvent, logRateLimitHit } from '@/lib/security'

// ✅ SÉCURITÉ: Configuration des limites d'upload
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB max
const MAX_BASE64_SIZE = MAX_AVATAR_SIZE_BYTES * 1.37 // Base64 est ~37% plus grand

// Action pour uploader un fichier d'avatar vers Supabase Storage
export const uploadAvatar = authActionClient
  .schema(
    z.object({
      fileName: z
        .string()
        .max(255, 'Nom de fichier trop long')
        .refine(
          (name) => !/[<>:"/\\|?*\x00-\x1f]/.test(name),
          'Nom de fichier contient des caractères invalides',
        ),
      fileContent: z
        .string()
        .max(MAX_BASE64_SIZE, 'Fichier trop volumineux (max 2 MB)')
        .refine(
          (content) => content.startsWith('data:image/'),
          'Le contenu doit être une image encodée en base64',
        ),
      fileType: z
        .string()
        .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Type de fichier non autorisé'),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { fileContent, fileType } = parsedInput
    const { userId } = ctx

    // ✅ SÉCURITÉ: Rate limiting pour les uploads
    const rateLimitResult = checkUploadRateLimit(userId)
    if (!rateLimitResult.allowed) {
      logRateLimitHit(userId, 'upload-avatar')
      throw new Error(`Trop de tentatives. Réessayez dans ${rateLimitResult.retryAfter} secondes.`)
    }

    try {
      // Créer le client Supabase avec la service role key pour l'upload
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      )

      // Générer un nom de fichier unique sécurisé
      const fileExtension = fileType.split('/')[1]
      // ✅ SÉCURITÉ: Utiliser uniquement l'userId et timestamp, pas le nom original
      const uniqueFileName = `avatars/${userId}-${Date.now()}.${fileExtension}`

      // Convertir base64 en buffer
      const base64Data = fileContent.replace(/^data:image\/[a-z]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // ✅ SÉCURITÉ: Vérifier la taille réelle du fichier décodé
      if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
        logSecurityEvent({
          type: 'invalid_input',
          severity: 'medium',
          userId,
          details: { reason: 'Fichier trop volumineux après décodage', size: buffer.length },
        })
        throw new Error('Fichier trop volumineux (max 2 MB)')
      }

      // ✅ SÉCURITÉ: Vérifier les magic bytes pour confirmer le type de fichier
      const magicBytes = buffer.slice(0, 8)
      const isValidImage = validateImageMagicBytes(magicBytes, fileType)
      if (!isValidImage) {
        logSecurityEvent({
          type: 'invalid_input',
          severity: 'high',
          userId,
          details: {
            reason: 'Magic bytes ne correspondent pas au type déclaré',
            declaredType: fileType,
          },
        })
        throw new Error('Le contenu du fichier ne correspond pas au type déclaré')
      }

      // Supprimer l'ancien avatar s'il existe
      const { data: existingFiles } = await supabaseAdmin.storage
        .from('public')
        .list('avatars', { search: `${userId}-` })

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((file) => `avatars/${file.name}`)
        await supabaseAdmin.storage.from('public').remove(filesToDelete)
      }

      // Upload vers Supabase Storage (bucket "public")
      const { data: _data, error } = await supabaseAdmin.storage
        .from('public')
        .upload(uniqueFileName, buffer, {
          contentType: fileType,
          upsert: true,
        })

      if (error) {
        console.error('Erreur Supabase Storage:', error)
        throw new Error(`Erreur lors de l'upload: ${error.message}`)
      }

      // Construire l'URL publique
      const { data: publicUrl } = supabaseAdmin.storage.from('public').getPublicUrl(uniqueFileName)

      return { success: true, fileUrl: publicUrl.publicUrl }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error)
      throw new Error("Erreur lors de l'upload du fichier")
    }
  })

// ✅ SÉCURITÉ: Validation des magic bytes pour vérifier le type réel du fichier
function validateImageMagicBytes(magicBytes: Buffer, declaredType: string): boolean {
  // Magic bytes pour les formats d'image courants
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/jpg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    'image/gif': [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    ],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP)
  }

  const expectedSignatures = signatures[declaredType]
  if (!expectedSignatures) {
    return false
  }

  for (const signature of expectedSignatures) {
    let matches = true
    for (let i = 0; i < signature.length; i++) {
      if (magicBytes[i] !== signature[i]) {
        matches = false
        break
      }
    }
    if (matches) {
      return true
    }
  }

  return false
}
