/**
 * Script to verify that accent color themes are properly defined in CSS
 * This checks if the CSS variables are correctly set up for each accent color
 */

import fs from "fs";
import path from "path";

const globalsPath = path.join(process.cwd(), "src", "app", "globals.css");

console.log("🎨 Vérification des thèmes de couleur d'accentuation\n");

// Read globals.css
const cssContent = fs.readFileSync(globalsPath, "utf-8");

// Expected accent colors
const accentColors = [
  "rusty-red",
  "ou-crimson",
  "powder-blue",
  "forest-green",
  "golden-orange",
];

// Check light mode themes
console.log("📝 Light Mode:");
accentColors.forEach((color) => {
  const regex = new RegExp(`\\[data-accent="${color}"\\]\\s*{[^}]*--primary:[^;]+;`, "s");
  const found = regex.test(cssContent);
  console.log(`  ${found ? "✅" : "❌"} [data-accent="${color}"]`);
});

console.log("\n🌙 Dark Mode:");
accentColors.forEach((color) => {
  const regex = new RegExp(`\\.dark\\[data-accent="${color}"\\]\\s*{[^}]*--primary:[^;]+;`, "s");
  const found = regex.test(cssContent);
  console.log(`  ${found ? "✅" : "❌"} .dark[data-accent="${color}"]`);
});

// Check if all required CSS variables are defined
console.log("\n📊 Variables CSS définies:");
const hasRootVars = /--primary:/.test(cssContent) && /--ring:/.test(cssContent);
console.log(`  ${hasRootVars ? "✅" : "❌"} Variables de base (--primary, --ring)`);

// Count total theme definitions
const lightThemeCount = (cssContent.match(/\[data-accent="[^"]+"\]\s*{/g) || []).length;
const darkThemeCount = (cssContent.match(/\.dark\[data-accent="[^"]+"\]\s*{/g) || []).length;

console.log(`\n📈 Total des définitions:`);
console.log(`  Light mode: ${lightThemeCount} thèmes`);
console.log(`  Dark mode: ${darkThemeCount} thèmes`);

if (lightThemeCount === 5 && darkThemeCount === 5) {
  console.log("\n✅ Tous les thèmes de couleur d'accentuation sont correctement définis!");
} else {
  console.log("\n⚠️ Certains thèmes sont manquants");
}
