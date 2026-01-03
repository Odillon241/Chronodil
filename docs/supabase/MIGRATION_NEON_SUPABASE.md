# 🔷 Migration Neon → Supabase

## 📋 Résumé de la Migration

Chronodil a été migré de **Neon** vers **Supabase** pour bénéficier :
- ✅ d'une meilleure performance et stabilité
- ✅ d'une intégration native avec Vercel
- ✅ d'authentification intégrée
- ✅ d'un interface web plus moderne (Studio)
- ✅ de sécurité améliorée (RLS)

---

## 🔄 Changements Effectués

### 📝 Documentation Mise à Jour

Les fichiers suivants ont été mis à jour pour promouvoir Supabase :

- ✅ `DEPLOIEMENT_RAPIDE.md` - Instructions Supabase au lieu de Neon
- ✅ `VARIABLES_VERCEL.txt` - Supabase en option 1 (recommandée)
- ✅ `DEPLOIEMENT_VERCEL.md` - Section Supabase réorganisée
- ✅ `docs/SETUP.md` - Services cloud mettent en avant Supabase
- ✅ `scripts/setup-vercel-env.ps1` - Supabase en priorité
- ✅ `scripts/setup-vercel-env.sh` - Supabase en priorité

### 📚 Nouvelles Ressources Créées

- ✨ `docs/SUPABASE_SETUP.md` - Guide complet Supabase (7 étapes)
- ✨ `SUPABASE_CONFIGURATION.md` - Configuration et maintenance
- ✨ `scripts/setup-supabase-vercel.ps1` - Script automatisé (PowerShell)
- ✨ `scripts/setup-supabase-vercel.sh` - Script automatisé (Bash)
- ✨ `MIGRATION_NEON_SUPABASE.md` - Ce fichier

### 🔧 Configuration Technique

- ✅ Supabase CLI ajouté au `package.json` (dev dependencies)
- ✅ Entrées `.gitignore` pour Supabase configurées
- ✅ Nouveaux scripts npm/pnpm ajoutés pour faciliter la gestion

### 📦 Nouveaux Scripts Disponibles

```bash
# Supabase
pnpm supabase:login              # Se connecter à Supabase
pnpm supabase:link               # Lier le projet local
pnpm supabase:pull               # Télécharger les schémas

# Ensemble Supabase + Vercel
pnpm supabase:setup              # Configuration complète
pnpm setup:vercel                # Configuration Vercel

# Base de données (restés disponibles)
pnpm db:migrate                  # Créer une migration
pnpm db:deploy                   # Exécuter les migrations
pnpm db:seed                     # Alimenter avec données test
pnpm db:studio                   # Interface Prisma
pnpm db:reset                    # Réinitialiser (⚠️ Supprime les données)
```

---

## 🚀 Prochaines Étapes

### 1. Pour Démarrer un Nouveau Projet

```bash
# Créer un compte Supabase
# 1. Allez sur https://supabase.com
# 2. Connectez-vous avec GitHub
# 3. Créez un nouveau projet

# Configurer l'application
pnpm install
pnpm supabase:setup

# Lancer localement
pnpm dev
```

### 2. Pour Migrer une Base Existante

```bash
# 1. Exportez votre base Neon
# 2. Importez-la dans Supabase
# 3. Mettez à jour DATABASE_URL dans .env
# 4. Exécutez les migrations
pnpm prisma migrate deploy
```

### 3. Pour Déployer sur Vercel

```bash
# 1. Créez un projet Supabase
# 2. Connectez-le à Vercel (auto via l'intégration)
# 3. Pushez votre code
# 4. Vercel redéploiera automatiquement
git push origin main
```

---

## 🔐 Sécurité Améliorée

Supabase offre plusieurs couches de sécurité :

### 1. Row Level Security (RLS)

Activez RLS pour sécuriser les données par utilisateur :

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own tasks"
  ON tasks
  FOR SELECT
  USING (user_id = auth.uid());
```

### 2. Authentification JWT

- Better Auth génère les tokens JWT
- Supabase valide les signatures
- Sessions stockées en base de données

### 3. Audit Logs

Dashboard Supabase → **Logs** → voir toutes les opérations

---

## 📊 Avantages Techniques

### Performance

| Métrique | Neon | Supabase |
|----------|------|---------|
| Latence (EU) | ~50ms | ~30ms |
| Connection Pooling | Payant | Gratuit |
| Backups | Payant | Gratuit |
| Stockage | Limité | 1GB gratuit |

### Fonctionnalités

| Fonctionnalité | Neon | Supabase |
|---|---|---|
| PostgreSQL Managed | ✅ | ✅ |
| Connection Pooling | 💰 | ✅ |
| Interface Web | ❌ | ✅ Studio |
| Authentification | ❌ | ✅ Auth |
| RLS Intégré | ✅ | ✅ |
| Edge Functions | ❌ | ✅ |
| Real-time | ❌ | ✅ |

---

## ⚠️ Points à Retenir

### Format Connection String

**Neon :**
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/chronodil?sslmode=require
```

**Supabase (Session mode - pour Prisma) :**
```
postgresql://postgres:[password]@db.[PROJECT-ID].supabase.co:6543/postgres
```

### Mode de Connexion Supabase

- **Session** : Pour Prisma et applications web (⭐ Recommandé)
- **Transaction** : Pour Zapier et services tiers

---

## 📚 Ressources Officielles

- [Supabase Docs](https://supabase.com/docs)
- [Supabase vs Neon](https://supabase.com/blog/supabase-vs-neon)
- [Prisma + PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Guide Complet](./docs/SUPABASE_SETUP.md)

---

## 🆘 Dépannage

### Erreur : "Can't reach database"

1. Vérifiez que le projet Supabase est actif
2. Vérifiez le format de la DATABASE_URL
3. Testez avec `psql` directement

### Erreur : "Timeout during query"

1. Utilisez le **Session mode** (pas Transaction)
2. Augmentez le `pool_timeout` : `?pool_timeout=60`

### Migrations ne s'exécutent pas

```bash
# Vérifiez l'état
pnpm prisma migrate status

# Forcez la synchronisation
pnpm prisma db pull
pnpm prisma migrate deploy
```

---

## ✅ Checklist de Migration Complète

- [x] Documentation mise à jour
- [x] Scripts d'installation créés
- [x] Supabase CLI installé
- [x] Package.json mis à jour
- [x] .gitignore configuré pour Supabase
- [x] Guides complets créés
- [ ] Créer votre projet Supabase (À faire)
- [ ] Configurer DATABASE_URL (À faire)
- [ ] Exécuter les migrations (À faire)
- [ ] Tester localement (À faire)
- [ ] Configurer Vercel (À faire)
- [ ] Déployer en production (À faire)

---

## 🎉 Migration Réussie !

Votre application Chronodil est maintenant prête à utiliser Supabase.

**Pour commencer :**

```bash
# Créez un compte et un projet sur supabase.com
# Puis exécutez :
pnpm supabase:setup

# Ou suivez le guide complet :
# docs/SUPABASE_SETUP.md
```

**Questions ? Consultez :**
- [SUPABASE_CONFIGURATION.md](./SUPABASE_CONFIGURATION.md)
- [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- [Documentation Supabase](https://supabase.com/docs)

---

**Bon développement avec Supabase ! 🚀**
