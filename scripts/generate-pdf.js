const markdownpdf = require("markdown-pdf");
const fs = require("fs");
const path = require("path");

// Copier d'abord les captures d'écran si nécessaire
const copyScreenshots = () => {
  // Essayer plusieurs emplacements possibles pour les captures
  const possibleSources = [
    path.join(process.env.LOCALAPPDATA || '', 'Temp', 'cursor', 'screenshots'),
    path.join(process.env.TMP || '', 'cursor', 'screenshots'),
    path.join(process.env.TEMP || '', 'cursor', 'screenshots'),
    path.join(process.cwd(), 'screenshots'),
  ];
  
  const targetDir = path.join(__dirname, '..', 'docs', 'images');

  // Créer le dossier de destination s'il n'existe pas
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Dossier créé: ${targetDir}`);
  }

  // Copier les fichiers depuis le premier dossier source trouvé
  let found = false;
  for (const sourceDir of possibleSources) {
    try {
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir).filter(f => 
          f.endsWith('.png') && (
            /^0\d-/.test(f) || 
            f.includes('page-connexion') ||
            f.includes('dashboard') ||
            f.includes('feuilles-de-temps') ||
            f.includes('projets') ||
            f.includes('taches') ||
            f.includes('validation') ||
            f.includes('rapports') ||
            f.includes('parametres') ||
            f.includes('audit')
          )
        );
        
        if (files.length > 0) {
          console.log(`📂 Dossier source trouvé: ${sourceDir}`);
          files.forEach(file => {
            const sourcePath = path.join(sourceDir, file);
            // Normaliser le nom du fichier pour correspondre au guide
            let targetFile = file;
            if (file.includes('connexion') || file.includes('login')) targetFile = '01-page-connexion.png';
            else if (file.includes('dashboard')) targetFile = '02-dashboard.png';
            else if (file.includes('feuille') || file.includes('timesheet')) targetFile = '03-feuilles-de-temps.png';
            else if (file.includes('projet') || file.includes('project')) targetFile = '04-projets.png';
            else if (file.includes('tache') || file.includes('task')) targetFile = '05-taches.png';
            else if (file.includes('validation') || file.includes('approval')) targetFile = '06-validation.png';
            else if (file.includes('rapport') || file.includes('report')) targetFile = '07-rapports.png';
            else if (file.includes('parametre') || file.includes('setting')) targetFile = '08-parametres.png';
            else if (file.includes('audit') || file.includes('log')) targetFile = '09-audit.png';
            
            const targetPath = path.join(targetDir, targetFile);
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, targetPath);
              console.log(`✅ Image copiée: ${file} → ${targetFile}`);
            }
          });
          found = true;
          break;
        }
      }
    } catch (err) {
      // Continuer avec le prochain dossier
      continue;
    }
  }
  
  if (!found) {
    console.warn(`⚠️  Aucune capture d'écran trouvée. Vérifiez que les images existent dans docs/images/`);
  }
  
  // Vérifier les images existantes dans le dossier cible
  try {
    const existingFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.png'));
    console.log(`📊 ${existingFiles.length} image(s) disponible(s) dans docs/images/`);
  } catch (err) {
    console.warn(`⚠️  Impossible de lire le dossier images: ${err.message}`);
  }
};

// Copier les captures d'écran
copyScreenshots();

const inputPath = path.join(__dirname, "../docs/GUIDE_UTILISATEUR_CHRONODIL.md");
const outputPath = path.join(__dirname, "../docs/GUIDE_UTILISATEUR_CHRONODIL.pdf");

// Lire le markdown et convertir les chemins d'images en absolus
const markdownContent = fs.readFileSync(inputPath, 'utf8');
const imagesDir = path.join(__dirname, "..", "docs", "images");
const absoluteImagesDir = path.resolve(imagesDir).replace(/\\/g, '/');

// Convertir les chemins relatifs en absolus dans le markdown
const processedMarkdown = markdownContent.replace(
  /!\[([^\]]*)\]\(images\/([^\)]+)\)/g,
  (match, alt, filename) => {
    const imagePath = path.join(imagesDir, filename);
    const absolutePath = path.resolve(imagePath).replace(/\\/g, '/');
    return `![${alt}](${absolutePath})`;
  }
);

// Options pour markdown-pdf
const options = {
  cssPath: path.join(__dirname, "../docs/pdf-style.css"),
  paperFormat: "A4",
  paperOrientation: "portrait",
  paperBorder: "2cm",
  remarkable: {
    html: true,
    breaks: true,
    typographer: true,
  },
};

console.log("📄 Génération du PDF en cours...");
console.log(`   Source: ${inputPath}`);
console.log(`   Destination: ${outputPath}`);

// Créer un fichier temporaire avec les chemins absolus
const tempMarkdownPath = path.join(__dirname, "..", "docs", "GUIDE_UTILISATEUR_CHRONODIL_temp.md");
fs.writeFileSync(tempMarkdownPath, processedMarkdown, 'utf8');

markdownpdf(options)
  .from(tempMarkdownPath)
  .to(outputPath, function (err) {
    // Supprimer le fichier temporaire
    if (fs.existsSync(tempMarkdownPath)) {
      fs.unlinkSync(tempMarkdownPath);
    }
    
    if (err) {
      console.error("❌ Erreur lors de la génération du PDF:", err);
      process.exit(1);
    } else {
      console.log("✅ PDF généré avec succès!");
      console.log(`📁 Fichier disponible: ${outputPath}`);
    }
  });
