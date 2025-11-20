# 🚀 Guide de Déploiement Vercel - Chronodil

## 📋 Prérequis

- Compte Vercel (gratuit ou Pro)
- Dépôt GitHub avec le code à jour
- Base de données PostgreSQL (recommandé: Supabase, Vercel Postgres)
- Compte Resend pour les emails
- Compte Inngest pour les tâches planifiées (optionnel mais recommandé)

---

## 🗄️ Étape 1 : Préparer la Base de Données

### Option A : Supabase (Recommandé - Gratuit forever)
1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur **New Project**
3. Nom : `chronodil-db`
4. Région : `eu-central-1` (Europe)
5. Dans **Settings > Database > Connection Pooling**, copiez la **Connection string** (mode Session)
6. Format : `postgresql://postgres:[password]@db.[region].supabase.co:5432/postgres`

### Option B : Vercel Postgres
1. Dans votre dashboard Vercel, allez dans **Storage**
2. Créez un nouveau **Postgres Database**
3. Notez la `DATABASE_URL` fournie

### Option C : Neon
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez la `DATABASE_URL` avec `?sslmode=require`

---

## 🔐 Étape 2 : Variables d'Environnement

Voici **toutes** les variables à configurer dans Vercel :

### Variables Essentielles (Obligatoires)

```env
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Better Auth (Authentification)
BETTER_AUTH_SECRET="generer-avec-openssl-rand-base64-32"
BETTER_AUTH_URL="https://votre-app.vercel.app"

# Email
RESEND_API_KEY="re_votre_cle"

# URL publique
NEXT_PUBLIC_APP_URL="https://votre-app.vercel.app"

# Environment
NODE_ENV="production"
```

### Variables Optionnelles

```env
# Inngest (Tâches planifiées - rappels automatiques)
INNGEST_EVENT_KEY="votre_cle"
INNGEST_SIGNING_KEY="votre_signature"

# OpenAI (Fonctionnalités IA - suggestions intelligentes)
OPENAI_API_KEY="sk-votre-cle"
```

### 🔑 Comment générer BETTER_AUTH_SECRET

**Sur Linux/Mac :**
```bash
openssl rand -base64 32
```

**Sur Windows (PowerShell) :**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Ou en ligne :**
- https://generate-secret.vercel.app/32

---

## 🌐 Étape 3 : Obtenir les Clés API

### Resend (Email)
1. Allez sur [resend.com](https://resend.com)
2. Créez un compte (gratuit : 100 emails/jour)
3. Allez dans **API Keys** > **Create API Key**
4. Copiez la clé qui commence par `re_`
5. **Important** : Ajoutez et vérifiez votre domaine dans Resend

### Inngest (Optionnel - Tâches planifiées)
1. Allez sur [inngest.com](https://inngest.com)
2. Créez un compte (gratuit)
3. Créez une nouvelle app
4. Copiez `Event Key` et `Signing Key`

### OpenAI (Optionnel - IA)
1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez un compte et ajoutez un mode de paiement
3. Allez dans **API keys** > **Create new secret key**
4. Copiez la clé qui commence par `sk-`

---

## 🚀 Étape 4 : Déploiement sur Vercel

### Via Dashboard Vercel (Recommandé)

1. **Connectez votre dépôt GitHub**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur **Add New** > **Project**
   - Importez votre dépôt GitHub

2. **Configuration du projet**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: pnpm build
   Output Directory: .next
   Install Command: pnpm install
   Development Command: pnpm dev
   ```

3. **Variables d'environnement**
   - Cliquez sur **Environment Variables**
   - Ajoutez **TOUTES** les variables listées ci-dessus
   - Pour chaque variable :
     - **Key** : Nom de la variable
     - **Value** : Valeur de la variable
     - **Environment** : Production, Preview, Development (sélectionnez tous)

4. **Déploiement**
   - Cliquez sur **Deploy**
   - Attendez 3-5 minutes

### Via CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Ou directement en production
vercel --prod
```

---

## 🗃️ Étape 5 : Migrer la Base de Données

**IMPORTANT** : La base de données doit être migrée **après** le premier déploiement.

### Méthode 1 : Via Vercel CLI (Recommandé)

```bash
# 1. Installer Vercel CLI si pas déjà fait
npm i -g vercel

# 2. Se connecter à Vercel
vercel login

# 3. Lier le projet local à Vercel
vercel link

# 4. Télécharger les variables d'environnement
vercel env pull .env.production

# 5. Générer le client Prisma
pnpm prisma generate

# 6. Déployer les migrations
pnpm prisma migrate deploy
```

### Méthode 2 : Via Script Direct

```bash
# 1. Remplacer DATABASE_URL par votre URL de production
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
```

### Méthode 3 : Via Prisma Studio (Visual)

```bash
# 1. Ouvrir Prisma Studio avec la DB de production
DATABASE_URL="postgresql://..." pnpm prisma studio

# 2. Dans un autre terminal
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
```

---

## 👤 Étape 6 : Créer le Premier Utilisateur Admin

### Via Script (Recommandé)

Créez un fichier `scripts/create-admin.ts` :

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('VotreMotDePasse123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@votre-entreprise.com',
      firstName: 'Admin',
      lastName: 'Principal',
      role: 'ADMIN',
      isActive: true,
      // Mot de passe hashé
      sessions: {
        create: {
          id: 'temp-session',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          token: 'temp',
          ipAddress: '0.0.0.0',
          userAgent: 'script',
        }
      }
    },
  });

  // Créer un compte Better Auth associé
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: admin.id,
      accountId: admin.email,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  console.log('✅ Admin créé:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Exécutez :
```bash
DATABASE_URL="votre-url-production" tsx scripts/create-admin.ts
```

### Via Interface Web

1. Déployez d'abord avec la route `/auth/register` accessible
2. Créez le premier compte via l'interface
3. Utilisez Prisma Studio pour changer le `role` en `ADMIN`

---

## ✅ Étape 7 : Vérifications Post-Déploiement

### Checklist

- [ ] Le site s'ouvre sans erreur
- [ ] La connexion fonctionne
- [ ] Les pages du dashboard se chargent
- [ ] Les images/avatars s'affichent
- [ ] Le thème sombre/clair fonctionne
- [ ] La création de projet fonctionne
- [ ] La création de tâche fonctionne
- [ ] Les notifications apparaissent

### Tester les Fonctionnalités

```bash
# 1. Connexion
https://votre-app.vercel.app/auth/login

# 2. Dashboard
https://votre-app.vercel.app/dashboard

# 3. API Health Check
https://votre-app.vercel.app/api/auth/session
```

---

## 🔧 Étape 8 : Configuration Inngest (Optionnel)

Si vous utilisez Inngest pour les rappels automatiques :

1. Dans le dashboard Inngest, ajoutez l'endpoint :
   ```
   https://votre-app.vercel.app/api/inngest
   ```

2. Vérifiez que les variables sont bien configurées :
   ```env
   INNGEST_EVENT_KEY="..."
   INNGEST_SIGNING_KEY="..."
   ```

3. Testez l'intégration via le dashboard Inngest

---

## 🌍 Étape 9 : Domaine Personnalisé (Optionnel)

### Ajouter un Domaine

1. Dans Vercel, allez dans **Settings** > **Domains**
2. Cliquez sur **Add**
3. Entrez votre domaine (ex: chronodil.com)
4. Suivez les instructions pour configurer le DNS

### Mettre à Jour les Variables

⚠️ **Important** : Après avoir ajouté un domaine, mettez à jour :

```env
BETTER_AUTH_URL="https://chronodil.com"
NEXT_PUBLIC_APP_URL="https://chronodil.com"
```

Et dans Resend, mettez à jour le domaine d'envoi.

---

## 📊 Monitoring et Logs

### Voir les Logs en Temps Réel

```bash
vercel logs --follow
```

### Voir les Logs d'un Déploiement Spécifique

1. Allez dans le dashboard Vercel
2. Cliquez sur votre projet
3. Onglet **Deployments**
4. Cliquez sur un déploiement > **View Logs**

### Analytics Vercel

Activez **Vercel Analytics** pour suivre :
- Performance des pages
- Erreurs frontend
- Temps de réponse
- Trafic utilisateur

---

## 🐛 Résolution de Problèmes

### Erreur : "Cannot find module 'prisma'"

**Solution** :
```json
// Vérifiez package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Erreur : "DATABASE_URL is not defined"

**Solution** : Vérifiez que la variable `DATABASE_URL` est bien définie dans Vercel

### Erreur de Build : "Type error"

**Solution** :
```bash
# Testez le build en local
pnpm build

# Si ça passe en local mais pas sur Vercel, vérifiez Node.js version
```

### Erreur : "Session not found"

**Solution** : Vérifiez `BETTER_AUTH_URL` correspond exactement à votre domaine

### Base de Données : Connection Timeout

**Solution** : Ajoutez `?connection_limit=10&pool_timeout=60` à votre `DATABASE_URL`

---

## 🚀 Optimisations Post-Déploiement

### 1. Activer la Compression

Déjà activé par défaut dans Next.js 15.

### 2. Configurer le Cache

```typescript
// next.config.js
const nextConfig = {
  headers: async () => [
    {
      source: '/uploads/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

### 3. Activer Image Optimization

Déjà configuré dans `next.config.js`

### 4. Monitoring des Performances

Installez Vercel Speed Insights :
```bash
pnpm add @vercel/speed-insights
```

---

## 📝 Commandes Utiles

```bash
# Redéployer
vercel --prod

# Voir les logs
vercel logs

# Ouvrir le dashboard
vercel open

# Lister les déploiements
vercel ls

# Rollback vers un déploiement précédent
vercel rollback [deployment-url]

# Variables d'environnement
vercel env ls                  # Lister
vercel env add [name]          # Ajouter
vercel env rm [name]           # Supprimer
```

---

## 🎉 Déploiement Réussi !

Votre application Chronodil est maintenant en production sur Vercel !

### URLs à Bookmarker

- **App** : https://votre-app.vercel.app
- **Dashboard Vercel** : https://vercel.com/[team]/[project]
- **Logs** : https://vercel.com/[team]/[project]/logs
- **Analytics** : https://vercel.com/[team]/[project]/analytics

### Support

- Documentation Vercel : https://vercel.com/docs
- Documentation Next.js : https://nextjs.org/docs
- Documentation Prisma : https://www.prisma.io/docs

---

## 📬 Contact

Pour toute question sur le déploiement, consultez la documentation ou contactez le support Vercel.

**Bon déploiement ! 🚀**

