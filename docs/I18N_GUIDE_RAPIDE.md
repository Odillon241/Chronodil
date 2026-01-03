# Guide rapide i18n - Comment traduire une page

## ✅ Ce qui est déjà fait

### Infrastructure
- ✅ next-intl installé et configuré
- ✅ Dictionnaires FR/EN complets (~200 clés)
- ✅ Système de changement de langue fonctionnel

### Composants traduits
- ✅ **Navigation** (Sidebar)
- ✅ **Paramètres généraux** (Apparence, Localisation, Accessibilité)
- ✅ **Dashboard** (partiellement)

## 📋 Pattern de traduction

### Pour les composants CLIENT ("use client")

```typescript
// 1. Importer useTranslations
import { useTranslations } from 'next-intl';

// 2. Dans le composant
export function MonComposant() {
  const t = useTranslations(); // Ou useTranslations("namespace")
  
  return (
    <div>
      <h1>{t("navigation.dashboard")}</h1>
      <button>{t("common.save")}</button>
    </div>
  );
}
```

### Pour les pages SERVEUR (Server Components)

```typescript
// 1. Importer getTranslations
import { getTranslations } from 'next-intl/server';

// 2. Dans la fonction async
export default async function MaPage() {
  const t = await getTranslations("dashboard");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("welcome")}</p>
    </div>
  );
}
```

## 🎯 Clés disponibles dans les dictionnaires

### common
```json
{
  "save": "Enregistrer / Save",
  "cancel": "Annuler / Cancel",
  "delete": "Supprimer / Delete",
  "edit": "Modifier / Edit",
  "add": "Ajouter / Add",
  "create": "Créer / Create",
  "update": "Mettre à jour / Update",
  "close": "Fermer / Close",
  "search": "Rechercher / Search",
  "loading": "Chargement... / Loading...",
  // ... et bien d'autres
}
```

### navigation
```json
{
  "dashboard": "Tableau de bord / Dashboard",
  "timesheets": "Feuilles de temps / Timesheets",
  "projects": "Projets / Projects",
  "tasks": "Tâches / Tasks",
  "reports": "Rapports / Reports",
  "settings": "Paramètres / Settings",
  "profile": "Profil / Profile",
  "logout": "Déconnexion / Logout"
}
```

### dashboard.stats
```json
{
  "totalHours": "Total des heures / Total Hours",
  "thisWeek": "Cette semaine / This Week",
  "thisMonth": "Ce mois / This Month",
  "pending": "En attente / Pending",
  "approved": "Approuvées / Approved"
}
```

### timesheets
```json
{
  "title": "Feuilles de temps / Timesheets",
  "new": "Nouvelle saisie / New Entry",
  "project": "Projet / Project",
  "task": "Tâche / Task",
  "startTime": "Heure de début / Start Time",
  "endTime": "Heure de fin / End Time",
  "status": {
    "draft": "Brouillon / Draft",
    "submitted": "Soumis / Submitted",
    "approved": "Approuvé / Approved",
    "rejected": "Rejeté / Rejected"
  }
}
```

### projects
```json
{
  "title": "Projets / Projects",
  "new": "Nouveau projet / New Project",
  "code": "Code / Code",
  "name": "Nom / Name",
  "budget": "Budget / Budget"
}
```

### tasks
```json
{
  "title": "Tâches / Tasks",
  "new": "Nouvelle tâche / New Task",
  "priority": {
    "low": "Basse / Low",
    "medium": "Moyenne / Medium",
    "high": "Haute / High",
    "urgent": "Urgente / Urgent"
  },
  "status": {
    "todo": "À faire / To Do",
    "inProgress": "En cours / In Progress",
    "done": "Terminée / Done"
  }
}
```

### validation
```json
{
  "required": "Ce champ est requis / This field is required",
  "email": "Adresse e-mail invalide / Invalid email address",
  "minLength": "Minimum {min} caractères / Minimum {min} characters",
  "maxLength": "Maximum {max} caractères / Maximum {max} characters"
}
```

## 🚀 Procédure de traduction d'une page

### Étape 1: Identifier les textes à traduire

Cherchez tous les textes en dur dans la page :
- Titres (`<h1>`, `<h2>`, etc.)
- Labels (`<Label>`)
- Boutons (`<Button>`)
- Messages (`toast.success()`, `toast.error()`)
- Placeholders
- Descriptions

### Étape 2: Vérifier si les clés existent

Consultez `src/i18n/messages/fr.json` et `en.json` pour voir si les clés existent déjà.

### Étape 3: Ajouter les clés manquantes

Si une clé n'existe pas, ajoutez-la dans **les deux fichiers** :

**fr.json**
```json
{
  "maNouvelleSection": {
    "title": "Mon titre en français",
    "description": "Description en français"
  }
}
```

**en.json**
```json
{
  "maNouvelleSection": {
    "title": "My title in English",
    "description": "Description in English"
  }
}
```

### Étape 4: Remplacer les textes

```typescript
// AVANT
<h1>Mes projets</h1>
<Button>Ajouter</Button>

// APRÈS
<h1>{t("projects.title")}</h1>
<Button>{t("common.add")}</Button>
```

### Étape 5: Tester

1. Changez de langue dans les paramètres
2. Vérifiez que tous les textes changent
3. Testez les deux langues (FR et EN)

## 📊 Pages prioritaires à traduire

### 🔴 Haute priorité
1. **Dashboard** - Partiellement fait
2. **Projets** - Liste et création
3. **Tâches** - Liste et création
4. **Feuilles de temps** - Formulaire principal
5. **Paramètres** - Autres onglets

### 🟡 Moyenne priorité
6. Feuilles RH
7. Rapports
8. Chat
9. Validation

### 🟢 Basse priorité
10. Pages d'administration
11. Audit logs
12. Profil utilisateur

## 💡 Astuces

### 1. Utiliser les namespaces

```typescript
// Au lieu de
const t = useTranslations();
<Label>{t("projects.name")}</Label>

// Préférez
const t = useTranslations("projects");
<Label>{t("name")}</Label>
```

### 2. Variables dans les traductions

```json
{
  "welcome": "Bienvenue {name} !"
}
```

```typescript
t("welcome", { name: user.name })
```

### 3. Pluralisation

```json
{
  "itemCount": "{count, plural, =0 {Aucun élément} =1 {1 élément} other {# éléments}}"
}
```

```typescript
t("itemCount", { count: items.length })
```

### 4. Messages toast

```typescript
// AVANT
toast.success("Projet créé avec succès");
toast.error("Erreur lors de la création");

// APRÈS
toast.success(t("projects.messages.created"));
toast.error(t("projects.messages.error"));
```

### 5. Validation Zod

```typescript
// AVANT
name: z.string().min(3, "Minimum 3 caractères")

// APRÈS
const t = useTranslations("validation");
name: z.string().min(3, t("minLength", { min: 3 }))
```

## 🔧 Outils de développement

### Voir la langue actuelle
```typescript
import { useLocale } from 'next-intl';

const locale = useLocale(); // "fr" ou "en"
```

### Debug d'une clé manquante

Si vous voyez une erreur comme "Missing message: projects.unknownKey":
1. Vérifiez l'orthographe de la clé
2. Vérifiez qu'elle existe dans fr.json ET en.json
3. Redémarrez le serveur après l'ajout

## 📁 Fichiers à modifier

Pour traduire une page, vous devrez généralement modifier :

1. **Le fichier de la page** : `src/app/dashboard/[page]/page.tsx`
2. **Les composants utilisés** : `src/components/features/[composant].tsx`
3. **Les actions serveur** : `src/actions/[action].actions.ts` (pour les messages)
4. **Les dictionnaires** : `src/i18n/messages/fr.json` et `en.json` (si nouvelles clés)

## ⚡ Exemple complet

### AVANT (projects/page.tsx)
```typescript
export default function ProjectsPage() {
  return (
    <div>
      <h1>Mes projets</h1>
      <Button>Nouveau projet</Button>
      <p>Aucun projet trouvé</p>
    </div>
  );
}
```

### APRÈS
```typescript
import { useTranslations } from 'next-intl';

export default function ProjectsPage() {
  const t = useTranslations("projects");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <Button>{t("new")}</Button>
      <p>{t("noProjects")}</p>
    </div>
  );
}
```

### Ajout dans fr.json
```json
{
  "projects": {
    "title": "Mes projets",
    "new": "Nouveau projet",
    "noProjects": "Aucun projet trouvé"
  }
}
```

### Ajout dans en.json
```json
{
  "projects": {
    "title": "My projects",
    "new": "New project",
    "noProjects": "No projects found"
  }
}
```

## 🎯 Objectif final

Toute l'application doit être bilingue (FR/EN) sans aucun texte en dur dans le code.

**Temps estimé** : 4-6 heures pour traduire toute l'application.

**Bénéfices** :
- ✅ Application multilingue
- ✅ Facilité d'ajout de nouvelles langues
- ✅ Maintenance simplifiée
- ✅ Expérience utilisateur améliorée

---

**Date** : 20 octobre 2025  
**Statut** : Infrastructure complète, traduction partielle (~10% des pages)

