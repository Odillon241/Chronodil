const markdownpdf = require("markdown-pdf");
const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../docs/GUIDE_UTILISATEUR_CHRONODIL.md");
const outputPath = path.join(__dirname, "../docs/GUIDE_UTILISATEUR_CHRONODIL.pdf");

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

markdownpdf(options)
  .from(inputPath)
  .to(outputPath, function () {
    console.log("✅ PDF généré avec succès!");
    console.log(`📁 Fichier disponible: ${outputPath}`);
  });
