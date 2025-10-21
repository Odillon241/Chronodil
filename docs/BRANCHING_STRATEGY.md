# Stratégie de Branchement - Chronodil App

## Vue d'ensemble

Le projet utilise une stratégie de branchement pour séparer le développement et la production.

## Branches principales

### 🟢 `main` (Développement)
- **Environnement**: Développement local
- **URLs**: `http://localhost:3000`
- **NODE_ENV**: `development`
- **Fichier .env**: `.env.development`
- **Utilisation**: Tous les développements, nouvelles fonctionnalités, corrections de bugs
- **Base de données**: Supabase (partagée avec production)

### 🔴 `production` (Production)
- **Environnement**: Déploiement en production
- **URLs**: `https://chronodil-app.vercel.app`
- **NODE_ENV**: `production`
- **Fichier .env**: `.env.production`
- **Déploiement**: Vercel (automatique)
- **Base de données**: Supabase (partagée avec dev)

## Workflow

### Development (Branche `main`)

1. **Travailler en local**
   ```bash
   # S'assurer d'être sur main
   git checkout main

   # Copier le fichier .env.development
   cp .env.development .env

   # Installer les dépendances
   pnpm install

   # Lancer le serveur de développement
   pnpm dev
   ```

2. **Effectuer les changements**
   - Faire les modifications du code
   - Tester localement

3. **Commiter sur main**
   ```bash
   git add .
   git commit -m "feature/fix: description"
   git push origin main
   ```

### Production (Branche `production`)

1. **Préparer une release**
   ```bash
   # Basculer sur production
   git checkout production

   # Copier le fichier .env.production
   cp .env.production .env

   # Mettre à jour depuis main
   git merge main
   ```

2. **Déployer**
   - Vercel détecte automatiquement les changements
   - Le déploiement se déclenche automatiquement
   - Monitorer les logs de déploiement

3. **Valider la production**
   - Vérifier que l'app fonctionne sur https://chronodil-app.vercel.app
   - Tester les fonctionnalités critiques

## Fichiers d'environnement

### `.env.development`
Utilisé en développement local. Contient:
- URLs localhost
- Configuration de développement
- NODE_ENV=development

### `.env.production`
Utilisé en production sur Vercel. Contient:
- URLs Vercel (https://chronodil-app.vercel.app)
- Configuration de production
- NODE_ENV=production

### `.env` (local, non versionné)
- Fichier ignoré par git pour des raisons de sécurité
- À copier depuis `.env.development` ou `.env.production` selon votre branche

## Notes importantes

- ⚠️ **Ne pas commiter `.env`** - C'est un fichier local
- 📝 **Commiter `.env.development` et `.env.production`** - Ce sont des templates configurés
- 🔐 **Les clés API** sont les mêmes dans les deux fichiers (partagent la même Supabase)
- 🚀 **Vercel** lira les variables depuis le dashboard Vercel et fera l'override si nécessaire
- 💾 **Base de données partagée** - Development et Production utilisent la même instance Supabase

## Procédure de déploiement

```bash
# 1. Développer et tester sur main
git checkout main
cp .env.development .env
pnpm dev
# ... développement ...
git add .
git commit -m "feature: nouvelle fonctionnalité"
git push origin main

# 2. Préparer la release
git checkout production
cp .env.production .env
git merge main
git push origin production

# 3. Vercel se charge du déploiement automatiquement
# - Les changements sont déployés sur https://chronodil-app.vercel.app
# - Les logs sont disponibles dans le dashboard Vercel
```

## Troubleshooting

### "Mon app ne fonctionne pas après le merge"
1. Vérifier que `.env` est correctement configuré
2. Vérifier que NODE_ENV est correct
3. Vérifier les logs Vercel

### "Les URLs sont cassées en production"
1. Vérifier `.env.production`
2. S'assurer que `BETTER_AUTH_URL` et `NEXT_PUBLIC_APP_URL` pointent vers la bonne URL
3. Vérifier la configuration Vercel

### "Je veux revenir à un ancien déploiement"
```bash
git log production --oneline
git revert <commit-hash>
git push origin production
```
