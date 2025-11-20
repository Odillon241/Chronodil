const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src/app/dashboard/settings/users/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer la condition dans handleDeleteUser
content = content.replace(
  /if \(user\.email === "admin@chronodil\.com" && user\.role === "ADMIN"\) \{\s+toast\.error\("Le compte administrateur principal ne peut pas être supprimé"\);/g,
  `if (user.role === "ADMIN") {\n      toast.error("Les comptes administrateurs ne peuvent pas être supprimés");`
);

// Remplacer les conditions disabled et title pour le bouton desktop
content = content.replace(
  /title=\{user\.email === "admin@chronodil\.com" && user\.role === "ADMIN" \? "Compte protégé" : "Supprimer"\}\s+disabled=\{user\.email === "admin@chronodil\.com" && user\.role === "ADMIN"\}/g,
  `title={user.role === "ADMIN" ? "Les comptes administrateurs sont protégés" : "Supprimer"}\n                          disabled={user.role === "ADMIN"}`
);

// Remplacer les conditions disabled et title pour le bouton mobile
content = content.replace(
  /title=\{user\.email === "admin@chronodil\.com" && user\.role === "ADMIN" \? "Compte protégé" : "Supprimer"\}\s+disabled=\{user\.email === "admin@chronodil\.com" && user\.role === "ADMIN"\}/g,
  `title={user.role === "ADMIN" ? "Les comptes administrateurs sont protégés" : "Supprimer"}\n                        disabled={user.role === "ADMIN"}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Icône de suppression désactivée pour tous les comptes ADMIN');
