# 🔷 Configuration Supabase - Chronodil App

## 📋 Vue d'ensemble

Chronodil utilise maintenant **Supabase** comme base de données principale, remplaçant Neon.

**Avantages de Supabase :**
- ✅ PostgreSQL managed gratuit et illimité (pour les projets petits)
- ✅ Interface web intuitif (Studio)
- ✅ Authentification intégrée
- ✅ RLS (Row Level Security) pour la sécurité
- ✅ Intégration simple avec Vercel
- ✅ Backups automatiques

---

## 🚀 Démarrage Rapide

### 1. Créer un Compte Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"**
3. Connectez-vous avec GitHub (gratuit)
4. Créez une nouvelle organisation ou utilisez la suggestion

### 2. Créer un Projet

```
Nom : chronodil-db
Région : eu-central-1 (Europe)
```

### 3. Copier la Connection String

- Allez dans **Settings** → **Database**
- Sous **Connection pooling**, sélectionnez **Session** (important pour Prisma)
- Copiez la connection string

### 4. Configurer l'Application

Ajoutez la connection string à votre `.env` :

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres"
```

### 5. Exécuter les Migrations

```bash
pnpm prisma migrate deploy
```

### 6. Tester Localement

```bash
pnpm dev
```

---

## 🔑 Variables d'Environnement

### Développement Local (`.env`)

```env
# Base de données
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres"

# Authentification
BETTER_AUTH_SECRET="votre-cle-secrete"
BETTER_AUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Production sur Vercel

Les variables suivantes doivent être configurées dans Vercel :

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres"
BETTER_AUTH_SECRET="votre-cle-secrete"
BETTER_AUTH_URL="https://chronodil-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://chronodil-app.vercel.app"
NODE_ENV="production"
```

---

## 📊 Gestion de la Base de Données

### Accès via Supabase Studio

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Utilisez **Table Editor** pour voir les données
4. Utilisez **SQL Editor** pour des requêtes personnalisées

### Gestion avec Prisma

```bash
# Voir les tables
pnpm prisma studio

# Ajouter une nouvelle table (créer une migration)
pnpm prisma migrate dev --name add_new_table

# Synchroniser le schéma avec la base
pnpm prisma db pull

# Appliquer les migrations en production
pnpm prisma migrate deploy
```

---

## 🔄 Migrations

### Créer une Migration

```bash
pnpm prisma migrate dev --name descriptive_name
```

Cela va :
1. Créer un fichier de migration
2. L'appliquer à la base de données locale
3. Régénérer le client Prisma

### Appliquer les Migrations en Production

```bash
# Télécharger les variables depuis Vercel
vercel env pull .env.production

# Appliquer les migrations
pnpm prisma migrate deploy
```

---

## 🌐 Connexion avec Vercel

### Intégration Automatique (Recommandé)

1. **Dashboard Supabase** → **Settings** → **Integrations**
2. Cliquez sur **Vercel**
3. Connectez votre project Vercel
4. Les variables sont ajoutées automatiquement ✅

### Configuration Manuelle

1. Allez sur **vercel.com/dashboard**
2. Sélectionnez votre project
3. **Settings** → **Environment Variables**
4. Ajoutez `DATABASE_URL` avec votre connection string Supabase
5. Sélectionnez **Production, Preview, Development**

---

## 🔒 Sécurité

### RLS (Row Level Security)

Supabase recommande d'activer RLS pour sécuriser vos données :

```sql
-- Exemple : Les utilisateurs ne peuvent voir que leurs propres données
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own data"
  ON users
  FOR SELECT
  USING (id = auth.uid());
```

### Authentification

- Utilisateurs : Gérés via Better Auth
- Sessions : Stockées dans les tables Prisma
- Mots de passe : Hash avec bcrypt

---

## 📈 Monitoring

### Voir les Logs

**Dashboard Supabase** → **Logs** → **Database Logs**

Types de logs disponibles :
- Connection logs
- Query logs
- Error logs

### Performance

**Dashboard Supabase** → **Statistics**

Vous pouvez voir :
- Utilisation du stockage
- Nombre de connexions
- Taille de la base de données

### Backups

Supabase crée automatiquement des backups :
- Quotidiens (7 jours)
- Hebdomadaires (4 semaines)

Vous pouvez aussi créer des backups manuels.

---

## 🐛 Dépannage

### Erreur : "Can't reach database server"

**Solutions :**

1. Vérifiez que la base de données est active
   - Dashboard Supabase → Voir l'état du serveur

2. Vérifiez la `DATABASE_URL`
   ```bash
   echo $env:DATABASE_URL
   ```

3. Testez la connexion avec psql
   ```bash
   psql -U postgres -h db.[PROJECT-ID].supabase.co -d postgres
   ```

### Erreur : "Timeout during query"

**Solutions :**

1. Utilisez **Session mode** au lieu de **Transaction mode**
   - Dashboard Supabase → Settings → Database → Connection Pooling

2. Augmentez le timeout
   ```env
   DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=60"
   ```

### Erreur : "AUTH.UID() returns null"

**Solutions :**

1. Vérifiez que l'utilisateur est authentifié
2. Vérifiez que le JWT token est valide
3. Assurez-vous que Better Auth est correctement configuré

---

## 📚 Ressources Officielles

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Vercel + Supabase Integration](https://vercel.com/integrations/supabase)

---

## 🛠️ Scripts Disponibles

### PowerShell (Windows)

```bash
# Configuration complète Supabase + Vercel
powershell -ExecutionPolicy Bypass -File scripts/setup-supabase-vercel.ps1
```

### Bash (Linux/Mac)

```bash
# Configuration complète Supabase + Vercel
bash scripts/setup-supabase-vercel.sh
```

---

## 📞 Besoin d'Aide ?

1. Consultez le guide complet : `docs/SUPABASE_SETUP.md`
2. Vérifiez les logs Supabase
3. Consultez la documentation officielle
4. Ouvrez un issue sur le repository GitHub

---

**Bienvenue dans l'écosystème Supabase ! 🚀**
