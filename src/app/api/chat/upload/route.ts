import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { nanoid } from 'nanoid'

const BUCKET_NAME = 'chat-files'

// ============================================================================
// SECURITE: Magic bytes signatures pour validation du contenu reel des fichiers
// ============================================================================

interface MagicByteSignature {
  bytes: number[]
  offset?: number // Offset optionnel pour certains formats (ex: ZIP dans DOCX)
}

// Signatures magic bytes pour tous les types de fichiers autorises
const MAGIC_BYTES_SIGNATURES: Record<string, MagicByteSignature[]> = {
  // Images
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/jpg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  ],
  'image/bmp': [{ bytes: [0x42, 0x4d] }], // BM
  'image/svg+xml': [
    { bytes: [0x3c, 0x73, 0x76, 0x67] }, // <svg
    { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c] }, // <?xml
  ],
  'image/x-icon': [{ bytes: [0x00, 0x00, 0x01, 0x00] }],
  'image/vnd.microsoft.icon': [{ bytes: [0x00, 0x00, 0x01, 0x00] }],

  // PDF
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF

  // Documents Office (tous bases sur ZIP: PK signature)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP)
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP)
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP)
  ],
  // Anciens formats Office (OLE Compound Document)
  'application/msword': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE
  ],
  'application/vnd.ms-excel': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE
  ],
  'application/vnd.ms-powerpoint': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE
  ],

  // Archives
  'application/zip': [{ bytes: [0x50, 0x4b, 0x03, 0x04] }], // PK
  'application/x-rar-compressed': [{ bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07] }], // Rar!
  'application/x-7z-compressed': [
    { bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] }, // 7z
  ],

  // Audio
  'audio/mpeg': [
    { bytes: [0xff, 0xfb] }, // MP3 frame sync
    { bytes: [0xff, 0xfa] }, // MP3 frame sync
    { bytes: [0xff, 0xf3] }, // MP3 frame sync
    { bytes: [0xff, 0xf2] }, // MP3 frame sync
    { bytes: [0x49, 0x44, 0x33] }, // ID3 tag
  ],
  'audio/mp3': [{ bytes: [0xff, 0xfb] }, { bytes: [0xff, 0xfa] }, { bytes: [0x49, 0x44, 0x33] }],
  'audio/wav': [{ bytes: [0x52, 0x49, 0x46, 0x46] }], // RIFF
  'audio/ogg': [{ bytes: [0x4f, 0x67, 0x67, 0x53] }], // OggS
  'audio/webm': [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }], // WebM/Matroska

  // Video
  'video/mp4': [
    { bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp box (partial)
    { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // "ftyp" at offset 4
  ],
  'video/webm': [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }], // WebM/Matroska
  'video/ogg': [{ bytes: [0x4f, 0x67, 0x67, 0x53] }], // OggS
  'video/quicktime': [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 }, // ftypqt
  ],

  // Text (verification minimale - UTF-8 BOM ou caracteres ASCII)
  'text/plain': [
    { bytes: [0xef, 0xbb, 0xbf] }, // UTF-8 BOM
    // Pour text/plain sans BOM, on accepte si pas de bytes nuls dans les premiers octets
  ],
  'text/html': [
    { bytes: [0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45] }, // <!DOCTYPE
    { bytes: [0x3c, 0x68, 0x74, 0x6d, 0x6c] }, // <html
    { bytes: [0xef, 0xbb, 0xbf, 0x3c] }, // UTF-8 BOM + <
  ],
  'text/css': [
    { bytes: [0xef, 0xbb, 0xbf] }, // UTF-8 BOM
  ],
  'text/javascript': [
    { bytes: [0xef, 0xbb, 0xbf] }, // UTF-8 BOM
  ],
  'application/json': [
    { bytes: [0x7b] }, // {
    { bytes: [0x5b] }, // [
    { bytes: [0xef, 0xbb, 0xbf, 0x7b] }, // UTF-8 BOM + {
  ],
}

// Types de fichiers texte qui n'ont pas de magic bytes stricts
const TEXT_BASED_TYPES = [
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'text/csv',
  'text/xml',
  'application/json',
  'application/xml',
]

/**
 * Valide que le contenu reel du fichier correspond au type MIME declare.
 * Retourne true si le fichier est valide, false sinon.
 */
function validateMagicBytes(
  buffer: ArrayBuffer,
  declaredType: string,
): { valid: boolean; reason?: string } {
  const bytes = new Uint8Array(buffer)

  // Pour les fichiers vides ou trop petits
  if (bytes.length < 2) {
    return { valid: false, reason: 'Fichier trop petit pour etre valide' }
  }

  // Verification speciale pour les fichiers texte
  if (TEXT_BASED_TYPES.some((type) => declaredType.startsWith(type))) {
    // Verifier qu'il n'y a pas de bytes nuls dans les 512 premiers octets
    // (indicateur de fichier binaire deguise en texte)
    const checkLength = Math.min(512, bytes.length)
    for (let i = 0; i < checkLength; i++) {
      if (bytes[i] === 0x00) {
        // Exception: UTF-16 peut avoir des bytes nuls
        if (
          bytes[0] === 0xff &&
          bytes[1] === 0xfe // UTF-16 LE BOM
        ) {
          return { valid: true }
        }
        if (
          bytes[0] === 0xfe &&
          bytes[1] === 0xff // UTF-16 BE BOM
        ) {
          return { valid: true }
        }
        return {
          valid: false,
          reason: 'Contenu binaire detecte dans un fichier declare comme texte',
        }
      }
    }
    return { valid: true }
  }

  // Verification speciale pour video/mp4 (structure ftyp box)
  if (declaredType === 'video/mp4' || declaredType === 'video/quicktime') {
    // MP4 a une structure specifique: les 4 premiers bytes sont la taille,
    // puis "ftyp" aux bytes 4-7
    if (bytes.length >= 8) {
      const ftypSignature = [0x66, 0x74, 0x79, 0x70] // "ftyp"
      let isFtyp = true
      for (let i = 0; i < 4; i++) {
        if (bytes[4 + i] !== ftypSignature[i]) {
          isFtyp = false
          break
        }
      }
      if (isFtyp) {
        return { valid: true }
      }
    }
    return { valid: false, reason: 'Structure MP4/MOV invalide (ftyp manquant)' }
  }

  // Verification speciale pour WebP (RIFF + WEBP)
  if (declaredType === 'image/webp') {
    if (bytes.length >= 12) {
      const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      const webp =
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      if (riff && webp) {
        return { valid: true }
      }
    }
    return { valid: false, reason: 'Structure WebP invalide (RIFF/WEBP manquant)' }
  }

  // Verification standard par magic bytes
  const signatures = MAGIC_BYTES_SIGNATURES[declaredType]

  // Si pas de signature connue pour ce type, on accepte avec prudence
  // (pour les types generiques comme audio/*, video/*)
  if (!signatures) {
    // Verifier les prefixes generiques
    if (declaredType.startsWith('image/')) {
      // Image inconnue - verifier les signatures d'images courantes
      const knownImageSignatures = [
        [0x89, 0x50, 0x4e, 0x47], // PNG
        [0xff, 0xd8, 0xff], // JPEG
        [0x47, 0x49, 0x46], // GIF
        [0x52, 0x49, 0x46, 0x46], // RIFF (WebP)
        [0x42, 0x4d], // BMP
      ]

      for (const sig of knownImageSignatures) {
        let matches = true
        for (let i = 0; i < sig.length; i++) {
          if (bytes[i] !== sig[i]) {
            matches = false
            break
          }
        }
        if (matches) return { valid: true }
      }
      return { valid: false, reason: "Format d'image non reconnu" }
    }

    if (declaredType.startsWith('audio/') || declaredType.startsWith('video/')) {
      // Audio/Video inconnu - accepter si pas de detection de contenu suspect
      return { valid: true }
    }

    // Type inconnu - accepter avec log (sera traite par d'autres controles)
    console.warn(`[SECURITY] Type MIME sans signature connue: ${declaredType}`)
    return { valid: true }
  }

  // Verifier si au moins une signature correspond
  for (const signature of signatures) {
    const offset = signature.offset || 0
    let matches = true

    for (let i = 0; i < signature.bytes.length; i++) {
      if (bytes[offset + i] !== signature.bytes[i]) {
        matches = false
        break
      }
    }

    if (matches) {
      return { valid: true }
    }
  }

  return {
    valid: false,
    reason: `Magic bytes ne correspondent pas au type declare (${declaredType})`,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const uploadedFiles = []

    for (const file of files) {
      // Vérifier la taille du fichier (max 50MB pour Supabase Storage)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Le fichier ${file.name} est trop volumineux (max 50MB)` },
          { status: 400 },
        )
      }

      // Vérifier le type de fichier
      const allowedTypes = [
        'image/',
        'video/',
        'audio/',
        'application/pdf',
        'text/',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
      ]

      const isAllowed = allowedTypes.some((type) => file.type.startsWith(type))
      if (!isAllowed) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé: ${file.type}` },
          { status: 400 },
        )
      }

      // Convertir le File en ArrayBuffer pour validation et upload
      const arrayBuffer = await file.arrayBuffer()

      // ========================================================================
      // SECURITE: Validation des magic bytes pour verifier le contenu reel
      // ========================================================================
      const magicBytesValidation = validateMagicBytes(arrayBuffer, file.type)
      if (!magicBytesValidation.valid) {
        console.error(
          `[SECURITY] Magic bytes validation failed for file "${file.name}":`,
          magicBytesValidation.reason,
        )
        return NextResponse.json(
          {
            error: `Le contenu du fichier "${file.name}" ne correspond pas a son type declare. ${magicBytesValidation.reason || ''}`,
          },
          { status: 400 },
        )
      }

      // Générer un nom de fichier unique
      const fileExtension = file.name.split('.').pop()
      const uniqueId = nanoid()
      const fileName = `${session.user.id}/${uniqueId}.${fileExtension}`
      const filePath = `chat/${fileName}`

      // Convertir l'ArrayBuffer en Blob pour l'upload
      const blob = new Blob([arrayBuffer], { type: file.type })

      // Uploader dans Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: false, // Ne pas remplacer si existe déjà
        })

      if (uploadError) {
        console.error('Erreur upload Supabase:', uploadError)
        return NextResponse.json(
          { error: `Erreur lors de l'upload: ${uploadError.message}` },
          { status: 500 },
        )
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

      // Retourner les informations du fichier
      uploadedFiles.push({
        id: uniqueId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        path: filePath,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.id,
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error("Erreur lors de l'upload:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload des fichiers" }, { status: 500 })
  }
}
