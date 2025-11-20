/**
 * Script pour uploader les sons de notification vers Supabase Storage
 * 
 * Usage: pnpm tsx scripts/upload-sounds-to-supabase.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'notification-sounds';
const SOUNDS_DIR = join(process.cwd(), 'public', 'sounds');

// Fonction pour normaliser les noms de fichiers (enlever les accents, caractères spéciaux)
function normalizeFileName(name: string): string {
  return name
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Remplace les caractères spéciaux par des tirets
    .toLowerCase();
}

// Liste des fichiers à uploader
const SOUNDS_TO_UPLOAD = [
  { filename: 'new-notification-3-398649.mp3', name: 'new-notification-3-398649' },
  { filename: 'new-notification-réussi.mp3', name: 'new-notification-reussi' }, // Normalisé sans accent
  { filename: 'notification.wav', name: 'notification' },
];

async function createBucketIfNotExists() {
  console.log(`\n📦 Vérification du bucket "${BUCKET_NAME}"...`);
  
  // Vérifier si le bucket existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Erreur lors de la récupération des buckets:', listError);
    throw listError;
  }

  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  
  if (bucketExists) {
    console.log(`✅ Le bucket "${BUCKET_NAME}" existe déjà`);
    return;
  }

  console.log(`🔨 Création du bucket "${BUCKET_NAME}"...`);
  
  // Créer le bucket avec accès public
  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'],
    fileSizeLimit: 10485760, // 10MB max
  });

  if (error) {
    console.error('❌ Erreur lors de la création du bucket:', error);
    throw error;
  }

  console.log(`✅ Bucket "${BUCKET_NAME}" créé avec succès`);
}

async function uploadSound(filename: string, name: string) {
  const filePath = join(SOUNDS_DIR, filename);
  
  try {
    // Lire le fichier
    const fileBuffer = readFileSync(filePath);
    const fileExtension = filename.split('.').pop() || 'mp3';
    
    console.log(`\n📤 Upload de "${filename}"...`);
    
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${name}.${fileExtension}`, fileBuffer, {
        contentType: fileExtension === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        upsert: true, // Remplacer si existe déjà
      });

    if (error) {
      console.error(`❌ Erreur lors de l'upload de "${filename}":`, error);
      throw error;
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${name}.${fileExtension}`);

    console.log(`✅ "${filename}" uploadé avec succès`);
    console.log(`   URL: ${urlData.publicUrl}`);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de "${filename}":`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Démarrage de l\'upload des sons vers Supabase Storage...\n');
  
  try {
    // Créer le bucket si nécessaire
    await createBucketIfNotExists();
    
    // Uploader chaque fichier
    const uploadedUrls: Record<string, string> = {};
    
    for (const sound of SOUNDS_TO_UPLOAD) {
      const url = await uploadSound(sound.filename, sound.name);
      uploadedUrls[sound.name] = url;
    }
    
    console.log('\n✅ Tous les sons ont été uploadés avec succès !\n');
    console.log('📋 URLs des sons:');
    Object.entries(uploadedUrls).forEach(([name, url]) => {
      console.log(`   ${name}: ${url}`);
    });
    
    console.log('\n💡 Les sons sont maintenant disponibles depuis Supabase Storage');
    console.log('   La fonction getSoundUrl() utilisera automatiquement ces URLs\n');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  }
}

main();
