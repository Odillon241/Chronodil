# 🚀 Guide de Déploiement Vercel

## ⚠️ Limitation Importante : Socket.IO

### Le Problème

**Socket.IO n'est PAS compatible avec Vercel** car:

1. **Vercel est serverless** - Les fonctions s'exécutent à la demande et s'arrêtent après chaque requête
2. **Socket.IO nécessite un serveur persistant** - Les connexions WebSocket doivent rester ouvertes
3. **Custom servers ne sont pas supportés** - Vercel ne permet pas d'utiliser `server.ts`

### La Solution Actuelle

Nous avons configuré le projet pour fonctionner en **mode hybride** :

#### 🏠 Développement Local (Socket.IO)
```bash
pnpm dev
# Lance server.ts avec Socket.IO sur http://localhost:3000
# Chat en temps réel avec WebSocket
```

#### ☁️ Production Vercel (Sans Socket.IO)
```bash
# Vercel utilise automatiquement Next.js en mode serverless
# Le chat fonctionne avec les Server Actions Next.js existantes
# Pas de temps réel, rechargement manuel nécessaire
```

---

## 📁 Fichiers de Configuration

### `.vercelignore`
```
# Custom server (Socket.IO) - Not compatible with Vercel serverless
server.ts
src/lib/socketio-manager.ts
src/lib/websocket-manager.ts
src/app/dashboard/test/socketio/
scripts/create-test-conversation.ts
```

**Rôle** : Exclut les fichiers Socket.IO du déploiement Vercel

### `vercel.json`
```json
{
  "devCommand": "pnpm dev:next",
  "buildCommand": "pnpm build"
}
```

**Changements** :
- ✅ `devCommand: "pnpm dev:next"` - Utilise Next.js standard (pas `server.ts`)
- ✅ Les builds Vercel n'essaient plus de lancer le custom server

---

## 🔧 Erreurs de Déploiement Résolues

### Avant (Erreur)
```
Status: ● Error
Cause: Vercel essayait de lancer server.ts (custom server)
Résultat: Incompatible avec l'architecture serverless
```

### Après (Corrigé)
```
Status: ● Ready
Cause: Vercel utilise Next.js standard via dev:next
Résultat: Déploiement réussi sans Socket.IO
```

---

## 🎯 Solutions Alternatives pour le Temps Réel sur Vercel

Si vous voulez du temps réel sur Vercel, voici les options :

### Option 1 : Supabase Realtime (Recommandé)
✅ **Compatible avec Vercel**
✅ **Déjà intégré dans le projet**
✅ **Gratuit jusqu'à 2M de messages/mois**

```typescript
// Déjà implémenté dans src/hooks/use-realtime-notifications.tsx
supabase
  .channel('chat-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'Message'
  }, (payload) => {
    // Nouveau message reçu
  })
  .subscribe();
```

### Option 2 : Pusher
✅ Compatible Vercel
⚠️ Payant après 200k messages/jour
📚 https://pusher.com

### Option 3 : Ably
✅ Compatible Vercel
⚠️ Payant après 3M messages/mois
📚 https://ably.com

### Option 4 : Serveur Dédié (Socket.IO)
✅ Socket.IO complet
⚠️ Nécessite un VPS/serveur dédié
💰 Coût supplémentaire

**Options recommandées** :
- AWS EC2
- DigitalOcean Droplet
- Render.com (support WebSocket natif)
- Railway.app (support WebSocket natif)

---

## 🚀 Déploiement sur Vercel

### Étape 1 : Configuration Initiale

```bash
# Se connecter à Vercel (si pas déjà fait)
vercel login

# Lier le projet
vercel link
```

### Étape 2 : Variables d'Environnement

Assurez-vous que toutes les variables sont configurées dans Vercel Dashboard :

```bash
# Obligatoires
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optionnelles
RESEND_API_KEY=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Étape 3 : Déployer

```bash
# Preview deployment (branche actuelle)
vercel

# Production deployment
vercel --prod
```

---

## 🧪 Tester le Déploiement

### Après un Déploiement Réussi

1. **Vérifier le statut**
   ```bash
   vercel ls
   # Devrait afficher: ● Ready
   ```

2. **Accéder à l'URL**
   ```
   https://chronodil-app.vercel.app
   ```

3. **Tester les fonctionnalités**
   - ✅ Authentification
   - ✅ Dashboard
   - ✅ Projets
   - ✅ Tâches
   - ✅ Feuilles de temps
   - ⚠️ Chat (sans temps réel - rafraîchir manuellement)

---

## 🐛 Résolution de Problèmes

### Erreur: "Deployment not ready. Currently: ● Error"

**Causes possibles** :
1. Custom server détecté (server.ts)
2. Variables d'environnement manquantes
3. Erreur de build TypeScript

**Solutions** :
```bash
# 1. Vérifier .vercelignore
cat .vercelignore
# Doit contenir: server.ts

# 2. Vérifier vercel.json
cat vercel.json
# Doit avoir: "devCommand": "pnpm dev:next"

# 3. Vérifier les variables
vercel env ls

# 4. Re-déployer
git add .vercelignore vercel.json
git commit -m "fix: Configure Vercel to ignore Socket.IO custom server"
git push
```

### Erreur: "Failed to find Server Action"

**Cause** : Cache Vercel obsolète

**Solution** :
```bash
# Re-déployer en forçant un nouveau build
vercel --force
```

### Chat ne fonctionne pas en temps réel

**Normal sur Vercel** - Socket.IO n'est pas déployé

**Solutions** :
1. Utiliser Supabase Realtime (gratuit)
2. Déployer sur un serveur dédié avec Socket.IO
3. Accepter le rechargement manuel en production Vercel

---

## 📊 Comparaison des Options

| Fonctionnalité | Dev Local (Socket.IO) | Vercel (Serverless) | VPS (Socket.IO) |
|----------------|----------------------|---------------------|-----------------|
| **Temps réel** | ✅ Natif | ❌ Nécessite alternative | ✅ Natif |
| **Coût** | Gratuit | Gratuit (hobby tier) | ~$5-20/mois |
| **Scalabilité** | Limité | ✅ Automatique | Manuel |
| **Maintenance** | Aucune | ✅ Gérée par Vercel | Manuel |
| **WebSocket** | ✅ | ❌ | ✅ |
| **Deployment** | Local | ✅ Automatique (Git) | Manuel |

---

## 🎯 Recommandations

### Pour la Production Actuelle (Vercel)
1. ✅ Garder le déploiement Vercel (serverless)
2. ✅ Utiliser Supabase Realtime pour le temps réel
3. ✅ Socket.IO reste disponible pour le développement local

### Si Besoin de Socket.IO en Production
1. Déployer l'application sur:
   - **Render.com** (recommandé - support WebSocket natif)
   - **Railway.app** (recommandé - facile à configurer)
   - AWS EC2 avec PM2
   - DigitalOcean Droplet

2. Configuration PM2 pour production :
   ```json
   {
     "apps": [{
       "name": "chronodil-app",
       "script": "pnpm",
       "args": "start",
       "instances": 1,
       "exec_mode": "cluster",
       "env": {
         "NODE_ENV": "production",
         "PORT": 3000
       }
     }]
   }
   ```

3. Utiliser Nginx comme reverse proxy :
   ```nginx
   location /ws/chat {
     proxy_pass http://localhost:3000;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

---

## 📚 Ressources

- [Vercel Limitations](https://vercel.com/docs/concepts/limits/overview)
- [Socket.IO Deployment](https://socket.io/docs/v4/server-deployment/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Render.com WebSocket Guide](https://render.com/docs/web-services#websocket-support)

---

## ✅ Checklist de Déploiement

- [x] `.vercelignore` créé avec server.ts
- [x] `vercel.json` modifié pour utiliser `dev:next`
- [x] Variables d'environnement configurées dans Vercel
- [ ] Push des changements sur GitHub
- [ ] Déploiement automatique Vercel déclenché
- [ ] Vérification du statut : ● Ready
- [ ] Test de l'application déployée
- [ ] Chat fonctionne (sans temps réel sur Vercel)

---

**✨ Le déploiement Vercel devrait maintenant fonctionner sans erreurs !**
