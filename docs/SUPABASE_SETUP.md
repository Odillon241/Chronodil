# 🚀 Configuration Supabase avec Vercel - Chronodil

Ce guide vous aide à configurer votre base de données Supabase et la connecter à Vercel pour le déploiement de Chronodil.

## 📋 Prérequis

- Compte Supabase (gratuit)
- Compte Vercel
- Supabase CLI installé localement (`pnpm supabase --version`)

---

## 🎯 Étape 1 : Créer un Projet Supabase

### Créer le projet

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur **"New Project"**
3. Remplissez les informations :
   - **Organization** : Sélectionnez votre organisation
   - **Project Name** : `chronodil-db` ou `chronodil-odillon`
   - **Database Password** : Créez un mot de passe fort (⚠️ Notez-le !)
   - **Region** : `eu-central-1` (Europe centrale) ou `eu-west-1` (Irlande)
4. Cliquez sur **"Create new project"**

### Attendez l'initialisation

Le projet peut prendre 1-2 minutes à initialiser. Vous verrez un écran de progression.

---

## 🔑 Étape 2 : Récupérer la Connection String

### Accéder aux paramètres de connexion

1. Une fois le projet créé, allez dans **Settings** (⚙️)
2. Cliquez sur **"Database"** dans la barre latérale gauche
3. Sous **"Connection pooling"**, vous verrez deux options :
   - **Session** (recommandé pour Prisma)
   - **Transaction**

### Copier la Connection String

⚠️ **IMPORTANT : Utilisez le mode "Session" pour Prisma**

Cliquez sur **Session** et copiez la connection string. Le format ressemble à :

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres
```

### Créer les variables d'environnement

Vous avez deux connection strings possibles :

1. **Connection Pooler** (recommandé pour production sur Vercel)
   - Host: `db.[PROJECT-ID].supabase.co` (port 6543)
   - Meilleure performance sur serverless

2. **Direct Connection** (pour développement local)
   - Host: `db.[PROJECT-ID].supabase.co` (port 5432)
   - À utiliser avec `pnpm dev`

---

## 🔧 Étape 3 : Configurer Localement

### Ajouter la DATABASE_URL au `.env`

```bash
# Dans c:\Users\nexon\chronodil_app_clone\CHRONODIL_app\.env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres"
```

### Tester la connexion

```bash
# Testez que Prisma peut se connecter
pnpm prisma db pull

# Devrait afficher "Database pullable"
```

### Générer le client Prisma

```bash
pnpm prisma generate
```

### Exécuter les migrations

```bash
pnpm prisma migrate deploy
```

Ou si c'est la première fois :

```bash
pnpm prisma migrate dev --name init
```

---

## 🌐 Étape 4 : Connecter Supabase à Vercel

### Méthode 1 : Via Intégration Supabase (Recommandée)

1. **Dashboard Supabase** → **Settings** → **Integrations**
2. Recherchez **"Vercel"**
3. Cliquez sur **"Connect"**
4. Connectez-vous à Vercel si demandé
5. Sélectionnez votre project Vercel : `chronodil-app`
6. Confirmez l'intégration

✅ **Les variables d'environnement seront ajoutées automatiquement à Vercel !**

### Méthode 2 : Manuel (Si l'intégration ne fonctionne pas)

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez le project **chronodil-app**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **"Add New"**
5. Remplissez :
   - **Name** : `DATABASE_URL`
   - **Value** : Votre connection string Supabase
   - **Environments** : Production, Preview, Development
6. Cliquez sur **"Save"**

---

## 🚀 Étape 5 : Déployer sur Vercel

### Via Vercel CLI

```bash
# 1. Se connecter à Vercel
vercel login

# 2. Lier le projet local à Vercel
vercel link

# 3. Télécharger les variables (y compris DATABASE_URL)
vercel env pull .env.production

# 4. Générer le client Prisma
pnpm prisma generate

# 5. Exécuter les migrations
pnpm prisma migrate deploy

# 6. Redéployer
vercel --prod
```

### Via Dashboard Vercel

1. Pushez votre code sur GitHub
2. Vercel détectera les changements
3. Le déploiement s'exécutera automatiquement
4. Vérifiez les logs sous **Deployments**

---

## ✅ Étape 6 : Vérifier le Déploiement

### Vérifier que la base de données fonctionne

```bash
# Télécharger les variables depuis Vercel
vercel env pull .env.production

# Tester la connexion
$env:DATABASE_URL='<votre-url>'; pnpm prisma db pull

# Afficher les tables (devrait lister les tables de la base)
$env:DATABASE_URL='<votre-url>'; pnpm prisma db push --skip-generate
```

### Vérifier sur le site déployé

1. Allez sur votre URL Vercel : `https://chronodil-[hash].vercel.app`
2. Essayez de vous connecter
3. Vérifiez que les pages du dashboard se chargent

---

## 🔒 Étape 7 : Sécurité - Configuration Supabase

### Configurer les politiques RLS (Row Level Security)

1. **Dashboard Supabase** → **Authentication** → **Policies**
2. Créez des politiques pour sécuriser l'accès aux données
3. Exemple pour la table `users` :
   ```sql
   CREATE POLICY "Users can read their own data"
   ON users
   FOR SELECT
   USING (auth.uid() = id);
   ```

### Configurer les rôles d'authentification

1. **Dashboard Supabase** → **Authentication** → **Providers**
2. Activez les fournisseurs que vous souhaitez :
   - Email/Password (activé par défaut)
   - GitHub
   - Google
   - etc.

### Configurer SMTP personnalisé (Optionnel)

1. **Settings** → **Email Templates**
2. Configurez les templates pour les emails de confirmation
3. Vous pouvez connecter votre propre serveur SMTP

---

## 📊 Étape 8 : Monitoring et Maintenance

### Accéder à Supabase Studio (Client Web)

1. **Dashboard Supabase** → **SQL Editor** ou **Table Editor**
2. Consultez vos données directement
3. Exécutez des requêtes SQL personnalisées

### Voir les logs des erreurs

1. **Dashboard Supabase** → **Logs** → **Database Logs**
2. Consultez les erreurs de connexion, migrations, etc.

### Backups automatiques

1. **Settings** → **Backups**
2. Supabase crée automatiquement des backups
3. Vous pouvez aussi créer des backups manuels

---

## 🐛 Dépannage

### Erreur : "Connection refused"

**Cause** : La connexion ne peut pas atteindre Supabase

**Solutions** :
```bash
# 1. Vérifier la DATABASE_URL
echo $env:DATABASE_URL

# 2. Tester la connexion
psql -U postgres -h db.[PROJECT-ID].supabase.co -d postgres
```

### Erreur : "FATAL: role \"postgres\" does not exist"

**Cause** : Le rôle PostgreSQL n'a pas les bons droits

**Solution** : Créez un nouveau rôle dans Supabase Dashboard

### Erreur : "Timeout" lors des migrations

**Cause** : La base de données est trop loin ou surchargée

**Solution** : Utilisez le mode **Session** au lieu de **Transaction** dans Connection Pooling

### Les migrations ne s'exécutent pas sur Vercel

**Cause** : DATABASE_URL n'est pas définie correctement

**Solution** :
```bash
# Vérifier que DATABASE_URL existe dans Vercel
vercel env ls

# Sinon, l'ajouter
vercel env add DATABASE_URL
```

---

## 📚 Ressources Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Prisma + Supabase](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Vercel + Supabase Integration](https://vercel.com/integrations/supabase)

---

## 🎉 C'est Prêt !

Vous avez maintenant une base de données Supabase complètement configurée et connectée à Vercel !

### Commandes utiles à retenir

```bash
# Développement local
pnpm dev                          # Lancer l'app

# Base de données
pnpm prisma db pull              # Synchroniser le schéma
pnpm prisma migrate dev          # Créer une migration
pnpm prisma migrate deploy       # Exécuter les migrations
pnpm prisma studio              # Interface visuelle

# Deployment
vercel --prod                    # Déployer en production
vercel env pull                  # Télécharger les vars
vercel logs --follow             # Voir les logs en direct
```

---

**Bon développement ! 🚀**
