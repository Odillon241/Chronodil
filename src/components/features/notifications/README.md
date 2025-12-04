# Composants Notifications

Architecture modulaire pour la gestion des notifications utilisateur.

## Structure des composants

```
src/app/dashboard/notifications/
├── page.tsx              → Server Component (page principale)
├── loading.tsx           → Loading UI (skeleton)
└── layout.tsx            → Layout wrapper

src/components/features/notifications/
├── notification-item.tsx    → Item individuel (Client Component)
├── notification-list.tsx    → Liste interactive (Client Component)
├── notification-filters.tsx → Recherche + filtres (Client Component)
├── index.ts                 → Barrel export
└── README.md                → Documentation
```

## Hiérarchie des composants

```
NotificationsPage (Server Component)
│
├── PageHeader
│
├── Tabs
│   ├── TabsList
│   │   ├── TabsTrigger [list]
│   │   └── TabsTrigger [settings]
│   │
│   ├── TabsContent [list]
│   │   └── Suspense
│   │       └── NotificationsContent (Server Component)
│   │           ├── NotificationFilters (Client)
│   │           │   ├── SearchBar
│   │           │   └── Popover (filtres)
│   │           │       ├── Select (statut)
│   │           │       └── Select (type)
│   │           │
│   │           ├── EmptyState (si vide)
│   │           │
│   │           └── NotificationList (Client)
│   │               ├── Checkbox (select all)
│   │               ├── Bulk Actions Bar
│   │               └── NotificationItem[] (Client)
│   │                   ├── Checkbox
│   │                   ├── Icon
│   │                   ├── Badge
│   │                   ├── Title
│   │                   ├── Message
│   │                   ├── Date
│   │                   └── Actions
│   │
│   └── TabsContent [settings]
│       └── QuietHoursSettings (Client)
```

## Utilisation

### Import individuel

```tsx
import { NotificationItem } from '@/components/features/notifications/notification-item';
import { NotificationList } from '@/components/features/notifications/notification-list';
import { NotificationFilters } from '@/components/features/notifications/notification-filters';
```

### Import groupé (barrel)

```tsx
import {
  NotificationItem,
  NotificationList,
  NotificationFilters,
} from '@/components/features/notifications';
```

## Props

### NotificationItem

```typescript
interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date | string;
    link?: string | null;
  };
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}
```

### NotificationList

```typescript
interface NotificationListProps {
  initialNotifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date | string;
    link?: string | null;
  }>;
}
```

### NotificationFilters

```typescript
interface NotificationFiltersProps {
  resultCount: number;
}
```

## Exemples

### NotificationItem isolé

```tsx
<NotificationItem
  notification={{
    id: "1",
    title: "Nouvelle tâche assignée",
    message: "Vous avez été assigné à la tâche 'Développer la feature X'",
    type: "info",
    isRead: false,
    createdAt: new Date(),
    link: "/dashboard/tasks/123",
  }}
  isSelected={false}
  onSelect={(checked) => console.log('Selected:', checked)}
  onMarkAsRead={() => console.log('Mark as read')}
  onDelete={() => console.log('Delete')}
/>
```

### NotificationList avec données

```tsx
<NotificationList
  initialNotifications={[
    {
      id: "1",
      title: "Tâche complétée",
      message: "La tâche 'Setup project' a été marquée comme complétée",
      type: "success",
      isRead: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Alerte deadline",
      message: "La tâche 'Review PR' arrive à échéance dans 2 heures",
      type: "warning",
      isRead: false,
      createdAt: new Date(),
    },
  ]}
/>
```

### NotificationFilters

```tsx
<NotificationFilters resultCount={42} />
```

## Optimisations

### Performance

- **React.memo** : Évite re-renders inutiles sur NotificationItem
- **useCallback** : Mémorise les fonctions de callback
- **useMemo** : Calculs dérivés (unreadCount)
- **useTransition** : Actions asynchrones non-bloquantes

### Bundle

- **Dynamic imports** : Chargement lazy si nécessaire
- **Tree shaking** : Exports nommés optimisables
- **Server Components** : Fetch côté serveur = moins de JS client

## Best Practices

### Server/Client Components

- ✅ Page principale = Server Component
- ✅ Fetch initial côté serveur
- ✅ Client Components seulement pour interactions (selection, filtres)
- ✅ Suspense boundary pour streaming

### TypeScript

- ✅ Props strictement typées
- ✅ Pas de `any`
- ✅ Types partagés via interfaces
- ✅ Generic types pour réutilisabilité

### Accessibilité

- ✅ ARIA labels sur checkboxes
- ✅ Titres descriptifs
- ✅ Focus management
- ✅ Keyboard navigation

### Responsive

- ✅ Mobile-first design
- ✅ Breakpoints Tailwind (sm:, md:, lg:)
- ✅ Actions adaptées selon écran
- ✅ Textes tronqués si nécessaire

## Tests

### Unit tests (recommandé)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from './notification-item';

describe('NotificationItem', () => {
  it('should display notification title and message', () => {
    render(
      <NotificationItem
        notification={{
          id: '1',
          title: 'Test Title',
          message: 'Test Message',
          type: 'info',
          isRead: false,
          createdAt: new Date(),
        }}
        isSelected={false}
        onSelect={() => {}}
        onMarkAsRead={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('should call onMarkAsRead when button clicked', () => {
    const onMarkAsRead = jest.fn();

    render(
      <NotificationItem
        notification={{
          id: '1',
          title: 'Test',
          message: 'Test',
          type: 'info',
          isRead: false,
          createdAt: new Date(),
        }}
        isSelected={false}
        onSelect={() => {}}
        onMarkAsRead={onMarkAsRead}
        onDelete={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /lu/i }));
    expect(onMarkAsRead).toHaveBeenCalledTimes(1);
  });
});
```

## Migration

Si vous migrez depuis l'ancienne implémentation monolithique :

1. **Importer les nouveaux composants** :
   ```tsx
   import { NotificationList, NotificationFilters } from '@/components/features/notifications';
   ```

2. **Convertir la page en Server Component** :
   ```tsx
   export default async function NotificationsPage({ searchParams }) {
     const resolvedSearchParams = await searchParams;
     // ...
   }
   ```

3. **Déplacer la logique client dans les composants** :
   - State management → NotificationList
   - Filtres → NotificationFilters
   - Affichage items → NotificationItem

4. **Ajouter Suspense** :
   ```tsx
   <Suspense fallback={<LoadingSkeleton />}>
     <NotificationsContent />
   </Suspense>
   ```

## Maintenance

### Ajouter un nouveau type de notification

1. Mettre à jour l'enum dans `getNotificationIcon()` (notification-item.tsx)
2. Ajouter le type dans le Select (notification-filters.tsx)
3. Mettre à jour les types Prisma si nécessaire

### Ajouter un nouveau filtre

1. Ajouter le state dans NotificationFilters
2. Ajouter le Select dans le Popover
3. Mettre à jour la logique de filtrage dans page.tsx
4. Synchroniser avec URL params

## Ressources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React memo](https://react.dev/reference/react/memo)
- [useTransition](https://react.dev/reference/react/useTransition)
