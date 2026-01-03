# Plan d'implémentation Responsive - Chronodil App

**Date**: 2025-10-13
**Status**: En cours
**Priorité**: Haute

## Breakpoints Tailwind (par défaut)

```
sm: 640px   - Mobile large / Portrait tablet
md: 768px   - Tablet
lg: 1024px  - Desktop small
xl: 1280px  - Desktop
2xl: 1536px - Desktop large
```

## Stratégie responsive

### Mobile-First Approach
- Développer d'abord pour mobile (< 640px)
- Ajouter progressivement les breakpoints supérieurs
- Utiliser `hidden` / `block` pour afficher/masquer des éléments

---

## 1. Layout Principal (PRIORITÉ 1)

### 1.1 Dashboard Layout
**Fichier**: `src/app/dashboard/layout.tsx`

**Problèmes**:
- Header fixe non optimisé pour mobile
- Breadcrumb peut être trop long sur mobile
- Actions (ModeToggle, Notifications) non adaptées

**Actions**:
- [x] Sidebar déjà collapsible (OK)
- [ ] Header : réduire padding sur mobile
- [ ] Breadcrumb : tronquer sur mobile avec tooltip
- [ ] Actions : grouper dans un dropdown sur mobile

### 1.2 App Sidebar
**Fichier**: `src/components/layout/app-sidebar.tsx`

**Statut**: ✅ Déjà responsive avec `collapsible="icon"`

**Améliorations possibles**:
- [ ] Ajouter un menu hamburger explicite sur mobile
- [ ] Optimiser les avatars et noms d'utilisateur

---

## 2. Pages Dashboard (PRIORITÉ 1)

### 2.1 Page Dashboard principale
**Fichier**: `src/app/dashboard/page.tsx`

**Problèmes**:
```tsx
// Ligne 199 - Grid stats
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// ❌ Pas de cols-1 pour mobile

// Ligne 216 - Grid charts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
// ❌ Ratio 4/3 trop complexe pour mobile
```

**Actions**:
- [ ] Stats : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] Charts : stacker verticalement sur mobile
- [ ] Réduire font-size des titres sur mobile

### 2.2 Page Audit
**Fichier**: `src/app/dashboard/audit/page.tsx`

**Problèmes critiques**:
```tsx
// Ligne 171 - Grid stats
<div className="grid gap-4 md:grid-cols-3">
// ❌ Pas de cols-1 pour mobile

// Ligne 221 - Grid filtres
<div className="grid gap-4 md:grid-cols-3">
// ❌ Filtres trop serrés sur mobile

// Ligne 293 - Table
<table className="w-full text-sm text-left">
// ❌ Table non responsive, scroll horizontal uniquement
```

**Actions**:
- [ ] Stats : `grid-cols-1 md:grid-cols-3`
- [ ] Filtres : `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- [ ] **Table** : Créer une vue "cards" pour mobile
- [ ] Pagination : réduire taille boutons sur mobile
- [ ] Dialog détails : `max-w-[95vw] sm:max-w-3xl`

### 2.3 Page Timesheet
**Fichier**: `src/app/dashboard/timesheet/page.tsx`

**À vérifier**:
- [ ] Calendrier/sélecteur de dates
- [ ] Formulaire de saisie
- [ ] Liste des entrées

### 2.4 Page Projects
**Fichier**: `src/app/dashboard/projects/page.tsx`

**À vérifier**:
- [ ] Grid de cards projets
- [ ] Formulaire création projet
- [ ] Vue détails projet

### 2.5 Page Tasks
**Fichier**: `src/app/dashboard/tasks/page.tsx`

**À vérifier**:
- [ ] Liste des tâches
- [ ] Filtres et recherche
- [ ] Formulaires tâches

### 2.6 Page Chat
**Fichier**: `src/app/dashboard/chat/page.tsx`

**À vérifier**:
- [ ] Layout conversations + messages
- [ ] Attachments viewer
- [ ] Input message sur mobile

---

## 3. Composants Features (PRIORITÉ 2)

### 3.1 Charts
- [ ] `timesheet-radar-chart.tsx` - Réduire taille sur mobile
- [ ] `project-distribution-chart.tsx` - Adapter légende
- [ ] `hr-timesheet-stats-chart.tsx` - Stacker verticalement
- [ ] `validation-stats-chart.tsx` - Adapter tooltips

### 3.2 Forms
- [ ] `timesheet-form.tsx` - Inputs pleine largeur mobile
- [ ] `project-create-dialog.tsx` - Dialog responsive
- [ ] `project-team-dialog.tsx` - Liste membres adaptée

### 3.3 Cards & Lists
- [ ] `project-card.tsx` - Adapter layout
- [ ] `timesheet-entry-card.tsx` - Compacter info
- [ ] `task-comments.tsx` - Input commentaire mobile
- [ ] `task-activity-timeline.tsx` - Timeline verticale compacte

### 3.4 Dialogs & Modals
- [ ] Tous les dialogs : `max-w-[95vw] sm:max-w-lg md:max-w-2xl`
- [ ] Gérer keyboard mobile (fermeture clavier)

---

## 4. Composants UI (PRIORITÉ 3)

### 4.1 Tables
**Stratégie générale pour toutes les tables**:

```tsx
// Desktop : table classique
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>

// Mobile : cards layout
<div className="md:hidden space-y-4">
  {items.map(item => (
    <Card>...</Card>
  ))}
</div>
```

### 4.2 Modals & Sheets
- [ ] Utiliser `Sheet` (drawer) au lieu de `Dialog` sur mobile
- [ ] Adapter padding et font-size

---

## 5. Patterns à appliquer partout

### 5.1 Grids
```tsx
// ❌ Avant
<div className="grid gap-4 md:grid-cols-3">

// ✅ Après
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
```

### 5.2 Text & Headings
```tsx
// ❌ Avant
<h1 className="text-3xl font-bold">

// ✅ Après
<h1 className="text-2xl sm:text-3xl font-bold">
```

### 5.3 Padding & Spacing
```tsx
// ❌ Avant
<div className="p-6">

// ✅ Après
<div className="p-4 sm:p-6">
```

### 5.4 Flex Directions
```tsx
// ❌ Avant
<div className="flex items-center gap-4">

// ✅ Après (si besoin de stacker sur mobile)
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
```

### 5.5 Hidden/Show Elements
```tsx
// Masquer sur mobile, afficher sur desktop
<div className="hidden md:block">Desktop only</div>

// Afficher sur mobile uniquement
<div className="md:hidden">Mobile only</div>
```

---

## 6. Pages spécifiques à traiter

### Pages avec tables (haute priorité)
1. **Audit** (`src/app/dashboard/audit/page.tsx`)
2. **Validation** (`src/app/dashboard/validation/page.tsx`)
3. **Validations Manager** (`src/app/dashboard/validations/page.tsx`)
4. **Reports** (`src/app/dashboard/reports/page.tsx`)
5. **Settings Users** (`src/app/dashboard/settings/users/page.tsx`)

### Pages avec formulaires complexes
1. **HR Timesheet New** (`src/app/dashboard/hr-timesheet/new/page.tsx`)
2. **HR Timesheet Edit** (`src/app/dashboard/hr-timesheet/[id]/edit/page.tsx`)
3. **Settings Profile** (`src/app/dashboard/settings/profile/page.tsx`)

### Pages avec layout spécial
1. **Chat** (`src/app/dashboard/chat/page.tsx`) - Split view
2. **Tasks** (`src/app/dashboard/tasks/page.tsx`) - Kanban potentiel

---

## 7. Tests à effectuer

### Breakpoints à tester
- [ ] **Mobile**: 375px (iPhone SE), 390px (iPhone 12/13), 414px (iPhone 14 Pro Max)
- [ ] **Tablet**: 768px (iPad), 834px (iPad Air), 1024px (iPad Pro)
- [ ] **Desktop**: 1280px, 1440px, 1920px

### Scénarios critiques
- [ ] Navigation (sidebar collapse/expand)
- [ ] Tableaux avec beaucoup de colonnes
- [ ] Formulaires multi-étapes
- [ ] Dialogs avec contenu long
- [ ] Charts et graphiques
- [ ] Upload de fichiers
- [ ] Recherche et filtres

### Devices physiques (si possible)
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome, Firefox, Safari)

---

## 8. Checklist de validation

Pour chaque page/composant :

- [ ] Testé sur mobile (< 640px)
- [ ] Testé sur tablet (768px - 1024px)
- [ ] Testé sur desktop (> 1024px)
- [ ] Pas de scroll horizontal
- [ ] Tous les éléments sont cliquables (touch target min 44px)
- [ ] Le texte est lisible (min 14px sur mobile)
- [ ] Les images/icons sont bien dimensionnés
- [ ] Les formulaires sont utilisables
- [ ] Les animations ne causent pas de lag
- [ ] Dark mode fonctionne correctement

---

## 9. Ordre d'implémentation recommandé

### Phase 1 - Fondations (Jour 1)
1. ✅ Audit complet terminé
2. Layout principal (header optimisé)
3. Page Dashboard
4. Page Audit (table → cards mobile)

### Phase 2 - Pages critiques (Jour 2)
5. Page Timesheet
6. Page Projects
7. Page Tasks
8. Page Validation

### Phase 3 - Features (Jour 3)
9. Composants Charts
10. Composants Forms
11. Composants Cards/Lists

### Phase 4 - Polish (Jour 4)
12. Page Chat
13. Pages Settings
14. Tests complets
15. Ajustements finaux

---

## 10. Notes techniques

### Classes Tailwind utiles
```tsx
// Container responsive
container mx-auto px-4 sm:px-6 lg:px-8

// Spacing responsive
space-y-4 sm:space-y-6 lg:space-y-8

// Grid responsive auto
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

// Flex direction
flex flex-col sm:flex-row

// Width contraints
w-full sm:w-auto
max-w-full sm:max-w-md

// Text responsive
text-sm sm:text-base lg:text-lg

// Padding responsive
p-4 sm:p-6 lg:p-8
```

### Composants shadcn/ui à vérifier
- `Dialog` → Peut utiliser `Sheet` sur mobile
- `Table` → Nécessite vue alternative mobile
- `Popover` → Position adaptée mobile
- `Select` → Dropdown native mobile

---

## Ressources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Mobile Touch Target Size](https://web.dev/tap-targets/)

---

**Dernière mise à jour**: 2025-10-13
