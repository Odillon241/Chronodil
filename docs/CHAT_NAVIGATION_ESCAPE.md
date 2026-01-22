# Navigation avec Échap dans le Chat

**Date**: 2026-01-22  
**Fonctionnalité**: Retour à la liste des conversations avec la touche Échap

## 🎯 Comportement

La touche **Échap** permet de naviguer en arrière dans l'interface de chat selon
une hiérarchie de priorités.

### Hiérarchie de Navigation (du plus spécifique au plus général)

#### Priorité 1: Fermer les Dialogs

Si un dialog est ouvert, Échap le ferme:

- Dialog "Nouvelle conversation"
- Dialog "Créer un canal"

#### Priorité 2: Fermer le Thread

Si un thread de discussion est ouvert (panneau de droite), Échap le ferme.

#### Priorité 3: Revenir à la Liste des Conversations

Si une conversation est sélectionnée, Échap désélectionne la conversation et:

- Affiche la liste des conversations
- Supprime le paramètre `?conversation=xxx` de l'URL
- Revient à l'état vide du chat

### Exemple de Navigation

```
État initial: /dashboard/chat
↓ [Sélectionner conversation]
État 1: /dashboard/chat?conversation=conv-123
↓ [Ouvrir un thread]
État 2: /dashboard/chat?conversation=conv-123 (+ thread ouvert)
↓ [Appuyer sur Échap]
État 1: /dashboard/chat?conversation=conv-123 (thread fermé)
↓ [Appuyer sur Échap]
État initial: /dashboard/chat (conversation désélectionnée)
```

## 📱 Navigation Mobile

Sur mobile, en plus de la touche Échap, un **bouton de retour visuel** (←) est
affiché dans le header de la conversation.

### Affichage du Bouton

- **Desktop**: Caché (navigation au clavier privilégiée)
- **Mobile/Tablet**: Visible en haut à gauche du header
- **Classe CSS**: `md:hidden` (visible uniquement sur écrans < 768px)

## 🔧 Implémentation Technique

### Hook de Raccourcis Clavier

**Fichier**: `src/hooks/use-chat-keyboard-shortcuts.ts`

```typescript
useChatKeyboardShortcuts({
  onEscape: () => {
    // Priorité 1: Dialogs
    if (newChatDialogOpen) {
      setNewChatDialogOpen(false)
      return
    }

    // Priorité 2: Thread
    if (selectedThreadId) {
      setSelectedThreadId(null)
      return
    }

    // Priorité 3: Conversation
    if (selectedConversation) {
      setSelectedConversation(null)
      window.history.pushState({}, '', '/dashboard/chat')
    }
  },
})
```

### Callback de Retour

**Fichier**: `src/app/dashboard/chat/page.tsx`

```typescript
<ChatMessageList
  {...props}
  onBack={() => {
    setSelectedConversation(null)
    window.history.pushState({}, '', '/dashboard/chat')
  }}
/>
```

### Bouton Visuel Mobile

**Fichier**: `src/features/chat/components/chat-header.tsx`

```typescript
{onBack && (
  <Button
    variant="ghost"
    size="icon"
    onClick={(e) => {
      e.stopPropagation()
      onBack()
    }}
    className="md:hidden h-8 w-8"
  >
    <ArrowLeft className="h-4 w-4" />
  </Button>
)}
```

## 🎨 Expérience Utilisateur

### Avantages

1. **Navigation Intuitive**: Échap = retour en arrière (pattern standard)
2. **Navigation Rapide**: Pas besoin de la souris
3. **Mobile-Friendly**: Bouton visuel sur petits écrans
4. **Prédictible**: Toujours le même comportement
5. **Accessible**: Fonctionne au clavier et à la souris

### Feedbacks Visuels

- ✅ URL mise à jour automatiquement
- ✅ Transition fluide entre les états
- ✅ Aucun rechargement de page (navigation client-side)
- ✅ État conservé (liste des conversations reste chargée)

## 📊 Cas d'Usage

### Cas 1: Fermer un Dialog

```
État: Dialog "Nouvelle conversation" ouvert
Action: Appuyer sur Échap
Résultat: Dialog fermé, conversation toujours affichée
```

### Cas 2: Fermer un Thread

```
État: Conversation + Thread ouvert
Action: Appuyer sur Échap
Résultat: Thread fermé, conversation toujours affichée
```

### Cas 3: Revenir à la Liste

```
État: Conversation affichée (pas de thread, pas de dialog)
Action: Appuyer sur Échap
Résultat: Retour à la liste des conversations
```

### Cas 4: Navigation Mobile

```
État: Conversation affichée sur mobile
Action: Cliquer sur le bouton ←
Résultat: Retour à la liste des conversations
```

## 🧪 Tests

### Test 1: Hiérarchie des Priorités

1. Ouvrir une conversation
2. Ouvrir un thread
3. Ouvrir le dialog "Nouvelle conversation"
4. Appuyer sur Échap 3 fois
5. Vérifier l'ordre: Dialog → Thread → Conversation

### Test 2: Mobile

1. Afficher le chat sur un écran < 768px
2. Sélectionner une conversation
3. Vérifier que le bouton ← est visible
4. Cliquer sur le bouton
5. Vérifier le retour à la liste

### Test 3: URL

1. Ouvrir une conversation
2. Vérifier que l'URL contient `?conversation=xxx`
3. Appuyer sur Échap
4. Vérifier que l'URL est `/dashboard/chat` (sans paramètre)

### Test 4: Navigation Navigateur

1. Ouvrir une conversation
2. Utiliser le bouton "Précédent" du navigateur
3. Vérifier que le comportement est cohérent

## 🔄 Améliorations Futures

### Gestion de l'Historique du Navigateur

Actuellement, on utilise `window.history.pushState()` pour mettre à jour l'URL
sans recharger la page. On pourrait améliorer avec:

```typescript
// Option 1: Ajouter à l'historique (bouton Précédent fonctionne)
window.history.pushState({}, '', '/dashboard/chat')

// Option 2: Remplacer dans l'historique (pas d'entrée supplémentaire)
window.history.replaceState({}, '', '/dashboard/chat')
```

### Gesture Mobile

Ajouter un swipe de droite à gauche pour revenir à la liste:

```typescript
// Utiliser react-swipeable ou similaire
<Swipeable onSwipedRight={onBack}>
  <ChatMessageList {...props} />
</Swipeable>
```

### Raccourci Clavier Alternatif

Ajouter `Alt + ←` comme alternative à Échap:

```typescript
// Dans use-chat-keyboard-shortcuts.ts
if (e.altKey && e.key === 'ArrowLeft') {
  onBack?.()
}
```

## ✅ Checklist de Validation

- [x] Échap ferme les dialogs en priorité
- [x] Échap ferme le thread si ouvert
- [x] Échap revient à la liste des conversations
- [x] Bouton ← visible sur mobile
- [x] URL mise à jour correctement
- [x] Pas de rechargement de page
- [x] État conservé après navigation
- [ ] Tests avec navigation navigateur (Précédent/Suivant)
- [ ] Tests avec lecteur d'écran
- [ ] Tests sur différents navigateurs

## 📝 Notes

- Le bouton de retour utilise l'icône `ArrowLeft` de Lucide
- La classe `md:hidden` de Tailwind gère la visibilité responsive
- Le `stopPropagation()` empêche le clic de déclencher `onShowInfo`
- Le `window.history.pushState()` permet la navigation sans recharger

**Résultat**: Navigation intuitive et rapide dans le chat! 🚀
