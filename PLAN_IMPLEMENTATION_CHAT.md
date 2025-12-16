# 📋 Plan d'Implémentation - Fonctionnalités Chat Manquantes

**Projet**: Chronodil App - Module Chat
**Date**: 2025-12-04
**Priorité**: HAUTE (amélioration expérience utilisateur)

---

## 🎯 Objectif

Implémenter les 6 fonctionnalités manquantes du module chat selon les meilleures pratiques Next.js 16 et les patterns existants du projet.

---

## 📊 Architecture & Patterns Identifiés

### ✅ Patterns existants à respecter

**Client Components** (`"use client"` directive):
- Fichiers: `src/components/features/chat-*.tsx`
- Hooks: `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`
- Custom hooks: `useRealtimePresence`, `useRealtimeTyping`

**UI Library** (shadcn/ui):
- Components: `Button`, `Input`, `Avatar`, `Badge`, `ScrollArea`, `Dialog`, `DropdownMenu`, `Popover`, `Tooltip`
- Utils: `cn()` pour conditional classNames
- Icons: Lucide React

**Server Actions**:
- Fichier: `src/actions/chat.actions.ts`
- Client: `authActionClient` avec Zod validation
- Pattern: `revalidatePath("/dashboard/chat")` après mutations

**Real-time** (Supabase):
- Hook: `useRealtimeChat` (déjà implémenté)
- Events: `INSERT`, `UPDATE`, `DELETE` sur tables Conversation/Message

**Data Fetching**:
- Pattern: `Promise.all()` pour requêtes parallèles
- Prisma includes pour relations imbriquées

---

## 🔴 Priorité 1 - Fonctionnalités Backend Complètes

### 1. **ChatChannelList** ⚡ (Backend: 100% ✅)

**Fichier à créer**: `src/components/features/chat-channel-list.tsx`

**Backend disponible**:
- ✅ `createChannel()` - Créer un canal public/privé
- ✅ `updateChannel()` - Modifier nom/description/topic/catégorie
- ✅ `joinChannel()` - Rejoindre un canal public
- ✅ `updateChannelPermission()` - Gérer les permissions granulaires

**Interface UI à implémenter**:
```tsx
interface ChatChannelListProps {
  channels: Channel[];
  currentUserId: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
}
```

**Fonctionnalités UI**:
1. Liste des canaux (publics/privés)
2. Badge "🔒" pour canaux privés
3. Catégories repliables (Général, Projets, Équipes, etc.)
4. Bouton "+" pour créer un nouveau canal
5. Badge compteur de messages non lus
6. Menu contextuel (Paramètres, Quitter, Notifications)
7. Recherche de canaux
8. Indication membres en ligne (petit compteur)

**State management**:
- `useState` pour search query, selected channel
- Real-time sync via `useRealtimeChat` (déjà branché)

**Estimation**: **4-6 heures**

---

### 2. **ChatGlobalSearch** 🔍 (Backend: 100% ✅)

**Fichier à créer**: `src/components/features/chat-global-search.tsx`

**Backend disponible**:
- ✅ `searchMessages()` - Recherche dans messages (1174-1266)
- ✅ `globalSearch()` - Recherche globale messages/fichiers/conversations (2081-2304)
- ✅ Filtres: type, date range, conversationId, userId

**Interface UI à implémenter**:
```tsx
interface ChatGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectResult: (result: SearchResult) => void;
}
```

**Fonctionnalités UI**:
1. Dialog modal (Cmd+K pour ouvrir)
2. Input avec debounce (300ms)
3. Tabs: "Tout" | "Messages" | "Fichiers" | "Conversations"
4. Filtres avancés:
   - Date: Aujourd'hui, Cette semaine, Ce mois, Tout
   - Utilisateur (dropdown)
   - Conversation (dropdown si dans une conversation)
5. Résultats avec highlight du terme recherché
6. Navigation clavier (Arrow Up/Down, Enter)
7. Affichage du contexte (extrait avec ...terme...)
8. Click → scroll vers message dans conversation

**Composant de résultat**:
```tsx
<SearchResultItem
  type="message" | "file" | "conversation"
  content={highlight(result.content, query)}
  conversationName={result.conversationName}
  senderName={result.senderName}
  createdAt={result.createdAt}
  onClick={() => handleSelect(result)}
/>
```

**Estimation**: **6-8 heures**

---

### 3. **ChatThreadView** 🧵 (Backend: 100% ✅)

**Fichier à créer**: `src/components/features/chat-thread-view.tsx`

**Backend disponible**:
- ✅ `sendMessageWithThread()` - Répondre dans un thread (1802-1891)
- ✅ `getThreadMessages()` - Récupérer messages d'un thread (1893-1966)
- ✅ Support dans table Message: `threadId`, `isThreadRoot`, `threadCount`

**Interface UI à implémenter**:
```tsx
interface ChatThreadViewProps {
  threadId: string;
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}
```

**Fonctionnalités UI**:
1. Panel latéral (350px width) comme dans ChatConversationList
2. Header:
   - Message racine (extrait)
   - Badge compteur réponses
   - Bouton fermer (X)
3. Liste messages du thread (scroll indépendant)
4. Input pour répondre dans le thread
5. Indication visuelle "Thread de X réponses"
6. Affichage avatars participants du thread
7. Real-time sync (nouveaux messages dans thread)

**Layout** (page.tsx:333):
```tsx
// Grid adaptatif avec thread
<div className={`grid w-full h-full ${selectedThreadId ? 'grid-cols-[350px,1fr,350px]' : 'grid-cols-[350px,1fr]'}`}>
  {/* Sidebar */}
  <ChatConversationList ... />

  {/* Main */}
  <ChatMessageList onThreadClick={setSelectedThreadId} ... />

  {/* Thread (conditionnel) */}
  {selectedThreadId && <ChatThreadView threadId={selectedThreadId} ... />}
</div>
```

**Estimation**: **5-7 heures**

---

## 🟡 Priorité 2 - Fonctionnalités Backend Prêtes

### 4. **Messages épinglés UI** 📌

**Backend disponible** (chat.actions.ts:929-1110):
- ✅ `pinMessage()` - Épingler un message (max 3)
- ✅ `unpinMessage()` - Désépingler
- ✅ `getPinnedMessages()` - Récupérer épinglés d'une conversation

**UI à intégrer dans ChatMessageList**:
1. Bouton "Épingler" dans menu message (MoreVertical)
2. Section header "📌 Messages épinglés" (collapsible)
3. Limite 3 messages → toast si dépassé
4. Badge "Épinglé par X" sur message
5. Click sur épinglé → scroll vers message original

**Composants à modifier**:
- `src/components/features/chat-message-list.tsx` (ajouter section pinnedMessages)

**Estimation**: **3-4 heures**

---

### 5. **Accusés de lecture UI** 👁️

**Backend disponible** (chat.actions.ts:1270-1388):
- ✅ `markMessageAsRead()` - Marquer message comme lu
- ✅ `getMessageReadReceipts()` - Récupérer accusés de lecture

**UI à intégrer**:
1. Icônes sous chaque message:
   - `<Check />` (envoyé)
   - `<CheckCheck />` (lu par au moins 1)
   - `<CheckCheck className="text-blue-500" />` (lu par tous)
2. Tooltip au hover: "Lu par Alice, Bob (+2 autres)"
3. Click → Dialog avec liste complète + timestamps
4. Auto-mark as read quand message visible (IntersectionObserver)

**Composants à modifier**:
- `src/components/features/chat-message-list.tsx`

**Estimation**: **4-5 heures**

---

### 6. **Archivage conversations UI** 📦

**Backend disponible** (chat.actions.ts:1393-1533):
- ✅ `archiveConversation()` - Archiver pour l'utilisateur
- ✅ `unarchiveConversation()` - Désarchiver
- ✅ `getArchivedConversations()` - Récupérer archivées

**UI à intégrer**:
1. Menu conversation: "Archiver" (dans DropdownMenu existant)
2. Onglet "Archivées" dans ChatConversationList
3. Badge "Archivé le X" dans liste archivées
4. Bouton "Désarchiver" dans conversation archivée
5. Conversations archivées n'apparaissent plus dans liste principale

**Composants à modifier**:
- `src/components/features/chat-conversation-list.tsx`
- `src/app/dashboard/chat/page.tsx` (tabs "Actives" | "Archivées")

**Estimation**: **3-4 heures**

---

## 🟢 Priorité 3 - Nice-to-Have

### 7. **useChatKeyboardShortcuts** ⌨️

**Hook à créer**: `src/hooks/use-chat-keyboard-shortcuts.tsx`

**Raccourcis**:
- `Cmd/Ctrl + K` → Ouvrir recherche globale
- `Cmd/Ctrl + N` → Nouvelle conversation
- `Cmd/Ctrl + F` → Rechercher dans conversation actuelle
- `Cmd/Ctrl + Shift + M` → Ouvrir favoris
- `Esc` → Fermer dialogs/panels
- `Arrow Up/Down` → Navigation conversations
- `Enter` → Ouvrir conversation sélectionnée
- `/` → Focus input message

**Implémentation**:
```tsx
export function useChatKeyboardShortcuts({
  onSearch,
  onNewMessage,
  onFavorites,
}: ChatKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch();
      }
      // ... autres raccourcis
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onNewMessage, onFavorites]);
}
```

**Estimation**: **2-3 heures**

---

### 8. **Messages programmés UI** ⏰

**Backend disponible** (chat.actions.ts:1972-2015):
- ✅ `scheduleMessage()` - Programmer un message

**UI à créer**:
1. Bouton "Programmer" dans input message
2. Dialog avec DateTimePicker
3. Option récurrence (checkbox + RRule)
4. Liste messages programmés (dans paramètres conversation)
5. Badge "📅 Programmé pour le X"
6. Bouton "Annuler" pour messages programmés

**Note**: Nécessite un job scheduler (Inngest déjà présent dans le projet)

**Estimation**: **6-8 heures**

---

### 9. **Rappels messages UI** ⏱️

**Backend disponible** (chat.actions.ts:2017-2075):
- ✅ `createReminder()` - Créer un rappel

**UI à créer**:
1. Menu message: "Me rappeler..." → submenu (1h, 3h, demain, personnalisé)
2. Dialog DateTimePicker si personnalisé
3. Notification au moment du rappel
4. Liste rappels actifs (dans sidebar ou settings)

**Note**: Nécessite également job scheduler

**Estimation**: **4-5 heures**

---

## 🚀 Ordre d'Implémentation Recommandé

### Phase 1 - Quick Wins (1-2 jours)
1. **ChatChannelList** (4-6h) - Débloque le bouton existant
2. **useChatKeyboardShortcuts** (2-3h) - Améliore productivité

### Phase 2 - Core Features (2-3 jours)
3. **ChatGlobalSearch** (6-8h) - Fonctionnalité très demandée
4. **ChatThreadView** (5-7h) - Améliore organisation discussions

### Phase 3 - Polish (1-2 jours)
5. **Messages épinglés UI** (3-4h)
6. **Accusés de lecture UI** (4-5h)
7. **Archivage conversations UI** (3-4h)

### Phase 4 - Advanced (optionnel, 2-3 jours)
8. **Messages programmés UI** (6-8h)
9. **Rappels messages UI** (4-5h)

**Total estimé**: 37-51 heures (1-2 semaines à temps plein)

---

## 📚 Checklist Next.js Best Practices

Pour chaque composant:

- [ ] `"use client"` directive en haut du fichier
- [ ] Props TypeScript bien typées avec interface
- [ ] Server Actions importées depuis `@/actions/chat.actions`
- [ ] Real-time sync via hooks existants (`useRealtimeChat`, etc.)
- [ ] Responsive design (mobile-first avec Tailwind)
- [ ] Accessibilité (ARIA labels, keyboard navigation)
- [ ] Loading states (Skeleton, Spinner)
- [ ] Error handling (toast.error avec sonner)
- [ ] Optimistic updates quand possible
- [ ] `revalidatePath()` après mutations server

---

## 🔧 Outils & Libraries Utilisés

| Outil | Usage |
|-------|-------|
| **Next.js 16** | App Router, Server Actions, PPR |
| **React 19.2** | Client Components, hooks |
| **TypeScript 5.9** | Type safety |
| **Prisma 6.17** | ORM, database queries |
| **Supabase** | Real-time, auth |
| **Shadcn/UI** | Component library |
| **Tailwind CSS** | Styling |
| **Lucide React** | Icons |
| **date-fns** | Date formatting |
| **Sonner** | Toast notifications |
| **Zod** | Schema validation |

---

## 🎨 Design System

**Couleurs** (Tailwind):
- Primary: `bg-primary` (bleu)
- Success: `bg-green-500`
- Warning: `bg-orange-500`
- Destructive: `bg-red-500` / `text-destructive`
- Muted: `bg-muted`, `text-muted-foreground`
- Accent: `bg-accent`

**Spacing**:
- Padding conteneurs: `p-3 sm:p-4`
- Gaps: `gap-2 sm:gap-3`
- Responsive breakpoints: `sm:`, `md:`, `lg:`

**Typography**:
- Titres: `text-base sm:text-lg font-semibold`
- Corps: `text-xs sm:text-sm`
- Muted: `text-muted-foreground`

---

## ✅ Next Steps

1. **Validation du plan** - Review avec l'équipe
2. **Setup environnement** - Vérifier dépendances
3. **Commencer Phase 1** - ChatChannelList + useChatKeyboardShortcuts
4. **Tests incrémentaux** - Tester chaque composant isolément
5. **Intégration** - Brancher dans page.tsx
6. **QA** - Tests E2E avec browser_eval (Playwright)
7. **Documentation** - Mettre à jour README

---

**Prêt à démarrer l'implémentation ! 🚀**
