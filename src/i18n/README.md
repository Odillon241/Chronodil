# 🌐 Système i18n de Chronodil

Bienvenue dans le système d'internationalisation de Chronodil !

## 📁 Structure

```
src/i18n/
├── README.md                 # Ce fichier
├── config.ts                 # Configuration i18n
├── provider.tsx              # Provider client-side
├── request.ts                # Configuration server-side
└── messages/
    ├── fr.json              # Traductions françaises (200+ clés)
    └── en.json              # Traductions anglaises (200+ clés)
```

## 🚀 Utilisation rapide

### Dans un composant client

```typescript
import { useTranslations } from 'next-intl';

export function MonComposant() {
  const t = useTranslations("namespace");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <button>{t("common.save")}</button>
    </div>
  );
}
```

### Dans une page serveur

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MaPage() {
  const t = await getTranslations("namespace");
  
  return <h1>{t("title")}</h1>;
}
```

## 📖 Documentation complète

- **[I18N_IMPLEMENTATION.md](../../docs/I18N_IMPLEMENTATION.md)** - Documentation technique
- **[I18N_GUIDE_RAPIDE.md](../../docs/I18N_GUIDE_RAPIDE.md)** - Guide de traduction
- **[SYNTHESE_I18N_FINAL.md](../../docs/SYNTHESE_I18N_FINAL.md)** - Synthèse complète

## 🎯 Clés disponibles

### Namespaces principaux

- `common` - Boutons, actions communes
- `navigation` - Menu de navigation
- `dashboard` - Tableau de bord
- `timesheets` - Feuilles de temps
- `projects` - Projets
- `tasks` - Tâches
- `reports` - Rapports
- `settings` - Paramètres
- `auth` - Authentification
- `validation` - Messages de validation
- `errors` - Messages d'erreur
- `dates` - Jours, mois, périodes

### Exemples de clés

```json
{
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "navigation.dashboard": "Tableau de bord",
  "projects.title": "Projets",
  "projects.new": "Nouveau projet",
  "validation.required": "Ce champ est requis"
}
```

## ➕ Ajouter une nouvelle traduction

1. **Ouvrir les deux fichiers** : `fr.json` et `en.json`

2. **Ajouter la clé dans fr.json** :
```json
{
  "monNamespace": {
    "maNouvelleCle": "Mon texte en français"
  }
}
```

3. **Ajouter la clé dans en.json** :
```json
{
  "monNamespace": {
    "maNouvelleCle": "My text in English"
  }
}
```

4. **Utiliser dans le code** :
```typescript
const t = useTranslations("monNamespace");
<p>{t("maNouvelleCle")}</p>
```

## 🔄 Changer de langue

### Pour l'utilisateur
1. Aller dans **Paramètres → Général → Localisation**
2. Sélectionner la langue souhaitée
3. La page se rafraîchit automatiquement

### Programmatiquement
```typescript
import { updateGeneralSettings } from '@/actions/general-settings.actions';

await updateGeneralSettings({ language: "en" });
router.refresh(); // Rafraîchir pour appliquer
```

## 📊 Statut actuel

- ✅ Infrastructure : 100%
- ✅ Dictionnaires : 200+ clés FR/EN
- ✅ Navigation : 100%
- ✅ Paramètres : 100%
- ⚡ Pages : ~15%

## 🎯 Objectif

**100% de l'application bilingue (FR/EN)**

---

**Dernière mise à jour** : 20 octobre 2025

