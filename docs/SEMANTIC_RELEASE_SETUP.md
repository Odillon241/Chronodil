# Setup Semantic Release - Guide Complet

Guide d'installation et de configuration de semantic-release pour Chronodil.

## Table des Matières

1. [Installation Automatique](#installation-automatique)
2. [Vérification du Setup](#vérification-du-setup)
3. [Configuration GitHub](#configuration-github)
4. [Configuration Slack (Optional)](#configuration-slack-optional)
5. [Test du Workflow](#test-du-workflow)
6. [Troubleshooting](#troubleshooting)

## Installation Automatique

### Étape 1: Installer les Dépendances

```bash
cd /path/to/chronodil-app

# Installer semantic-release et plugins
pnpm install

# Vérifier que tout est installé
pnpm ls semantic-release
pnpm ls @semantic-release/changelog
pnpm ls @semantic-release/git
```

### Étape 2: Initialiser Husky Hooks

```bash
# Initialiser husky avec les hooks
pnpm prepare

# Vérifier les hooks sont créés
ls -la .husky/
# Doit montrer:
# - commit-msg (commitlint validation)
# - pre-commit (lint-staged)
```

### Étape 3: Vérifier les Fichiers de Configuration

```bash
# Vérifier que tous les fichiers sont en place
ls -l .releaserc.json
ls -l commitlint.config.cjs
ls -l .husky/commit-msg
ls -l .husky/pre-commit
ls -l .github/workflows/release.yml
ls -l .github/CODEOWNERS
```

## Vérification du Setup

### Test 1: Validate commitlint Configuration

```bash
# Tester un commit valide
echo "feat(test): this is a valid commit" | pnpm commitlint

# Output doit être vide (succès) ou "No commits found"

# Tester un commit invalide
echo "this is invalid" | pnpm commitlint

# Output doit montrer l'erreur:
# ✖   subject may not be empty [subject-empty]
```

### Test 2: Validate Release Configuration

```bash
# Vérifier la config semantic-release
cat .releaserc.json | jq '.branches'

# Output attendu:
# [
#   {
#     "name": "main",
#     "prerelease": false
#   },
#   {
#     "name": "staging",
#     "prerelease": "rc"
#   },
#   {
#     "name": "develop",
#     "prerelease": "beta"
#   }
# ]
```

### Test 3: Dry Run (Simule une Release)

```bash
# Simuler une release sans créer de tag
GITHUB_TOKEN=your_token pnpm release --dry-run

# Cela va afficher:
# - Numéro de version détecté
# - Notes de release
# - Fichiers qui seraient modifiés
# - SANS créer de tag ni push
```

## Configuration GitHub

### Étape 1: Configurer les Branch Rules

1. Aller sur: `https://github.com/your-org/chronodil-app/settings/branches`

2. Créer ou modifier les règles pour les branches protégées:

**Pour `main` (Production):**

- ✅ Require a pull request before merging
- ✅ Require approvals (1 review minimum)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require code owners review
- ✅ Allow force pushes: **OFF**

**Pour `staging` (Pre-Production):**

- ✅ Require a pull request before merging
- ✅ Require approvals (1 review minimum)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

**Pour `develop` (Development):**

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ⚠️ Approvals: Optional (accélère le dev)

### Étape 2: Vérifier le Token GITHUB_TOKEN

Le token `GITHUB_TOKEN` est **automatiquement fourni** par GitHub Actions:

```yaml
# Dans release.yml, c'est déjà configuré:
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Permissions requises** (déjà configurées dans release.yml):

```yaml
permissions:
  contents: write # Push commits et tags
  issues: write # Update issues
  pull-requests: write # Update PRs
  packages: write # Publish packages (optional)
```

### Étape 3: Configurer Action Permissions

1. Aller sur: `https://github.com/your-org/chronodil-app/settings/actions`

2. Sous "Workflow permissions":
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## Configuration Slack (Optional)

Pour activer les notifications Slack:

### Étape 1: Créer un Webhook Slack

1. Aller sur: https://api.slack.com/apps
2. Créer une nouvelle app ou sélectionner une existante
3. Aller sur "Incoming Webhooks"
4. Créer un nouveau webhook pour le canal #releases
5. Copier l'URL du webhook

### Étape 2: Ajouter le Secret GitHub

1. Aller sur:
   `https://github.com/your-org/chronodil-app/settings/secrets/actions`
2. Cliquer "New repository secret"
3. Nom: `SLACK_WEBHOOK_URL`
4. Valeur: Coller l'URL du webhook

### Étape 3: Vérifier le Workflow

```yaml
# Le workflow release.yml inclut déjà les notifications:
- name: Notify Slack on release
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Test du Workflow

### Test 1: Commit sur Branch de Feature

```bash
# Créer une feature branch
git checkout -b feature/test-release

# Faire un changement
echo "test" >> README.md
git add README.md

# Commit avec format valide
git commit -m "feat(test): test release workflow"

# Verifier le hook commitlint passe
# Output: ✔ Commit message is valid

# Push et créer une PR
git push origin feature/test-release
# Créer une PR manuellement sur GitHub
```

### Test 2: Review et Merge sur Main

```bash
# Après approbation sur GitHub, merger la PR
# Le workflow release.yml se déclenche automatiquement

# Vérifier le workflow
# Aller sur: Actions → Release → Workflow run
```

### Test 3: Vérifier la Release

Après le merge sur `main`:

1. GitHub Actions exécute `release.yml`
2. Semantic-release analyze les commits
3. Crée un tag Git et une GitHub Release
4. Génère CHANGELOG.md
5. Notifie Slack (si configuré)

Vérifier:

```bash
# Pull les nouveaux tags
git fetch --tags

# Voir les releases
git tag
# Output:
# v0.1.0
# v0.2.0
# v0.2.1

# Voir les GitHub Releases
# https://github.com/your-org/chronodil-app/releases
```

## Troubleshooting

### Erreur: "Permission denied" pour Git Push

**Cause:** Token GitHub n'a pas les bonnes permissions.

**Solution:**

1. Vérifier `GITHUB_TOKEN` dans release.yml
2. Vérifier les permissions du workflow:
   ```yaml
   permissions:
     contents: write
   ```

### Erreur: "No commits to release"

**Cause:** Les commits ne suivent pas le format Conventional Commits.

**Solution:**

```bash
# Vérifier le format des commits
git log --oneline main..HEAD

# Chaque commit doit être:
# feat(...): description
# fix(...): description
# perf(...): description
```

### Erreur: "commitlint hook rejected commit"

**Cause:** Le message du commit n'est pas au format Conventional Commits.

**Solution:**

```bash
# Corriger le format
git commit --amend -m "feat(scope): proper description"

# Sans point à la fin, avec scope, lowercase
```

### Le Workflow Ne Se Déclenche Pas

**Cause:** Le push n'est pas sur une branche surveillée (main, staging,
develop).

**Solution:**

```bash
# Vérifier la branche
git branch

# Le workflow ne s'active que sur:
# - main (production release)
# - staging (RC release)
# - develop (beta release)

# Pour les branches feature, créer une PR d'abord
```

### CHANGELOG.md Ne S'Est Pas Mis à Jour

**Cause:** Le plugin `@semantic-release/changelog` n'a pas généré le fichier.

**Solution:**

```bash
# Vérifier que le plugin est présent
pnpm ls @semantic-release/changelog

# Vérifier la config .releaserc.json
cat .releaserc.json | jq '.plugins[] | select(.[0] == "@semantic-release/changelog")'

# Vérifier que CHANGELOG.md est dans .git/config
git config -l | grep -i changelog
```

### Erreur: "fatal: no tag found"

**Cause:** C'est la première release, pas de tag antérieur.

**Solution:** C'est normal! Semantic-release créera le premier tag
automatiquement.

## Commandes Utiles

```bash
# Installer toutes les dépendances
pnpm install

# Initialiser les hooks husky
pnpm prepare

# Vérifier les hooks sont en place
ls -la .husky/

# Tester commitlint localement
echo "feat(test): message" | pnpm commitlint

# Simuler une release (dry-run)
GITHUB_TOKEN=xxx pnpm release --dry-run

# Créer une release manuellement (rare!)
GITHUB_TOKEN=xxx pnpm release

# Voir les releases créées
git tag
git log --oneline --all --graph
```

## Vérification Finale

### Checklist Complète

- [ ] Dependencies installées: `pnpm ls semantic-release`
- [ ] Fichier `.releaserc.json` présent
- [ ] Fichier `commitlint.config.cjs` présent
- [ ] Hooks husky initialisés: `ls -la .husky/`
- [ ] Workflow GitHub Actions: `.github/workflows/release.yml`
- [ ] CODEOWNERS configuré: `.github/CODEOWNERS`
- [ ] Branch rules configurées pour `main`
- [ ] GITHUB_TOKEN permissions vérifiées
- [ ] Slack webhook configuré (optional)
- [ ] Premier commit test au format Conventional Commits
- [ ] Merge sur `main` pour déclencher le workflow

### Test Final

```bash
# Créer une feature branch
git checkout -b feature/test-semver

# Faire un changement
echo "test release" >> README.md

# Commit au format Conventional Commits
git add .
git commit -m "feat(test): verify semantic release setup"

# Vérifier le hook
# Output: ✔ Commit message is valid

# Push et créer une PR
git push origin feature/test-semver

# Merger après review
# Le workflow release.yml se déclenche automatiquement

# Vérifier dans Actions → Release
# Vérifier la GitHub Release créée
# Vérifier CHANGELOG.md mis à jour
# Vérifier le tag Git créé
```

Si tout fonctionne, le setup est complet!

## Références

- [Semantic Release - Official Docs](https://github.com/semantic-release/semantic-release/blob/master/README.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint - Official Docs](https://commitlint.js.org/)
- [GitHub Actions - Official Docs](https://docs.github.com/en/actions)
