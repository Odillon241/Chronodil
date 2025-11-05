const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.env.LOCALAPPDATA || process.env.TMPDIR || process.env.TMP, 'Temp', 'cursor', 'screenshots');
const targetDir = path.join(__dirname, '..', 'docs', 'images');

// Créer le dossier de destination s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✅ Dossier images créé');
}

// Copier les fichiers
try {
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png') && /^0\d-/.test(f));
  
  let copied = 0;
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    try {
      fs.copyFileSync(sourcePath, targetPath);
      copied++;
      console.log(`✅ Copié: ${file}`);
    } catch (err) {
      console.error(`❌ Erreur lors de la copie de ${file}:`, err.message);
    }
  });
  
  console.log(`\n📊 ${copied} fichiers copiés sur ${files.length} trouvés`);
} catch (err) {
  console.error('❌ Erreur:', err.message);
  console.log(`\n📁 Dossier source: ${sourceDir}`);
  console.log(`📁 Dossier cible: ${targetDir}`);
}

