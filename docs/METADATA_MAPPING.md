# Metadata Mapping - Dashboard Pages

## Pages principales

### dashboard/page.tsx
```typescript
export const metadata = {
  title: 'Tableau de bord | Chronodil',
  description: 'Vue d\'ensemble de vos activités, projets et statistiques de temps',
};
```

### tasks/page.tsx
```typescript
export const metadata = {
  title: 'Tâches | Chronodil',
  description: 'Gérez vos tâches et suivez l\'avancement de vos projets',
};
```

### projects/page.tsx
```typescript
export const metadata = {
  title: 'Projets | Chronodil',
  description: 'Gérez vos projets, équipes et ressources',
};
```

### validation/page.tsx & validations/page.tsx
```typescript
export const metadata = {
  title: 'Validation | Chronodil',
  description: 'Validez les feuilles de temps de votre équipe',
};
```

### notifications/page.tsx
```typescript
export const metadata = {
  title: 'Notifications | Chronodil',
  description: 'Centre de notifications et alertes',
};
```

### chat/page.tsx
```typescript
export const metadata = {
  title: 'Messagerie | Chronodil',
  description: 'Communiquez avec votre équipe',
};
```

### audit/page.tsx
```typescript
export const metadata = {
  title: 'Audit | Chronodil',
  description: 'Journal d\'audit et historique des actions',
};
```

## Settings

### settings/page.tsx
```typescript
export const metadata = {
  title: 'Paramètres | Chronodil',
  description: 'Configurez votre compte et vos préférences',
};
```

### settings/profile/page.tsx
```typescript
export const metadata = {
  title: 'Profil | Chronodil',
  description: 'Gérez vos informations personnelles',
};
```

### settings/users/page.tsx
```typescript
export const metadata = {
  title: 'Utilisateurs | Chronodil',
  description: 'Gérez les utilisateurs et les permissions',
};
```

### settings/reminders/page.tsx
```typescript
export const metadata = {
  title: 'Rappels | Chronodil',
  description: 'Configurez vos rappels et notifications',
};
```

## HR Timesheet

### hr-timesheet/page.tsx
```typescript
export const metadata = {
  title: 'RH - Feuilles de temps | Chronodil',
  description: 'Vue RH des feuilles de temps de l\'équipe',
};
```

### hr-timesheet/new/page.tsx
```typescript
export const metadata = {
  title: 'Nouvelle feuille de temps | Chronodil',
  description: 'Créer une nouvelle feuille de temps',
};
```

### hr-timesheet/[id]/page.tsx
```typescript
export const metadata = {
  title: 'Détails feuille de temps | Chronodil',
  description: 'Détails et historique de la feuille de temps',
};
```

### hr-timesheet/[id]/edit/page.tsx
```typescript
export const metadata = {
  title: 'Éditer feuille de temps | Chronodil',
  description: 'Modifier la feuille de temps',
};
```

### hr-timesheet/[id]/validate/page.tsx
```typescript
export const metadata = {
  title: 'Valider feuille de temps | Chronodil',
  description: 'Valider et approuver la feuille de temps',
};
```
