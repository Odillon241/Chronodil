# 💬 Système de Chat Chronodil

## Vue d'ensemble

Le système de chat Chronodil est une solution de messagerie complète intégrée à l'application, permettant la communication en temps réel entre les membres de l'équipe.

## ✨ Fonctionnalités implémentées

### 🎯 Fonctionnalités principales

#### 1. **Types de conversations**
- 💬 **Conversations directes (DIRECT)** : Messages privés entre deux utilisateurs
- 👥 **Groupes personnalisés (GROUP)** : Conversations de groupe créées manuellement
- 📁 **Conversations de projet (PROJECT)** : Conversations liées à des projets spécifiques

#### 2. **Gestion des conversations**
- ✅ Créer des conversations (directes, groupes, projets)
- ✅ Supprimer des conversations (avec permissions)
- ✅ Quitter une conversation (groupes/projets uniquement)
- ✅ Ajouter/retirer des membres
- ✅ Gérer les administrateurs de groupe
- ✅ Désactiver les notifications par conversation

#### 3. **Messagerie**
- ✅ Envoyer des messages texte
- ✅ Modifier ses propres messages
- ✅ Supprimer ses propres messages
- ✅ Messages non lus avec compteur
- ✅ Marquer comme lu automatiquement

#### 4. **Système de réponses (Threading)**
- ✅ Répondre à n'importe quel message
- ✅ Preview du message parent
- ✅ Navigation visuelle des réponses
- ✅ Barre de composition contextuelle

#### 5. **Réactions emoji**
- ✅ 6 emojis populaires : 👍 ❤️ 😂 😮 😢 🙏
- ✅ Toggle réactions (ajouter/retirer)
- ✅ Compteur par emoji
- ✅ Affichage des utilisateurs ayant réagi
- ✅ Interface intuitive au survol

#### 6. **Recherche**
- ✅ Recherche dans le contenu des messages
- ✅ Recherche par nom d'expéditeur
- ✅ Compteur de résultats
- ✅ Filtrage en temps réel
- ✅ Interface dépliable

#### 7. **Mentions @utilisateur**
- ✅ Format : `@[userId:username]`
- ✅ Mise en surbrillance visuelle
- ✅ Parsing intelligent du contenu

#### 8. **Pièces jointes**
- ✅ Upload de fichiers multiples
- ✅ Preview avant envoi
- ✅ Affichage des fichiers dans les messages
- ✅ Icônes différenciées (images/fichiers)
- ✅ Bouton de téléchargement

#### 9. **Indicateurs de frappe**
- ✅ Animation de points rebondissants
- ✅ Affichage du nom de l'utilisateur
- ✅ Support multi-utilisateurs
- ✅ Timeout automatique (3 secondes)

#### 10. **Interface utilisateur**
- ✅ Design moderne avec shadcn/ui
- ✅ Avatars superposés pour les groupes
- ✅ Indicateurs de statut
- ✅ Groupement des messages par date
- ✅ Auto-scroll intelligent
- ✅ Animations fluides
- ✅ Mode sombre compatible

## 🗄️ Structure de la base de données

### Modèles Prisma

#### **Conversation**
```prisma
model Conversation {
  id        String              @id
  type      ConversationType    // DIRECT, GROUP, PROJECT
  name      String?             // Nom du groupe
  projectId String?             // ID du projet associé
  createdBy String?             // Créateur
  createdAt DateTime            @default(now())
  updatedAt DateTime
  
  Project   Project?            @relation(...)
  Creator   User?               @relation(...)
  Members   ConversationMember[]
  Messages  Message[]
}
```

#### **ConversationMember**
```prisma
model ConversationMember {
  id             String   @id
  conversationId String
  userId         String
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?
  isAdmin        Boolean  @default(false)
  isMuted        Boolean  @default(false)
  
  Conversation Conversation @relation(...)
  User         User         @relation(...)
}
```

#### **Message**
```prisma
model Message {
  id             String    @id
  conversationId String
  senderId       String
  content        String
  attachments    Json?              // Fichiers joints
  reactions      Json?              // { "👍": ["userId1"], "❤️": ["userId2"] }
  replyToId      String?            // Réponse à un message
  isEdited       Boolean   @default(false)
  isDeleted      Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime
  
  Conversation Conversation @relation(...)
  Sender       User         @relation(...)
  ReplyTo      Message?     @relation("MessageReplies")
  Replies      Message[]    @relation("MessageReplies")
}
```

## 📁 Structure du code

### Actions serveur (`src/actions/chat.actions.ts`)
- `getUserConversations()` - Récupérer les conversations de l'utilisateur
- `getConversationById()` - Récupérer une conversation spécifique
- `createOrGetConversation()` - Créer ou récupérer une conversation
- `sendMessage()` - Envoyer un message
- `updateMessage()` - Modifier un message
- `deleteMessage()` - Supprimer un message
- `toggleReaction()` - Ajouter/retirer une réaction
- `markAsRead()` - Marquer les messages comme lus
- `addMembers()` - Ajouter des membres
- `removeMember()` - Retirer un membre
- `leaveConversation()` - Quitter une conversation
- `deleteConversation()` - Supprimer une conversation

### Composants React

#### **ChatPage** (`src/app/dashboard/chat/page.tsx`)
- Page principale du chat
- Gestion de l'état global
- Coordination des composants

#### **ChatConversationList** (`src/components/features/chat-conversation-list.tsx`)
- Liste des conversations
- Barre de recherche
- Bouton nouvelle conversation
- Menu contextuel (supprimer/quitter)
- Avatars superposés pour les groupes
- Compteur de messages non lus

#### **ChatMessageList** (`src/components/features/chat-message-list.tsx`)
- Affichage des messages
- Input de message
- Gestion des réponses
- Gestion des réactions
- Upload de fichiers
- Recherche dans les messages
- Indicateurs de frappe

#### **ChatNewConversationDialog** (`src/components/features/chat-new-conversation-dialog.tsx`)
- Dialog de création
- Onglets (Direct/Groupe/Projet)
- Sélection d'utilisateurs
- Configuration du groupe

## 🚀 Utilisation

### Créer une conversation

1. Cliquer sur le bouton "+" dans la liste des conversations
2. Choisir le type (Direct, Groupe, ou Projet)
3. Sélectionner les participants
4. Confirmer la création

### Envoyer un message

1. Sélectionner une conversation
2. Taper le message dans l'input
3. Appuyer sur Entrée ou cliquer sur le bouton d'envoi

### Répondre à un message

1. Survoler un message
2. Cliquer sur le menu "⋮"
3. Sélectionner "Répondre"
4. Taper la réponse
5. Appuyer sur Échap pour annuler

### Ajouter une réaction

1. Survoler un message
2. Cliquer sur l'icône smiley 😊
3. Choisir un emoji dans la grille
4. Recliquer pour retirer la réaction

### Rechercher dans les messages

1. Cliquer sur l'icône de recherche 🔍
2. Taper la requête
3. Les messages sont filtrés en temps réel
4. Le compteur affiche le nombre de résultats

### Joindre des fichiers

1. Cliquer sur l'icône trombone 📎
2. Sélectionner un ou plusieurs fichiers
3. Les fichiers apparaissent en preview
4. Envoyer le message

## 🔐 Permissions

### Conversations directes
- ❌ Impossible de quitter
- ✅ Le créateur peut supprimer
- ✅ Tous les membres peuvent envoyer des messages

### Groupes personnalisés
- ✅ Les membres peuvent quitter
- ✅ Les administrateurs peuvent supprimer
- ✅ Les administrateurs peuvent ajouter/retirer des membres
- ✅ Tous les membres peuvent envoyer des messages

### Conversations de projet
- ✅ Les membres peuvent quitter
- ✅ Les administrateurs peuvent supprimer
- ✅ Liées automatiquement au projet
- ✅ Les membres du projet peuvent envoyer des messages

## 🧪 Tests

### Exécuter les tests

```bash
pnpm tsx scripts/test-chat-system.ts
```

### Tests couverts
- ✅ Création de conversations
- ✅ Envoi de messages
- ✅ Système de réponses
- ✅ Réactions emoji
- ✅ Relations utilisateurs/messages
- ✅ Récupération des conversations

## 🔮 Améliorations futures (optionnelles)

### Fonctionnalités temps réel
- 🔄 Intégration WebSocket avec Pusher ou Socket.io
- 🔄 Notifications push en temps réel
- 🔄 Indicateurs de présence (en ligne/hors ligne)
- 🔄 Indicateurs de frappe synchronisés

### Fonctionnalités avancées
- 🔄 Messages vocaux avec enregistrement
- 🔄 Appels vidéo/audio
- 🔄 Partage d'écran
- 🔄 Messages épinglés
- 🔄 Messages programmés
- 🔄 Brouillons de messages
- 🔄 Historique d'édition des messages

### Médias et fichiers
- 🔄 Upload vers S3/Cloudinary
- 🔄 Preview d'images dans le chat
- 🔄 Lecteur vidéo intégré
- 🔄 Preview de liens (OpenGraph)
- 🔄 Compression automatique des images

### Organisation
- 🔄 Dossiers de conversations
- 🔄 Étiquettes/tags
- 🔄 Filtres avancés
- 🔄 Archive de conversations
- 🔄 Export de conversations

### Intégrations
- 🔄 Intégration avec les tâches
- 🔄 Création de tâches depuis un message
- 🔄 Liens vers les feuilles de temps
- 🔄 Intégration calendrier

## 📝 Notes techniques

### Performance
- Les conversations sont chargées avec pagination côté serveur
- Les messages utilisent le chargement progressif
- Les avatars sont optimisés avec lazy loading
- Les réactions sont stockées en JSON pour la flexibilité

### Sécurité
- Toutes les actions utilisent `authActionClient`
- Vérification des permissions à chaque opération
- Validation des données avec Zod
- Protection contre les injections

### Accessibilité
- Navigation au clavier complète
- Lecteurs d'écran compatibles
- Contraste suffisant pour le texte
- Indicateurs visuels clairs

## 🎨 Design System

### Couleurs
- Messages reçus : `bg-muted`
- Messages envoyés : `bg-rusty-red text-white`
- Mentions : `bg-blue-100 dark:bg-blue-900`
- Réactions actives : `bg-accent`

### Animations
- Indicateurs de frappe : `animate-bounce`
- Transitions : `transition-opacity`
- Auto-scroll : Smooth scrolling

## 🐛 Dépannage

### Le serveur de développement ne démarre pas
```bash
# Régénérer Prisma Client
pnpm prisma generate

# Redémarrer le serveur
pnpm dev
```

### Erreurs de migration
```bash
# Réinitialiser la base de données
pnpm prisma migrate reset --force

# Recréer les utilisateurs
pnpm tsx scripts/create-admin.ts
pnpm tsx scripts/create-test-users.ts
```

### Les messages ne s'affichent pas
- Vérifier la connexion à la base de données
- Vérifier que l'utilisateur est membre de la conversation
- Vérifier les logs du serveur

## 📞 Support

Pour toute question ou problème, consulter :
- La documentation technique dans `/docs`
- Les scripts de test dans `/scripts`
- Les actions dans `/src/actions/chat.actions.ts`

---

**Version:** 1.0.0  
**Date:** 11 Octobre 2025  
**Statut:** ✅ Production Ready
