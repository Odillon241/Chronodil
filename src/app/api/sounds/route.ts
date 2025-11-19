import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const soundsDir = path.join(process.cwd(), 'public', 'sounds');

    // Vérifier que le répertoire existe
    if (!fs.existsSync(soundsDir)) {
      return NextResponse.json(
        { error: 'Sounds directory not found' },
        { status: 404 }
      );
    }

    // Lire les fichiers du répertoire
    const files = fs.readdirSync(soundsDir);

    // Filtrer pour ne garder que les fichiers audio
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
    });

    // Extraire les IDs (noms sans extension)
    const soundIds = audioFiles.map(file => {
      const nameWithoutExt = path.parse(file).name;
      return {
        id: nameWithoutExt,
        filename: file,
        url: `/sounds/${file}`,
      };
    });

    return NextResponse.json(soundIds);
  } catch (error) {
    console.error('[GET /api/sounds] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list sounds' },
      { status: 500 }
    );
  }
}
