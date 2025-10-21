# 🔧 Fix : Problème de Connexion Persistant

## 🐛 Problème

L'application ne peut PAS se connecter au port 5432 direct de Supabase depuis votre environnement Windows.

**Erreur** : `Can't reach database server at db.ipghppjjhjbkhuqzqzyq.supabase.co:5432`

## 💡 Cause Racine

Votre pare-feu Windows, réseau IPv6, ou FAI bloque le port 5432 de Supabase.

## ✅ Solution : Utiliser le Pooler avec pgbouncer

Au lieu de la connexion directe (port 5432), utilisez le **pooler en mode session** (port 6543 avec pgbouncer).

### Mise à Jour de `.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ipghppjjhjbkhuqzqzyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ2hwcGpqaGpia2h1cXpxenlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTcwMzUsImV4cCI6MjA3NjU3MzAzNX0.5Yys6m-QbXr_g7FwYaBWUyeW9ZUCDmAxBMgFk9wft10
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ2hwcGpqaGpia2h1cXpxenlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzAzNSwiZXhwIjoyMDc2NTczMDM1fQ.bH-3bOcJfrdU66wCBYGV1v3yVnggn0KR9A2UHBcuGIs
SUPABASE_JWT_SECRET=hiqwyCbIKFLM46GeZHhSotq9+UzKuww7LfF+gl7hZ9DeOcpZd9IsDmwFGf/M5KIvCp/J7HuxZQlOVQowVU2b6A==

# ⚠️ IMPORTANT : Utiliser le POOLER en mode SESSION (port 5432 du pooler)
# Ceci utilise pgbouncer en mode session qui est compatible avec Prisma
DATABASE_URL="postgresql://postgres.ipghppjjhjbkhuqzqzyq:Reviti2025%40@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.ipghppjjhjbkhuqzqzyq:Reviti2025%40@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Authentication
BETTER_AUTH_SECRET=hiqwyCbIKFLM46GeZHhSotq9+UzKuww7LfF+gl7hZ9DeOcpZd9IsDmwFGf/M5KIvCp/J7HuxZQlOVQowVU2b6A==
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🔑 Explication

**Pooler Supabase** a deux ports :
- Port 6543 : Mode transaction (❌ ne fonctionne pas pour l'application)
- **Port 5432 : Mode session** (✅ fonctionne !)

Le port 5432 du **pooler** (`aws-1-us-east-2.pooler.supabase.com:5432`) est différent du port 5432 **direct** (`db.ipghppjjhjbkhuqzqzyq.supabase.co:5432`).

## 📝 Commandes

```bash
# 1. Arrêter le serveur
Ctrl+C dans le terminal

# 2. Mettre à jour .env.local (voir contenu ci-dessus)

# 3. Supprimer le cache Next.js
rm -rf .next

# 4. Redémarrer
pnpm dev
```

## ✅ Après le Redémarrage

L'application devrait fonctionner sans erreur de connexion ! 🎉

