# Système de Versioning Automatique

Chronodil utilise **semantic-release** pour automatiser complètement le
versioning et les releases.

## Vue d'ensemble

Le processus de release est entièrement automatisé via GitHub Actions:

1. **Analyse des commits** - Analyse tous les commits depuis la dernière release
2. **Détermination de la version** - Calcule le prochain numéro de version
3. **Génération du CHANGELOG** - Crée automatiquement les notes de release
4. **Création de la release** - Publie sur GitHub avec les tags Git
5. **Notification** - Notifie via Slack (optional)

## Format des Commits (Conventional Commits)

**Tous les commits DOIVENT suivre le format Conventional Commits:**

```
type(scope): description

body (optional)

footer (optional)
```

### Types de Commit

| Type       | Impact    | Exemple                          | Description                 |
| ---------- | --------- | -------------------------------- | --------------------------- |
| `feat`     | **MINOR** | `feat(auth): add OAuth Google`   | Nouvelle fonctionnalité     |
| `fix`      | **PATCH** | `fix(chat): resolve memory leak` | Correction de bug           |
| `perf`     | **PATCH** | `perf(db): optimize queries`     | Amélioration performance    |
| `docs`     | ❌ Aucun  | `docs: update README`            | Documentation               |
| `style`    | ❌ Aucun  | `style: format code`             | Formatage (sans changement) |
| `refactor` | ❌ Aucun  | `refactor: extract component`    | Refactoring                 |
| `test`     | ❌ Aucun  | `test: add unit tests`           | Tests                       |
| `build`    | ❌ Aucun  | `build: update deps`             | Build system                |
| `ci`       | ❌ Aucun  | `ci: update workflows`           | CI/CD                       |
| `chore`    | ❌ Aucun  | `chore: update deps`             | Maintenance                 |

### Breaking Changes

Pour indiquer un **breaking change** (version MAJEURE):

```
feat(api)!: migrate to v2 endpoints

BREAKING CHANGE: All v1 endpoints removed.
Clients must update to use new /v2/* endpoints.
```

Ou avec le footer:

```
feat(auth): refactor token structure

BREAKING CHANGE: Token format has changed from JWT to opaque tokens.
```

### Examples de Commits Valides

```bash
# Nouvelle fonctionnalité
git commit -m "feat(dashboard): add real-time analytics"

# Correction de bug avec scope
git commit -m "fix(notifications): resolve delivery failures"

# Performance avec corps détaillé
git commit -m "perf(queries): optimize user lookup

- Added composite indexes on userId and date
- Reduced query time by 50%"

# Breaking change
git commit -m "feat(api)!: migrate authentication to OAuth2

BREAKING CHANGE: Basic auth no longer supported"

# Multi-ligne
git commit -m "feat(chat): add message encryption

- Implemented end-to-end encryption
- Added encryption key rotation
- Updated message schema

Closes #123"
```

## Versioning Sémantique

Format: `MAJOR.MINOR.PATCH[-PRERELEASE]`

### Règles de Bump

| Branche     | Préfixe | Exemple          | Règle                          |
| ----------- | ------- | ---------------- | ------------------------------ |
| `main`      | (aucun) | `v1.2.3`         | Production - pas de prérelease |
| `staging`   | `rc`    | `v1.2.3-rc.1`    | Release Candidate              |
| `develop`   | `beta`  | `v1.2.3-beta.1`  | Beta/Development               |
| `feature/*` | `alpha` | `v1.2.3-alpha.1` | Alpha/Experimental             |

### Calcul du Numéro de Version

- **Breaking Changes** → Incrémente **MAJOR** (ex: 1.2.3 → 2.0.0)
- **feat commits** → Incrémente **MINOR** (ex: 1.2.3 → 1.3.0)
- **fix/perf commits** → Incrémente **PATCH** (ex: 1.2.3 → 1.2.4)
- **Autres commits** → Pas de release (docs, style, test, etc.)

## Branches et Stratégie de Release

### 1. Branch `main` (Production)

Environnement: **Production**

```bash
# Merge depuis PR avec commits valides
feat(payment): add Stripe integration  # → v1.5.0
fix(checkout): resolve tax calculation # → v1.5.1
```

**Release immédiate:** Les commits sont analysés et une release est créée
instantanément.

### 2. Branch `staging` (Pre-Production)

Environnement: **Staging/QA**

```bash
# Prereleases Release Candidate (rc)
feat(notifications): websocket support  # → v2.0.0-rc.1
fix(ui): button alignment              # → v2.0.0-rc.2
```

**Use case:** Tester les futures versions avant production.

### 3. Branch `develop` (Development)

Environnement: **Development**

```bash
# Prereleases Beta
feat(dashboard): add new widgets       # → v2.1.0-beta.1
refactor: improve performance          # → Aucune release (type non impactant)
```

**Use case:** Intégration continue des features.

### 4. Branches `feature/*` (Feature Branches)

Environnement: **Sandbox**

```bash
# Prereleases Alpha (pas de channel)
feat(experimental): new auth system    # → v3.0.0-alpha.1
```

**Note:** Les alpha releases ne sont pas versionnées (pas de tag, pas de GitHub
Release).

## Configuration GitHub Actions

### Secret Requis

```yaml
GITHUB_TOKEN # Automatiquement fourni par GitHub Actions
```

### Optional - Slack Notification

Pour activer les notifications Slack:

```yaml
SLACK_WEBHOOK_URL # Webhook Slack pour les notifications
```

## Workflow de Commit et Push

### Étape 1: Vérifier le Format du Commit

Les commits sont **validés localement** via husky + commitlint:

```bash
# ✅ Valide
git commit -m "feat(auth): add two-factor authentication"

# ❌ Rejeté - type invalide
git commit -m "new: add feature"

# ❌ Rejeté - pas de scope
git commit -m "feat: add feature"

# ❌ Rejeté - majuscule au début
git commit -m "feat(auth): Add feature"
```

### Étape 2: Pousser sur GitHub

```bash
git push origin feature/my-feature
# Créer une PR vers main/staging/develop
```

### Étape 3: Review et Merge

```bash
# Après approbation, merge sur main/staging/develop
git merge --squash feature/my-feature  # Optional
git push origin main
```

### Étape 4: Automatic Release

GitHub Actions se déclenche automatiquement:

1. Analyse les commits depuis la dernière release
2. Calcule la version suivante
3. Génère le CHANGELOG.md
4. Crée un tag Git et une GitHub Release
5. Notifie Slack (si configuré)

## Commit Lint Setup Local

### Installation (Première Fois)

```bash
# Les dépendances sont déjà dans package.json
pnpm install

# Initialiser husky hooks
pnpm prepare

# Vérifier les hooks
ls -la .husky/
# - commit-msg (validation commitlint)
# - pre-commit (lint-staged)
```

### Validation Manuelle

```bash
# Vérifier un message de commit
echo "feat(auth): add OAuth" | pnpm commitlint

# Test complet
pnpm commitlint --from HEAD~5 --to HEAD
```

## Fichiers de Configuration

### `.releaserc.json`

Configuration principal de semantic-release:

- **Branches:** main, staging, develop, feature/\*
- **Plugins:** commit-analyzer, release-notes-generator, changelog, git, github
- **Release rules:** Types de commits → Bump de version

### `commitlint.config.cjs`

Configuration commitlint:

- **Enum de types:** feat, fix, perf, docs, style, refactor, test, build, ci,
  chore, revert
- **Case rules:** lowercase pour type et subject
- **Body/footer rules:** Blank lines obligatoires

### `.husky/commit-msg`

Hook husky qui exécute commitlint avant de valider le commit.

### `.husky/pre-commit`

Hook husky qui exécute lint-staged avant de committer.

### `.github/workflows/release.yml`

Workflow GitHub Actions qui:

1. Vérifie les conditions de déclenchement (branche et commits)
2. Installe les dépendances
3. Exécute les tests
4. Lance semantic-release
5. Notifie Slack

## Cas d'Usage Courants

### Créer une Feature Mineure

```bash
git checkout -b feature/new-widget
# ... faire des changements ...
git add .
git commit -m "feat(dashboard): add revenue widget"
git push origin feature/new-widget
# Créer une PR et merger
# → Automatiquement: v1.5.0
```

### Corriger un Bug

```bash
git checkout -b bugfix/auth-timeout
# ... corriger le bug ...
git add .
git commit -m "fix(auth): resolve session timeout issue"
git push origin bugfix/auth-timeout
# Créer une PR et merger
# → Automatiquement: v1.4.2
```

### Release Candidate Avant Production

```bash
# Merger feature PR dans staging
git checkout staging
git merge feature/big-feature
git push origin staging
# → Automatiquement: v2.0.0-rc.1

# Tester en staging
# Si OK, merger dans main
git checkout main
git merge staging
git push origin main
# → Automatiquement: v2.0.0
```

### Breaking Change (Maj Version)

```bash
# Feature qui casse la compatibilité
git commit -m "feat(api)!: migrate to GraphQL

BREAKING CHANGE: REST API endpoints removed.
All clients must migrate to GraphQL."
# → Automatiquement: v2.0.0 (MAJOR bump)
```

## Dépannage

### Les commits ne sont pas releasés?

**Cause probable:** Commits ne suivent pas le format Conventional Commits.

```bash
# Vérifier les commits depuis la dernière release
git log --oneline v1.0.0..HEAD

# Vérifier manuellement avec commitlint
echo "Your commit message" | pnpm commitlint

# Erreur? Le commit sera ignoré et aucune release ne sera créée
```

### Prérelease non traitée comme release finale?

**Cause:** La branche n'est pas `main` ou les commits ne sont pas correctement
typés.

```bash
# S'assurer que vous êtes sur main
git branch

# Vérifier la configuration .releaserc.json
cat .releaserc.json | jq '.branches'
```

### Hook commitlint bloque les commits?

```bash
# Vérifier le hook
cat .husky/commit-msg

# Tester directement
echo "votre message" | pnpm commitlint

# Si erreur, corriger le message avec le format Conventional Commits
```

## Références

- **Conventional Commits:** https://www.conventionalcommits.org/
- **Semantic Release:** https://github.com/semantic-release/semantic-release
- **Commit Lint:** https://commitlint.js.org/
- **Husky:** https://husky.sh/

## Migration depuis Ancienne Versioning

Si le projet utilisait manuellement le versioning (git tags):

```bash
# Les anciennes releases restent intactes
# semantic-release analysera tous les commits depuis le dernier tag

# Important: S'assurer que les messages de commit sont au format Conventional
# Sinon, semantic-release les ignorera
```

## FAQ

**Q: Qui peut créer une release?** R: Uniquement les commits pushés sur les
branches protégées (main, staging, develop). Tout développeur peut contribuer
via des PRs.

**Q: Quelle est la fréquence idéale de release?** R: Autant que possible! Avec
semantic-release, les releases sont gratuites. Pousser souvent réduit la taille
des changements par release.

**Q: Peut-on ignorer un commit pour la release?** R: Oui, en utilisant des types
non-impactants (docs, style, test, refactor, build, ci, chore).

**Q: Que faire si un commit était invalide et a bloqué la release?** R: Créer un
nouveau commit qui corrige le problème. La prochaine release incluera le fix.

**Q: Peut-on créer une release manuellement?** R: Non recommandé. Laissez
semantic-release automatiser. Les tags manuels peuvent causer des conflits.
