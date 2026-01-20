# Release Process - Processus de Release Automatisé

Documentation complète du processus de release automatisé avec semantic-release.

## Vue d'ensemble du Workflow

```
Developer Push → GitHub Actions → Semantic Release → GitHub Release + CHANGELOG
     ↓              ↓                    ↓                      ↓
Commit avec     Analyse les       Calcule version        Notifie Slack
conventional   commits depuis     + génère notes        (optional)
commits        dernière release   + update files
```

## Chemins des Releases (Release Channels)

### Production (Branch: `main`)

Environnement: **PRODUCTION**

```
main branch
    ↓
GitHub Actions: release.yml déclenché
    ↓
Semantic-release analyse les commits
    ↓
Version = MAJOR.MINOR.PATCH
    ↓
Crée un tag: v1.2.3
    ↓
Crée une GitHub Release
    ↓
Update CHANGELOG.md
    ↓
Push des modifications
```

**Exemple:**

```
v1.0.0 (initial)
    ↓ feat commit
v1.1.0 (minor feature added)
    ↓ fix commit
v1.1.1 (patch fix)
    ↓ feat + fix commits
v1.2.0 (minor + patch combined)
    ↓ feat(api)! breaking change
v2.0.0 (major version bump)
```

### Staging (Branch: `staging`)

Environnement: **STAGING/QA**

```
staging branch
    ↓
GitHub Actions: release.yml déclenché
    ↓
Semantic-release crée une PRERELEASE
    ↓
Version = MAJOR.MINOR.PATCH-rc.N
    ↓
Crée un tag: v1.2.0-rc.1
    ↓
Crée une GitHub Release (marked as pre-release)
    ↓
Update CHANGELOG.md
```

**Exemple:**

```
v1.2.0-rc.1 (première RC)
    ↓ fix commit
v1.2.0-rc.2 (deuxième RC)
    ↓ merge to main
v1.2.0 (final release)
```

### Development (Branch: `develop`)

Environnement: **DEVELOPMENT**

```
develop branch
    ↓
GitHub Actions: release.yml déclenché
    ↓
Semantic-release crée une BETA RELEASE
    ↓
Version = MAJOR.MINOR.PATCH-beta.N
    ↓
Crée un tag: v1.2.0-beta.1
    ↓
Crée une GitHub Release (marked as pre-release)
```

**Exemple:**

```
v2.0.0-beta.1 (première beta pour v2)
    ↓ feat commits
v2.0.0-beta.2
    ↓ feat commits
v2.0.0-beta.3
    ↓ merge to staging for RC testing
```

## Workflow Typique: De la Feature à Production

### Étape 1: Créer une Feature Branch

```bash
# Partir de develop
git checkout develop
git pull origin develop

# Créer une feature branch
git checkout -b feature/my-feature
```

### Étape 2: Développer la Feature

```bash
# Faire des changements
# ... edit files ...

# Commit avec format Conventional Commits
git add .
git commit -m "feat(scope): add my feature"

# Le hook commitlint valide le format
# Si invalide, le commit est rejeté
```

### Étape 3: Pousser et Créer une PR

```bash
# Push vers GitHub
git push origin feature/my-feature

# Créer une PR sur GitHub:
# - Base: develop
# - Compare: feature/my-feature
# - Description: Expliquer la feature
```

### Étape 4: Review et Approval

Sur GitHub:

- Code review par @director-review
- Tests doivent passer (GitHub Actions)
- Vérifier le format des commits
- Approuver la PR

### Étape 5: Merge sur Develop

```bash
# Après approbation, merger sur GitHub
# GitHub Actions se déclenche automatiquement

# Le workflow release.yml:
# 1. Analyse les commits sur develop
# 2. Crée une BETA release (v1.2.0-beta.1)
# 3. Crée un tag Git et une GitHub Release
# 4. Notifie Slack
```

### Étape 6: Test en Développement

```bash
# Les développeurs testent la beta release
# Rapporter les bugs éventuels

# Si bugs, créer des fix:
git checkout develop
git pull origin develop
git checkout -b bugfix/my-bug
# ... fix ...
git commit -m "fix(scope): resolve bug"
git push origin bugfix/my-bug
# Créer PR et merger
# → Nouvelle beta release (v1.2.0-beta.2)
```

### Étape 7: Merger Develop → Staging

```bash
# Une fois stable, merger develop dans staging
git checkout staging
git pull origin staging

git merge develop
git push origin staging

# GitHub Actions crée une RC release:
# v1.2.0-rc.1
```

### Étape 8: Test en Staging

```bash
# QA tests en environnement staging
# Vérifier la RC fonctionne

# Si problèmes, fix sur develop:
git checkout develop
git checkout -b bugfix/critical-bug
# ... fix ...
git commit -m "fix(scope): critical fix"
git push && créer PR
# Merger develop → staging
# → Nouvelle RC release (v1.2.0-rc.2)
```

### Étape 9: Merger Staging → Main (Production Release)

```bash
# Une fois stable en staging, merger dans main
git checkout main
git pull origin main

git merge staging
git push origin main

# GitHub Actions crée la FINAL release:
# v1.2.0 (sans "-rc" ou "-beta")
# → Déploiement automatique en production!
```

## Gestion des Bugs Critiques (Hotfix)

Pour un bug en production qui nécessite une release urgente:

```bash
# Créer un hotfix depuis main
git checkout main
git pull origin main

git checkout -b hotfix/critical-bug

# Fixer le bug
# ... edit files ...
git add .
git commit -m "fix(scope): resolve critical production bug"

git push origin hotfix/critical-bug

# Créer une PR sur main
# → Review rapide
# → Merger sur main
# → GitHub Actions crée v1.2.1 (PATCH release)
# → Production updated immediately!
```

## Commits Bloquants (Qui N'Influencent Pas la Version)

Ces commits ne créent pas de release:

```bash
git commit -m "docs: update README"          # NO release
git commit -m "test: add unit tests"         # NO release
git commit -m "style: format code"           # NO release
git commit -m "refactor: extract component"  # NO release
git commit -m "build: update deps"           # NO release
git commit -m "ci: add workflow"             # NO release
git commit -m "chore: cleanup"               # NO release
```

**BUT:** Si vous avez aussi un `feat` ou `fix` dans d'autres commits, ils créent
une release qui inclut ces changements.

## Breaking Changes

Pour signaler un breaking change (MAJOR version bump):

```bash
# Option 1: Avec exclamation mark
git commit -m "feat(api)!: migrate to GraphQL

BREAKING CHANGE: All REST endpoints removed"

# Option 2: Avec footer
git commit -m "feat(auth): switch to OAuth2

BREAKING CHANGE: Basic auth no longer supported"

# Résultat: v1.0.0 → v2.0.0 (MAJOR bump!)
```

## Voir les Releases

### Localement

```bash
# Voir tous les tags
git tag

# Voir les détails d'un tag
git show v1.2.0

# Voir les commits d'une release
git log v1.1.0..v1.2.0

# Voir le graphe complet
git log --all --oneline --graph --decorate
```

### Sur GitHub

```
https://github.com/your-org/chronodil-app/releases
```

### CHANGELOG

```
Fichier: CHANGELOG.md (généré automatiquement)
```

## Gestion des Versions en Développement

### Avant Première Production Release

```
Version: 0.1.0 (development)
    ↓ features
0.2.0 (more features)
    ↓ features + fixes
0.3.0
    ↓ features + fixes
0.4.0
    ↓ stable enough
1.0.0 (first production release!)
```

### Versioning Semantic Après Production

```
v1.0.0 (stable production)
v1.1.0 (new features)
v1.1.1 (patch fix)
v1.2.0 (more features)
v2.0.0 (breaking change)
```

## Conventions et Best Practices

### 1. Un Commit = Une Unité Logique

```bash
# ❌ MAUVAIS - trop de changements
git commit -m "feat: add auth, fix bugs, update docs"

# ✅ BON - commits séparés
git commit -m "feat(auth): add OAuth"
git commit -m "fix(chat): resolve timeout"
git commit -m "docs: update guides"
```

### 2. Messages Clairs et Spécifiques

```bash
# ❌ MAUVAIS - vague
git commit -m "feat: stuff"
git commit -m "fix: various things"

# ✅ BON - clair
git commit -m "feat(notifications): add WebSocket support"
git commit -m "fix(auth): resolve session expiration bug"
```

### 3. Références aux Issues

```bash
# ✅ BON - référencer les issues
git commit -m "fix(payments): resolve Stripe error

Closes #789"

git commit -m "feat(dashboard): add analytics

Related to #456"
```

### 4. Squash Avant Merge (Optional)

Si vous avez des commits WIP, squashez avant merger:

```bash
# Faire plusieurs commits lors du développement
git commit -m "wip: feature in progress"
git commit -m "wip: more work"
git commit -m "wip: final adjustments"

# Avant de merger, squash en un seul commit:
git rebase -i main
# Marquer les 2e et 3e commits comme "squash"

# Réécrire le message
git commit -m "feat(scope): complete feature description"

# Merger
git push --force-with-lease origin feature/x
```

## Troubleshooting

### Les commits ne créent pas de release?

**Vérifier:**

1. Le format Conventional Commits: `type(scope): message`
2. Le type est `feat`, `fix`, ou `perf` (les autres ne créent pas de release)
3. Le commit est sur une branche de release (main, staging, develop)

```bash
git log --oneline -5
# Doit montrer:
# abc1234 feat(scope): description
# def5678 fix(scope): description
```

### La version est incorrecte?

**Vérifier:**

1. L'ordre des commits depuis la dernière release
2. S'il y a des breaking changes (devraient bumper MAJOR)
3. Le nombre de feat vs fix commits

```bash
# Voir ce qui serait releasé
GITHUB_TOKEN=xxx pnpm release --dry-run
```

### Comment rollback une release?

```bash
# Une release a été créée par erreur
# OPTION 1: Supprimer le tag et créer un nouveau commit

git tag -d v1.2.0
git push origin :refs/tags/v1.2.0

# Créer un revert commit
git revert v1.2.0
git push origin main

# La prochaine release aura le revert

# OPTION 2: Créer une nouvelle release avec les bonnes modifications
git commit -m "fix(scope): proper fix"
git push origin main
# → Nouvelle release créée avec le fix
```

## Objectifs DORA

Le processus de release automatisé vise les objectifs DORA Elite:

| Métrique             | Objectif          | Statut          |
| -------------------- | ----------------- | --------------- |
| Deployment Frequency | Multiple par jour | ✅ Automatisé   |
| Lead Time            | < 1 hour          | ✅ Instantané   |
| Change Failure Rate  | < 15%             | ⚠️ À monitoring |
| Time to Restore      | < 1 hour          | ⚠️ À monitoring |

## Références

- [Semantic Release](https://github.com/semantic-release/semantic-release)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [DORA Metrics](https://dora.dev/)
