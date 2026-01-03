# Implémentation du système i18n (Internationalisation)

## ✅ Ce qui a été implémenté

### 1. Configuration et installation

- ✅ **next-intl installé** : Bibliothèque d'i18n pour Next.js
- ✅ **Configuration** : Fichier `i18n.ts` à la racine du projet
- ✅ **Provider** : Intégré dans `src/app/layout.tsx`

### 2. Dictionnaires de traduction

Créés dans `src/i18n/messages/` :

- ✅ **fr.json** : Traductions françaises complètes
- ✅ **en.json** : Traductions anglaises complètes

**Sections traduites** :
- `common` : Boutons, actions, labels communs
- `navigation` : Menu de navigation
- `dashboard` : Tableau de bord
- `timesheets` : Feuilles de temps
- `projects` : Projets
- `tasks` : Tâches
- `reports` : Rapports
- `settings` : Paramètres (apparence, localisation, accessibilité)
- `auth` : Authentification
- `validation` : Messages de validation
- `errors` : Messages d'erreur
- `dates` : Jours, mois, périodes

### 3. Composants traduits

#### Navigation
- ✅ **AppSidebar** (`src/components/layout/app-sidebar.tsx`)
  - Menu de navigation
  - Footer utilisateur
  - Dropdownmenu (Profil, Paramètres, Déconnexion)

#### Paramètres généraux
- ✅ **AppearanceSection** : Section Apparence
- ✅ **LocalizationSection** : Section Localisation (avec changement de langue fonctionnel)
- ✅ **AccessibilitySection** : Section Accessibilité

### 4. Fonctionnalité de changement de langue

✅ **Implémentée dans LocalizationSection** :
1. L'utilisateur change la langue dans les paramètres
2. La valeur est sauvegardée en base de données
3. La page se rafraîchit automatiquement après 500ms
4. La nouvelle langue est chargée depuis la base de données
5. Toute l'interface bascule dans la nouvelle langue

## 🔄 Fonctionnement

### Chargement de la langue

```typescript
// i18n.ts
export default getRequestConfig(async () => {
  let locale = 'fr'; // Par défaut

  const session = await auth.api.getSession();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { language: true },
    });
    if (user?.language) {
      locale = user.language;
    }
  }

  return {
    locale,
    messages: (await import(`./src/i18n/messages/${locale}.json`)).default,
  };
});
```

### Utilisation dans les composants

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t("navigation.dashboard")}</h1>
      <button>{t("common.save")}</button>
    </div>
  );
}
```

### Utilisation avec namespace

```typescript
const t = useTranslations("settings.appearance");

<CardTitle>{t("title")}</CardTitle>
<Label>{t("darkMode")}</Label>
```

## 📋 Ce qui reste à faire (Phase 2)

### Pages à traduire

- ⏳ **Dashboard** (`src/app/dashboard/page.tsx`)
- ⏳ **Projets** (`src/app/dashboard/projects/`)
- ⏳ **Tâches** (`src/app/dashboard/tasks/`)
- ⏳ **Feuilles de temps** (`src/app/dashboard/timesheet/`)
- ⏳ **Feuilles RH** (`src/app/dashboard/hr-timesheet/`)
- ⏳ **Rapports** (`src/app/dashboard/reports/`)
- ⏳ **Chat** (`src/app/dashboard/chat/`)
- ⏳ **Validation** (`src/app/dashboard/validation/`)
- ⏳ **Paramètres** - Autres onglets
- ⏳ **Authentification** (`src/app/auth/`)

### Formulaires à traduire

- ⏳ Formulaires de création/modification de projets
- ⏳ Formulaires de création/modification de tâches
- ⏳ Formulaires de feuilles de temps
- ⏳ Messages de validation Zod
- ⏳ Messages toast (sonner)

### Fonctionnalités avancées

- ⏳ Formatage des dates selon la locale
- ⏳ Formatage des nombres selon la locale
- ⏳ Pluralisation dynamique
- ⏳ Variables dans les traductions

## 🧪 Comment tester

### 1. Connexion
Connectez-vous à l'application

### 2. Accéder aux paramètres
Dashboard → Paramètres → Onglet "Général"

### 3. Changer la langue
1. Cliquez sur "Localisation"
2. Dans le menu déroulant "Langue", sélectionnez "English"
3. Attendez ~500ms que la page se rafraîchisse

### 4. Vérifier les traductions
Après le rechargement, vous devriez voir :
- ✅ Menu de navigation en anglais
- ✅ Footer (Profile, Settings, Logout) en anglais
- ✅ Paramètres généraux en anglais
- ⏳ Les autres pages restent en français (pas encore traduites)

### 5. Retour au français
Répétez l'opération en sélectionnant "Français"

## 📁 Structure des fichiers

```
chronodil_app/
├── i18n.ts                          # Configuration principale
├── src/
│   ├── i18n/
│   │   ├── messages/
│   │   │   ├── fr.json              # Dictionnaire français
│   │   │   └── en.json              # Dictionnaire anglais
│   │   ├── config.ts                # Configuration i18n
│   │   ├── provider.tsx             # Provider client
│   │   └── request.ts               # Configuration serveur
│   ├── hooks/
│   │   └── use-locale.tsx           # Hook pour changer la langue
│   └── app/
│       └── layout.tsx               # Provider i18n intégré
```

## 🎯 Bonnes pratiques

### 1. Organisation des clés
```json
{
  "namespace": {
    "key": "Traduction",
    "nested": {
      "key": "Traduction imbriquée"
    }
  }
}
```

### 2. Nommage des clés
- **camelCase** pour les clés
- **Descriptif** et **explicite**
- **Groupé par contexte**

### 3. Utilisation dans les composants
```typescript
// ✅ Bon
const t = useTranslations("settings");
<Label>{t("appearance.title")}</Label>

// ❌ Éviter
const t = useTranslations();
<Label>{t("settingsAppearanceTitle")}</Label>
```

### 4. Ajout de nouvelles traductions

1. **Ajouter dans fr.json**
```json
{
  "nouveauNamespace": {
    "nouvelleCle": "Nouveau texte en français"
  }
}
```

2. **Ajouter dans en.json**
```json
{
  "nouveauNamespace": {
    "nouvelleCle": "New text in English"
  }
}
```

3. **Utiliser dans le composant**
```typescript
const t = useTranslations("nouveauNamespace");
<p>{t("nouvelleCle")}</p>
```

## 🐛 Dépannage

### La langue ne change pas
1. Vérifier que la valeur est bien sauvegardée en base
2. Vider le cache Next.js : `rm -rf .next`
3. Redémarrer le serveur

### Erreur "Missing message"
1. Vérifier que la clé existe dans les deux fichiers (fr.json et en.json)
2. Vérifier l'orthographe de la clé
3. Vérifier le namespace utilisé

### Traduction manquante
1. Ajouter la clé dans fr.json ET en.json
2. Redémarrer le serveur de développement

## 📊 Statistiques

- **Dictionnaire FR** : ~200 clés de traduction
- **Dictionnaire EN** : ~200 clés de traduction
- **Composants traduits** : 4/50 (~8%)
- **Pages traduites** : 0/10 (0%)
- **Temps estimé pour tout traduire** : 4-6 heures

## 🚀 Prochaines étapes

1. **Tester le système de base** ✅
2. **Traduire les pages principales** (Dashboard, Projets, Tâches)
3. **Traduire les formulaires**
4. **Traduire les messages de validation**
5. **Implémenter le formatage des dates/nombres**
6. **Traduction complète de l'application**

## 📝 Notes

- Le paramètre de langue est **persisté en base de données** par utilisateur
- La langue est **chargée automatiquement** au démarrage
- Le changement de langue nécessite un **rafraîchissement de la page**
- Les **deux langues** (FR/EN) sont maintenues en parallèle
- Le système est **extensible** pour ajouter d'autres langues

## Date d'implémentation

20 octobre 2025

