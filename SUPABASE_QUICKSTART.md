# ⚡ Démarrage Rapide Supabase - 10 minutes

## 🎯 Vous êtes prêt en 3 étapes

### ① Créer votre Projet Supabase (2 minutes)

```bash
# 1. Allez sur https://supabase.com
# 2. Cliquez "New Project"
# 3. Remplissez :
#    - Nom : chronodil-db
#    - Région : eu-central-1
#    - Mot de passe : [créez un mot de passe fort]
# 4. Cliquez "Create new project"
```

### ② Récupérer la Connection String (2 minutes)

```
Dashboard Supabase → Settings → Database

Sous "Connection Pooling", cliquez "Session"

Copiez la connection string (format) :
postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:6543/postgres
```

### ③ Configurer Chronodil (6 minutes)

```bash
# 1. Ajoutez la DATABASE_URL à votre .env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:6543/postgres"

# 2. Installez les dépendances
pnpm install

# 3. Exécutez les migrations
pnpm prisma migrate deploy

# 4. Lancez l'application
pnpm dev

# 5. Ouvrez http://localhost:3000 ✅
```

---

## 🚀 Production sur Vercel - 5 minutes

```bash
# 1. Ajoutez DATABASE_URL à Vercel
vercel env add DATABASE_URL

# 2. Entrez votre connection string Supabase

# 3. Redéployez
vercel --prod

# 4. C'est fait ! 🎉
```

---

## 📚 Guides Détaillés

Besoin de plus d'informations ?

| Besoin | Guide |
|--------|-------|
| Configuration complète | [SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) |
| Gestion de la base | [SUPABASE_CONFIGURATION.md](./SUPABASE_CONFIGURATION.md) |
| Détails de migration | [MIGRATION_NEON_SUPABASE.md](./MIGRATION_NEON_SUPABASE.md) |
| Scripts automatisés | Exécutez `pnpm supabase:setup` |

---

## 🆘 Besoin d'Aide ?

### Erreur : "Can't reach database server"

```bash
# Vérifiez votre DATABASE_URL
echo $env:DATABASE_URL

# Vérifiez le format
# ✅ postgresql://postgres:password@db.xxx.supabase.co:6543/postgres
# ❌ Ne pas oublier le port 6543 (mode Session)
```

### Erreur : "Database not found"

```bash
# Synchronisez le schéma
pnpm prisma db pull

# Exécutez les migrations
pnpm prisma migrate deploy
```

### Les migrations ne s'exécutent pas

```bash
# Vérifiez l'état
pnpm prisma migrate status

# Forcez l'application
pnpm prisma migrate deploy --skip-generate
```

---

## 📞 Ressources Rapides

- **Docs Supabase** : https://supabase.com/docs
- **Docs Prisma** : https://www.prisma.io/docs
- **Support Supabase** : https://supabase.com/support
- **Stack Overflow** : Tag `supabase` ou `prisma`

---

## ✅ Checklist Finale

- [ ] Créé un compte Supabase
- [ ] Créé un projet nommé `chronodil-db`
- [ ] Copié la DATABASE_URL
- [ ] Ajoutée à `.env`
- [ ] Exécuté `pnpm prisma migrate deploy`
- [ ] Lancé `pnpm dev`
- [ ] Test de connexion réussi
- [ ] (Production) Ajoutée DATABASE_URL à Vercel
- [ ] (Production) Redéployé sur Vercel

---

**Vous êtes prêt ! Lancez votre application maintenant 🚀**

```bash
pnpm dev
```
