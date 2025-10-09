# Migration de npm vers pnpm

Ce guide vous aide à migrer le projet de npm vers pnpm.

## 🚀 Installation de pnpm

### Option 1 : Via npm (recommandé pour Windows)

```bash
npm install -g pnpm
```

### Option 2 : Via Corepack (Node.js 16.13+)

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Option 3 : Via script PowerShell (Windows)

```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

## 📦 Migration du projet

### Étape 1 : Supprimer les fichiers npm

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json
```

### Étape 2 : Installer avec pnpm

```bash
pnpm install
```

### Étape 3 : Vérifier que tout fonctionne

```bash
# Lancer le projet
pnpm dev

# Build du projet
pnpm build
```

## 🔄 Équivalences des commandes

| npm                          | pnpm                      |
|------------------------------|---------------------------|
| `npm install`                | `pnpm install`            |
| `npm install <package>`      | `pnpm add <package>`      |
| `npm install -D <package>`   | `pnpm add -D <package>`   |
| `npm uninstall <package>`    | `pnpm remove <package>`   |
| `npm run <script>`           | `pnpm <script>`           |
| `npm update`                 | `pnpm update`             |
| `npm list`                   | `pnpm list`               |
| `npx <command>`              | `pnpm dlx <command>`      |

## 📝 Scripts du projet

Tous les scripts du projet fonctionnent maintenant avec `pnpm` :

```bash
# Développement
pnpm dev

# Build
pnpm build

# Production
pnpm start

# Linter
pnpm lint

# Base de données
pnpm db:migrate      # Migrations
pnpm db:seed         # Seed
pnpm db:studio       # Prisma Studio
```

## ⚙️ Configuration

Le fichier `.npmrc` a été créé avec les configurations optimales pour pnpm :

- `shamefully-hoist=true` : Compatibilité avec certains packages
- `strict-peer-dependencies=false` : Évite les erreurs de peer dependencies
- `auto-install-peers=true` : Installe automatiquement les peer dependencies

## 🎯 Avantages de pnpm

### Performances
- ⚡ **3x plus rapide** que npm pour l'installation
- 💾 **Économie d'espace disque** : Stockage centralisé des packages

### Sécurité
- 🔒 **Meilleure isolation** : Les packages n'accèdent qu'à leurs dépendances déclarées
- ✅ **Vérification stricte** : Détecte les dépendances manquantes

### Developer Experience
- 📦 **Gestion de workspaces** : Parfait pour les monorepos
- 🎨 **Meilleure lisibilité** : Structure de node_modules plus claire

## 🐛 Dépannage

### Erreur "pnpm: command not found"

Si pnpm n'est pas reconnu après l'installation :

**Windows :**
```bash
# Redémarrer le terminal ou ajouter pnpm au PATH
$env:Path += ";$env:LOCALAPPDATA\pnpm"
```

**Linux/Mac :**
```bash
# Recharger le shell
source ~/.bashrc  # ou ~/.zshrc
```

### Erreur de peer dependencies

Si vous rencontrez des erreurs de peer dependencies :

```bash
# Option 1 : Utiliser --force
pnpm install --force

# Option 2 : Modifier .npmrc
echo "auto-install-peers=true" >> .npmrc
pnpm install
```

### Conflits de cache

Pour nettoyer complètement :

```bash
# Supprimer le cache pnpm
pnpm store prune

# Supprimer et réinstaller
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📚 Ressources

- [Documentation officielle pnpm](https://pnpm.io/)
- [Migration depuis npm](https://pnpm.io/installation#using-npm)
- [Comparaison des gestionnaires de packages](https://pnpm.io/benchmarks)

## ✅ Vérification de la migration

Pour vérifier que la migration est réussie :

```bash
# 1. Vérifier la version de pnpm
pnpm --version

# 2. Vérifier que les dépendances sont installées
pnpm list

# 3. Lancer le projet
pnpm dev

# 4. Exécuter les tests (si disponibles)
pnpm test
```

Si toutes ces commandes fonctionnent, la migration est réussie ! 🎉

## 🔙 Retour à npm (si nécessaire)

Si vous souhaitez revenir à npm :

```bash
# Supprimer les fichiers pnpm
rm -rf node_modules pnpm-lock.yaml .npmrc

# Réinstaller avec npm
npm install
```
