# Guide d'Utilisation Chronodil - Documentation

## 📚 Fichiers Disponibles

Ce dossier contient le guide d'utilisation complet de l'application Chronodil, disponible en deux formats :

- **GUIDE_UTILISATEUR_CHRONODIL.md** : Version Markdown (éditable)
- **GUIDE_UTILISATEUR_CHRONODIL.pdf** : Version PDF (prêt à distribuer)

## 🎯 Contenu du Guide

Le guide couvre l'utilisation complète de l'application Chronodil selon chaque rôle :

### Rôles Documentés

1. **👤 EMPLOYÉ (EMPLOYEE)**
   - Saisie des feuilles de temps
   - Gestion des tâches personnelles
   - Consultation des projets
   - Messagerie et notifications

2. **👨‍💼 MANAGER**
   - Validation des feuilles de temps de l'équipe
   - Gestion des projets et attribution des tâches
   - Suivi des performances
   - Génération de rapports d'équipe

3. **👔 RESSOURCES HUMAINES (HR)**
   - Gestion des feuilles RH (activités hebdomadaires)
   - Validation finale des feuilles de temps
   - Gestion des utilisateurs et départements
   - Rapports globaux d'entreprise

4. **🎯 DIRECTEUR**
   - Tableaux de bord stratégiques
   - Validation finale des feuilles RH (signature Odillon)
   - Rapports de direction
   - Audit complet

5. **🔐 ADMINISTRATEUR (ADMIN)**
   - Configuration complète de l'application
   - Gestion totale des utilisateurs et rôles
   - Gestion des départements et catalogues
   - Paramètres de sécurité et base de données

### Fonctionnalités Communes

- Recherche globale (Ctrl+K / Cmd+K)
- Messagerie instantanée
- Centre de notifications
- Génération de rapports
- Calendrier et échéances
- Personnalisation de l'interface

## 🔄 Régénérer le PDF

Si vous modifiez le fichier Markdown, vous pouvez régénérer le PDF avec :

```bash
# Option 1 : Utiliser le script npm
pnpm docs:pdf

# Option 2 : Exécuter directement le script
node scripts/generate-pdf.js
```

### Pré-requis

Le package `markdown-pdf` doit être installé (déjà inclus en devDependencies) :

```bash
pnpm install
```

## ✏️ Modifier le Guide

### Fichier Source (Markdown)

Éditez le fichier `GUIDE_UTILISATEUR_CHRONODIL.md` avec votre éditeur préféré.

**Structure du document :**
```markdown
# Titre Principal
## Section
### Sous-section
#### Sous-sous-section

- Liste à puces
1. Liste numérotée

**Gras** | *Italique* | `Code`

> Citation

| Colonne 1 | Colonne 2 |
|-----------|-----------|
| Donnée 1  | Donnée 2  |
```

### Style PDF

Pour modifier l'apparence du PDF, éditez le fichier CSS :

```bash
docs/pdf-style.css
```

**Personnalisations disponibles :**
- Couleurs du thème (actuellement Rusty Red #c2410c)
- Polices de caractères
- Tailles de texte
- Marges et espacements
- Styles de tableaux
- En-têtes et pieds de page

## 📤 Distribution du Guide

### Pour les Employés

Distribuez le fichier PDF via :
- Email
- Intranet de l'entreprise
- Dossier partagé (OneDrive, Google Drive)
- Impression papier (optionnel)

### Versions

**Version actuelle :** 1.0 (2025-01-05)

Lors de modifications majeures :
1. Mettez à jour la version dans le document
2. Ajoutez la date de modification
3. Régénérez le PDF
4. Distribuez la nouvelle version

## 🛠️ Scripts Disponibles

### generate-pdf.js

Fichier : `scripts/generate-pdf.js`

Convertit le fichier Markdown en PDF avec options de formatage :

```javascript
const options = {
  cssPath: "docs/pdf-style.css",      // Feuille de style
  paperFormat: "A4",                   // Format papier
  paperOrientation: "portrait",        // Orientation
  paperBorder: "2cm",                  // Marges
  remarkable: {
    html: true,                        // Support HTML
    breaks: true,                      // Sauts de ligne
    typographer: true,                 // Typographie améliorée
  },
};
```

## 📋 Structure des Fichiers

```
docs/
├── GUIDE_UTILISATEUR_CHRONODIL.md    # Guide Markdown (source)
├── GUIDE_UTILISATEUR_CHRONODIL.pdf   # Guide PDF (généré)
├── pdf-style.css                      # Styles pour PDF
└── README_GUIDE.md                    # Ce fichier

scripts/
└── generate-pdf.js                    # Script de génération PDF
```

## 💡 Conseils

### Pour les Mises à Jour

1. **Faites vos modifications** dans le fichier `.md`
2. **Vérifiez le rendu** Markdown avec un éditeur (VS Code, Typora)
3. **Régénérez le PDF** avec `pnpm docs:pdf`
4. **Vérifiez le PDF** avant distribution

### Bonnes Pratiques

- ✅ **Versionnez** chaque modification majeure
- ✅ **Datez** les changements dans le document
- ✅ **Testez** les instructions avec un utilisateur test
- ✅ **Capturez** des screenshots si nécessaire (ajoutez dans `/docs/images/`)
- ✅ **Gardez** une archive des anciennes versions

### Maintenance

- 📅 **Revoyez le guide** à chaque mise à jour majeure de l'application
- 📅 **Collectez les retours** des utilisateurs
- 📅 **Mettez à jour** les FAQ selon les questions récurrentes

## 🔗 Ressources Complémentaires

### Markdown

- [Guide Markdown](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### PDF Generation

- [markdown-pdf npm package](https://www.npmjs.com/package/markdown-pdf)
- [PhantomJS Documentation](https://phantomjs.org/documentation/)

### CSS for Print

- [CSS Print Styles](https://www.smashingmagazine.com/2015/01/designing-for-print-with-css/)
- [Print CSS Best Practices](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/)

## 📞 Contact

Pour toute question concernant ce guide :

- **Administrateur Système** : Support technique
- **Responsable Formation** : Clarifications métier
- **Développeur** : Modifications techniques du script

## 📜 Licence

Ce guide est propriété de votre entreprise et destiné à un usage interne uniquement.

---

*Dernière mise à jour : 2025-01-05*
