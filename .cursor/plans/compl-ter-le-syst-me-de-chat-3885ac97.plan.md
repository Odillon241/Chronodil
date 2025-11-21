<!-- 3885ac97-3cd8-4e8f-a876-e25c0e84e435 5bfe1f89-0c1e-455a-975f-8345712fe832 -->
# Plan : Compléter le système de chat Chronodil

## Objectif

Ajouter les fonctionnalités manquantes pour rendre le chat complet, sans intégration IA/chatbot.

## Fonctionnalités à implémenter

### 1. Indicateurs de présence (Priorité HAUTE)

#### 1.1 Base de données

- Ajouter champ `lastSeenAt: DateTime?` au modèle `User` dans Prisma
- Créer migration pour ajouter la colonne
- Ajouter index sur `lastSeenAt` pour les requêtes de présence

#### 1.2 Système de tracking de présence

- Créer hook `use-presence-tracker.tsx` qui :
  - Met à jour `lastSeenAt` toutes les 30 secondes quand l'utilisateur est actif
  - Détecte l'inactivité (pas de mouvement souris/clavier pendant 5 minutes = hors ligne)
  - Utilise `visibilitychange` API pour détecter les changements d'onglet
  - Nettoie les timers au démontage

#### 1.3 Route API pour mise à jour présence

- Créer `/api/presence/update` (POST) pour mettre à jour `lastSeenAt`
- Sécuriser avec authentification Better Auth
- Rate limiting (max 1 requête toutes les 30 secondes)

#### 1.4 Hook de présence en temps réel

- Créer `use-realtime-presence.tsx` qui :
  - Écoute les changements de `lastSeenAt` via Supabase Realtime
  - Calcule le statut (en ligne = lastSeenAt < 2 minutes, hors ligne sinon)
  - Expose `onlineUsers: string[]` et `isUserOnline(userId: string): boolean`

#### 1.5 Affichage dans l'UI

- Modifier `ChatConversationList` pour afficher badge vert/gris sur les avatars
- Modifier `ChatMessageList` pour afficher statut dans l'en-tête de conversation
- Ajouter tooltip "En ligne" / "Hors ligne depuis X minutes"
- Utiliser composant `Badge` de shadcn/ui pour les indicateurs

### 2. Fonctionnalités avancées (Priorité MOYENNE)

#### 2.1 Messages épinglés

- Ajouter champ `pinnedAt: DateTime?` au modèle `Message` dans Prisma
- Créer migration
- Ajouter action `pinMessage` et `unpinMessage` dans `chat.actions.ts`
- Afficher section "Messages épinglés" en haut de `ChatMessageList`
- Limiter à 3 messages épinglés max par conversation
- Permission : seulement admins/créateurs de conversation

#### 2.2 Brouillons de messages

- Utiliser `localStorage` pour stocker les brouillons (pas de DB nécessaire)
- Clé : `chat-draft-${conversationId}`
- Sauvegarder automatiquement toutes les 2 secondes pendant la frappe
- Restaurer le brouillon au retour sur la conversation
- Afficher indicateur "Brouillon enregistré" sous l'input

#### 2.3 Preview de liens (OpenGraph)

- Créer composant `LinkPreview` qui :
  - Détecte les URLs dans le contenu des messages
  - Fait requête à `/api/link-preview?url=...` (server-side pour éviter CORS)
  - Affiche carte avec titre, description, image
- Route API `/api/link-preview` qui :
  - Parse l'URL
  - Récupère les meta tags OpenGraph
  - Retourne JSON avec title, description, image, url
  - Cache les résultats (5 minutes)
- Intégrer dans `ChatMessageList` pour afficher les previews sous les messages

### 3. Améliorations UX (Priorité BASSE - Optionnel)

#### 3.1 Compression d'images avant upload

- Utiliser bibliothèque `browser-image-compression` (à installer)
- Compresser les images > 1MB avant upload
- Afficher indicateur de progression
- Conserver qualité raisonnable (80%)

#### 3.2 Messages programmés

- Ajouter champ `scheduledFor: DateTime?` au modèle `Message`
- Créer action `scheduleMessage` dans `chat.actions.ts`
- Créer job Inngest pour envoyer les messages programmés
- UI : bouton "Programmer" dans l'input de message avec date picker

## Fichiers à modifier/créer

### Base de données

- `prisma/schema.prisma` - Ajouter `lastSeenAt` et `pinnedAt`
- `prisma/migrations/XXXX_add_presence_and_pinned.sql` - Migration

### Hooks

- `src/hooks/use-presence-tracker.tsx` - Nouveau
- `src/hooks/use-realtime-presence.tsx` - Nouveau

### Routes API

- `src/app/api/presence/update/route.ts` - Nouveau
- `src/app/api/link-preview/route.ts` - Nouveau

### Actions

- `src/actions/chat.actions.ts` - Ajouter `pinMessage`, `unpinMessage`, `scheduleMessage`

### Composants

- `src/components/features/chat-conversation-list.tsx` - Ajouter badges de présence
- `src/components/features/chat-message-list.tsx` - Ajouter :
  - Section messages épinglés
  - Gestion des brouillons
  - Preview de liens
  - Indicateurs de présence
- `src/components/features/link-preview.tsx` - Nouveau composant

### Utilitaires

- `src/lib/utils/presence.ts` - Fonctions utilitaires (calcul statut, formatage)

## Dépendances à ajouter

```json
{
  "browser-image-compression": "^2.0.2"
}
```

## Tests à effectuer

1. Présence : Vérifier que `lastSeenAt` se met à jour automatiquement
2. Présence : Vérifier que le statut change en temps réel
3. Messages épinglés : Tester épinglage/désépinglage
4. Brouillons : Vérifier sauvegarde/restauration
5. Preview liens : Tester avec différents sites (Twitter, YouTube, etc.)

## Ordre d'implémentation recommandé

1. **Phase 1** : Indicateurs de présence (base de données + tracking + UI)
2. **Phase 2** : Messages épinglés
3. **Phase 3** : Brouillons de messages
4. **Phase 4** : Preview de liens
5. **Phase 5** (optionnel) : Compression d'images + Messages programmés

### To-dos

- [ ] Ajouter champ lastSeenAt au modèle User dans Prisma et créer migration
- [ ] Créer hook use-presence-tracker.tsx pour mettre à jour lastSeenAt automatiquement
- [ ] Créer route API /api/presence/update pour mettre à jour la présence
- [ ] Créer hook use-realtime-presence.tsx pour écouter les changements de présence en temps réel
- [ ] Ajouter badges de présence (en ligne/hors ligne) dans ChatConversationList et ChatMessageList
- [ ] Ajouter champ pinnedAt au modèle Message dans Prisma et créer migration
- [ ] Créer actions pinMessage et unpinMessage dans chat.actions.ts
- [ ] Afficher section 'Messages épinglés' en haut de ChatMessageList avec limite de 3
- [ ] Implémenter sauvegarde/restauration de brouillons dans localStorage pour chaque conversation
- [ ] Créer route API /api/link-preview pour récupérer les meta tags OpenGraph
- [ ] Créer composant LinkPreview et l'intégrer dans ChatMessageList pour afficher les previews