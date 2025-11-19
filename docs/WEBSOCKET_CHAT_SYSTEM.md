# Système de Chat WebSocket - CHRONODIL

## Vue d'ensemble

Le système de chat de CHRONODIL utilise **WebSockets natifs** pour permettre une communication bidirectionnelle en temps réel entre le serveur et les clients. Cette solution remplace l'approche précédente basée sur Supabase Realtime et offre plus de contrôle, moins de latence, et plus de flexibilité.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    Architecture WebSocket Chat                     │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         WebSocket            ┌─────────────────┐
│   Client React   │◄──────────────────────────────│  Custom Server  │
│   (Browser)      │   ws://localhost:3000/ws/chat │   (Node.js)     │
│                  │                               │                 │
│ - useWebSocket   │      ┌──────────────┐         │ - Next.js App   │
│   Chat Hook      │──────│  Next.js App │─────────│ - WS Server     │
│ - Auto-reconnect │      └──────────────┘         │ - WS Manager    │
│ - Typed Messages │                               │ - Room Mgmt     │
└──────────────────┘                               └─────────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────────┐
                                                    │   Prisma DB     │
                                                    │   (Messages)    │
                                                    └─────────────────┘
```

## Composants Principaux

### 1. Custom Server (`server.ts`)

**Rôle** : Point d'entrée du serveur qui combine Next.js et WebSocket.

**Fonctionnalités** :
- Démarre le serveur HTTP Next.js
- Crée le serveur WebSocket sur le path `/ws/chat`
- Initialise le `WebSocketManager`
- Gère l'arrêt gracieux du serveur

**Démarrage** :
```bash
# Développement
pnpm dev

# Production
pnpm build
pnpm start
```

### 2. WebSocket Manager (`src/lib/websocket-manager.ts`)

**Rôle** : Gère les connexions WebSocket, l'authentification, et le routing des messages.

**Fonctionnalités** :
- **Authentification** : Vérifie les tokens et associe les connexions aux utilisateurs
- **Room Management** : Gère les rooms par conversation
- **Message Routing** : Distribue les messages aux clients appropriés
- **Heartbeat** : Maintient les connexions actives avec des pings périodiques
- **Typing Indicators** : Broadcast les indicateurs de frappe

**Classes principales** :
```typescript
class WebSocketManager {
  private clients: Map<WebSocket, AuthenticatedClient | null>;
  private conversationRooms: Map<string, Set<WebSocket>>;

  // Méthodes principales
  handleAuthenticate(ws, message): Promise<void>
  handleJoinConversation(ws, message): Promise<void>
  handleSendMessage(ws, message): Promise<void>
  handleTyping(ws, message): Promise<void>
  broadcastToConversation(conversationId, message): void
}
```

### 3. Types WebSocket (`src/types/websocket.ts`)

**Rôle** : Définit tous les types de messages et états de connexion.

**Types de messages** :

#### Client → Server
- `AUTHENTICATE` : Authentification initiale
- `JOIN_CONVERSATION` : Rejoindre une conversation
- `LEAVE_CONVERSATION` : Quitter une conversation
- `SEND_MESSAGE` : Envoyer un message
- `TYPING_START` : Commencer à taper
- `TYPING_STOP` : Arrêter de taper
- `PING` : Heartbeat

#### Server → Client
- `AUTHENTICATED` : Confirmation d'authentification
- `AUTH_ERROR` : Erreur d'authentification
- `JOINED_CONVERSATION` : Confirmation de join
- `LEFT_CONVERSATION` : Confirmation de leave
- `NEW_MESSAGE` : Nouveau message reçu
- `MESSAGE_SENT` : Message envoyé avec succès
- `MESSAGE_ERROR` : Erreur d'envoi de message
- `USER_TYPING` : Un utilisateur tape
- `USER_STOPPED_TYPING` : Un utilisateur a arrêté de taper
- `PONG` : Réponse heartbeat
- `ERROR` : Erreur générale

### 4. Hook Client (`src/hooks/use-websocket-chat.tsx`)

**Rôle** : Hook React pour interagir avec le serveur WebSocket.

**Fonctionnalités** :
- Connexion/Déconnexion automatique
- Reconnexion automatique (max 5 tentatives)
- Gestion de l'état de connexion
- Méthodes typées pour envoyer des messages

**Utilisation** :
```typescript
const {
  // État
  connectionState,
  isConnected,
  isAuthenticated,
  joinedConversations,

  // Actions
  connect,
  disconnect,
  joinConversation,
  leaveConversation,
  sendChatMessage,
  startTyping,
  stopTyping,
} = useWebSocketChat({
  onNewMessage: (message) => {
    console.log('Nouveau message:', message);
  },
  onUserTyping: ({ conversationId, userId, userName }) => {
    console.log(`${userName} est en train de taper...`);
  },
  autoConnect: true,
});
```

## Protocole de Communication

### Format des Messages

Tous les messages sont au format JSON avec la structure suivante :

```typescript
{
  type: WSMessageType,
  timestamp: string, // ISO 8601
  // ... autres champs spécifiques au type
}
```

### Séquence d'Authentification

```
Client                                Server
  │                                     │
  │──── AUTHENTICATE { token } ────────>│
  │                                     │
  │<─── AUTHENTICATED { userId } ───────│
  │                                     │
```

### Séquence d'Envoi de Message

```
Client                                Server                    Other Clients
  │                                     │                             │
  │─── SEND_MESSAGE { content } ───────>│                             │
  │                                     │                             │
  │<──── MESSAGE_SENT { messageId } ────│                             │
  │                                     │                             │
  │                                     │──── NEW_MESSAGE ───────────>│
  │                                     │                             │
```

### Séquence de Join Conversation

```
Client                                Server
  │                                     │
  │─── JOIN_CONVERSATION { id } ───────>│
  │                                     │
  │<─── JOINED_CONVERSATION { id } ─────│
  │                                     │
  │<──── NEW_MESSAGE (existing) ────────│ (messages existants)
  │                                     │
```

## Installation et Configuration

### 1. Installer les dépendances

```bash
pnpm install
```

Les dépendances suivantes ont été ajoutées :
- `ws@^8.18.0` : Bibliothèque WebSocket pour Node.js
- `@types/ws@^8.5.13` : Types TypeScript pour ws

### 2. Configuration

**Variables d'environnement** :
Aucune configuration supplémentaire nécessaire. Le serveur WebSocket utilise le même port que Next.js.

**Custom Server** :
Le fichier `server.ts` à la racine du projet configure :
- Port : `process.env.PORT` ou `3000` par défaut
- Path WebSocket : `/ws/chat`
- Mode dev : `process.env.NODE_ENV !== 'production'`

### 3. Scripts package.json

```json
{
  "scripts": {
    "dev": "tsx watch server.ts",          // Démarre le custom server en dev
    "dev:next": "next dev --turbo",        // Démarre Next.js standard (sans WS)
    "start": "NODE_ENV=production tsx server.ts",  // Production
    "start:next": "next start"             // Next.js standard (sans WS)
  }
}
```

## Utilisation dans le Code

### Exemple : Page de Chat

```typescript
'use client';

import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const conversationId = 'conversation-123';

  const {
    isAuthenticated,
    joinConversation,
    leaveConversation,
    sendChatMessage,
    startTyping,
    stopTyping,
  } = useWebSocketChat({
    onNewMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    autoConnect: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      joinConversation(conversationId);
    }

    return () => {
      leaveConversation(conversationId);
    };
  }, [isAuthenticated, conversationId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendChatMessage(conversationId, newMessage);
      setNewMessage('');
    }
  };

  const handleTyping = () => {
    startTyping(conversationId);
    // Arrêter après 3 secondes d'inactivité
    setTimeout(() => stopTyping(conversationId), 3000);
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.senderName}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <input
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
          handleTyping();
        }}
        placeholder="Type a message..."
      />

      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
```

## Sécurité et Authentification

### Authentification Actuelle (DEV)

**⚠️ IMPORTANT** : L'authentification actuelle est **simplifiée pour le développement**.

```typescript
// Dans WebSocketManager.handleAuthenticate()
const userId = message.token; // ⚠️ DEV ONLY - accepte directement l'userId
```

### Authentification Production (À IMPLÉMENTER)

**Recommandation** : Utiliser JWT (JSON Web Tokens).

```typescript
import jwt from 'jsonwebtoken';

// Serveur
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const userId = decoded.userId;

// Client
const token = await generateJWT(userId);
sendMessage({ type: 'AUTHENTICATE', token });
```

**Alternative** : Utiliser les sessions Better Auth.

```typescript
// Récupérer le token de session depuis Better Auth
const session = await auth.api.getSession({ headers });
const token = session.token;
```

## Avantages par rapport à Supabase Realtime

| Critère | WebSocket Natif | Supabase Realtime |
|---------|----------------|-------------------|
| **Latence** | ✅ < 50ms (directe) | ⚠️ 100-300ms (via PostgreSQL pub/sub) |
| **Contrôle** | ✅ Total (logique serveur custom) | ⚠️ Limité (dépend de Supabase) |
| **Coût** | ✅ Gratuit (auto-hébergé) | ⚠️ Payant selon usage Supabase |
| **Scalabilité** | ⚠️ Nécessite load balancing | ✅ Géré par Supabase |
| **Fonctionnalités** | ✅ Typing indicators, presence, custom events | ⚠️ INSERT/UPDATE/DELETE uniquement |
| **Déploiement** | ⚠️ Custom server requis | ✅ Serverless compatible |

## Performance et Scalabilité

### Optimisations Actuelles

1. **Heartbeat** : Ping toutes les 30 secondes pour maintenir les connexions
2. **Room Management** : Messages broadcast uniquement aux membres de la conversation
3. **Reconnexion automatique** : 5 tentatives avec backoff exponentiel
4. **Lazy Loading** : Les messages existants sont chargés via API REST

### Scalabilité Future

Pour gérer des milliers de connexions simultanées :

1. **Load Balancing** avec Sticky Sessions :
   ```nginx
   upstream websocket {
     ip_hash;
     server 127.0.0.1:3000;
     server 127.0.0.1:3001;
   }
   ```

2. **Redis Pub/Sub** pour synchroniser plusieurs instances :
   ```typescript
   const redis = new Redis();

   // Publier un message
   redis.publish('chat', JSON.stringify(message));

   // S'abonner aux messages
   redis.subscribe('chat', (message) => {
     broadcastToLocalClients(message);
   });
   ```

3. **WebSocket Clustering** avec `ws` + `redis-adapter`.

## Débogage

### Logs Serveur

Le serveur affiche des logs détaillés :
- `🔌 New WebSocket connection` : Nouvelle connexion
- `✅ User authenticated: {name} ({id})` : Authentification réussie
- `📥 User {name} joined conversation {id}` : Join conversation
- `💬 Message sent by {name} in conversation {id}` : Message envoyé
- `❌ User {name} disconnected` : Déconnexion

### Logs Client

Le hook affiche des logs dans la console du navigateur :
- `[WebSocket] Connecting to: ws://...` : Tentative de connexion
- `[WebSocket] Connected` : Connexion établie
- `[WebSocket] Authenticated` : Authentification réussie
- `[WebSocket] New message received` : Nouveau message
- `[WebSocket] Reconnecting (X/5)...` : Reconnexion en cours

### Outils de Débogage

**Chrome DevTools** :
1. Onglet `Network`
2. Filtre `WS` pour voir les WebSockets
3. Cliquer sur la connexion pour voir les messages échangés

**Postman** :
- Supporte les connexions WebSocket
- Permet de tester manuellement les messages

## Problèmes Courants

### 1. Connexion refuse de s'établir

**Cause** : Le custom server n'est pas démarré.

**Solution** :
```bash
pnpm dev  # Démarre le custom server
```

### 2. Authentification échoue

**Cause** : Token invalide ou utilisateur non trouvé.

**Solution** :
- Vérifier que `session?.user?.id` est valide
- Vérifier que l'utilisateur existe dans la base de données

### 3. Messages ne sont pas reçus

**Cause** : Le client n'a pas rejoint la conversation.

**Solution** :
```typescript
useEffect(() => {
  if (isAuthenticated) {
    joinConversation(conversationId); // ← Important !
  }
}, [isAuthenticated, conversationId]);
```

### 4. Reconnexion infinie

**Cause** : Le serveur rejette constamment la connexion.

**Solution** :
- Vérifier les logs serveur pour voir l'erreur exacte
- Vérifier que le port n'est pas déjà utilisé

## Tests

### Test Manuel

1. **Ouvrir 2 onglets** du navigateur sur `/dashboard/chat`
2. **S'authentifier** sur les 2 onglets
3. **Envoyer un message** depuis l'onglet 1
4. **Vérifier** que le message apparaît dans l'onglet 2 en temps réel

### Test avec Postman

1. Créer une nouvelle requête WebSocket : `ws://localhost:3000/ws/chat`
2. Se connecter
3. Envoyer un message d'authentification :
   ```json
   {
     "type": "authenticate",
     "timestamp": "2025-11-19T12:00:00.000Z",
     "token": "USER_ID_HERE"
   }
   ```
4. Rejoindre une conversation :
   ```json
   {
     "type": "join_conversation",
     "timestamp": "2025-11-19T12:00:00.000Z",
     "conversationId": "CONVERSATION_ID_HERE"
   }
   ```
5. Envoyer un message :
   ```json
   {
     "type": "send_message",
     "timestamp": "2025-11-19T12:00:00.000Z",
     "conversationId": "CONVERSATION_ID_HERE",
     "content": "Hello from Postman!"
   }
   ```

## Migration depuis Supabase Realtime

### Changements Requis

1. **Remplacer `use-realtime-chat.tsx`** par `use-websocket-chat.tsx`
2. **Mettre à jour la page de chat** pour utiliser le nouveau hook
3. **Désactiver** Supabase Realtime dans Supabase Dashboard (optionnel)

### Exemple de Migration

**Avant** (Supabase Realtime) :
```typescript
useRealtimeChat({
  onConversationChange: () => loadConversations(),
  onMessageChange: () => loadMessages(),
  userId: currentUser?.id,
});
```

**Après** (WebSocket) :
```typescript
useWebSocketChat({
  onNewMessage: (message) => {
    setMessages((prev) => [...prev, message]);
  },
  autoConnect: true,
});
```

## Déploiement

### Développement Local

```bash
pnpm install
pnpm dev
```

### Production (Vercel, etc.)

**⚠️ IMPORTANT** : Les custom servers ne sont **pas supportés** sur Vercel.

**Solutions** :
1. **Déployer sur une VM** (AWS EC2, DigitalOcean, etc.)
2. **Utiliser un service WebSocket séparé** (Pusher, Ably, Socket.IO)
3. **Déployer sur un PaaS compatible** (Render, Railway, Fly.io)

**Configuration pour VM** :
```bash
# Build
pnpm build

# Start avec PM2
pm2 start npm --name "chronodil-ws" -- start

# Avec Nginx reverse proxy
server {
  location /ws/chat {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Roadmap

### Fonctionnalités Futures

- [ ] **Presence Indicators** : Afficher les utilisateurs en ligne
- [ ] **Read Receipts** : Marquer les messages comme lus
- [ ] **Message Reactions** : Ajouter des réactions (emoji)
- [ ] **File Attachments via WebSocket** : Upload de fichiers en streaming
- [ ] **Voice Messages** : Enregistrement et envoi de messages vocaux
- [ ] **Video Calls** : Intégration WebRTC pour les appels vidéo
- [ ] **End-to-End Encryption** : Chiffrement des messages

### Optimisations Futures

- [ ] **Redis Pub/Sub** : Synchronisation multi-instances
- [ ] **WebSocket Compression** : Réduire la bande passante
- [ ] **Message Batching** : Grouper les messages pour réduire les round-trips
- [ ] **Lazy Loading** : Charger les messages à la demande
- [ ] **Message Caching** : Cache côté client avec IndexedDB

## Références

- [ws Documentation](https://github.com/websockets/ws)
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Next.js Custom Server](https://nextjs.org/docs/app/guides/custom-server)
- [Node.js HTTP Server](https://nodejs.org/api/http.html)

---

**Auteur** : Claude Code
**Date** : 2025-11-19
**Version** : 1.0.0
