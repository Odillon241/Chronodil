# Quick Start - Semantic Release

Guide rapide de 5 minutes pour commencer à utiliser semantic-release.

## Installation (1 minute)

```bash
# Installer les dépendances (déjà fait)
pnpm install

# Initialiser les hooks git
pnpm prepare

# Vérifier que tout fonctionne
pnpm validate:release
```

## Votre Premier Commit (2 minutes)

### Format Obligatoire

```bash
git commit -m "type(scope): description"
```

**Types importants:**

- `feat` → Nouvelle fonctionnalité (version bump)
- `fix` → Correction de bug (version bump)
- `perf` → Performance (version bump)
- `docs`, `test`, `refactor` → Pas de version bump
- `feat(...)!` → Breaking change (major version bump)

### Exemples Rapides

```bash
# ✅ VALIDE - Nouvelle feature
git commit -m "feat(auth): add OAuth provider"

# ✅ VALIDE - Bug fix
git commit -m "fix(chat): resolve message ordering"

# ✅ VALIDE - Performance
git commit -m "perf(db): optimize query with index"

# ✅ VALIDE - Breaking change
git commit -m "feat(api)!: migrate to GraphQL"

# ❌ INVALIDE - Pas de scope
git commit -m "feat: add feature"

# ❌ INVALIDE - Majuscule
git commit -m "feat(auth): Add feature"

# ❌ INVALIDE - Type inexistant
git commit -m "new(feature): something"
```

## Workflow Typique (2 minutes)

```bash
# 1. Créer une feature branch
git checkout -b feature/my-feature

# 2. Faire des changements
# ... edit files ...
git add .

# 3. Commit (validé automatiquement)
git commit -m "feat(scope): description"
# Si le format est mauvais, le commit est REJETÉ

# 4. Pousser
git push origin feature/my-feature

# 5. Créer une PR sur GitHub
# (Merger après review)

# 6. Release automatique!
# GitHub Actions crée v1.2.0 automatiquement
# CHANGELOG.md est mis à jour
# Slack est notifié
```

## Ce Qui Se Passe Automatiquement

Après chaque merge sur `main`:

1. **GitHub Actions se déclenche**
   - Analyse les commits
   - Calcule la version (major/minor/patch)

2. **Crée une release**
   - Tag Git: `v1.2.0`
   - GitHub Release page
   - CHANGELOG.md mis à jour

3. **Notifie**
   - Slack (si configuré)
   - Email (par défaut GitHub)

## Format des Commits - Rappel Rapide

```
type(scope): description

- Type: feat, fix, perf, docs, test, refactor, build, ci, chore, style
- Scope: feature name (auth, chat, tasks, notifications, etc)
- Description: lowercase, pas de point à la fin, max 50 caractères
```

## Problèmes Courants

### "commitlint rejected my commit"

Votre message n'est pas valide:

```bash
# ❌ Mauvais format
git commit -m "New feature"

# ✅ Bon format
git commit -m "feat(scope): description"
```

### "Hook: Permission denied"

```bash
chmod +x .husky/*
```

### "Qu'est-ce qui bump la version?"

| Action              | Résultat                     |
| ------------------- | ---------------------------- |
| `feat(...)` commit  | MINOR bump (v1.0.0 → v1.1.0) |
| `fix(...)` commit   | PATCH bump (v1.0.0 → v1.0.1) |
| `perf(...)` commit  | PATCH bump (v1.0.0 → v1.0.1) |
| `feat(...)!` commit | MAJOR bump (v1.0.0 → v2.0.0) |
| Autre commit        | Pas de release               |

## Besoin de Détails?

- **Questions générales:** Lire `docs/VERSIONING.md`
- **Exemples concrets:** Lire `docs/COMMIT_EXAMPLES.md`
- **Setup complet:** Lire `docs/SEMANTIC_RELEASE_SETUP.md`
- **Processus détaillé:** Lire `docs/RELEASE_PROCESS.md`

## Commandes Essentielles

```bash
# Valider le setup
pnpm validate:release

# Tester commitlint
echo "feat(test): message" | pnpm commitlint

# Voir les tags
git tag

# Voir les GitHub releases
gh release list

# Voir les commits depuis dernier tag
git log v1.0.0..HEAD --oneline
```

## Résumé

1. **Commit au format Conventional:** `type(scope): description`
2. **Le hook validate automatiquement**
3. **Après merge, GitHub Actions crée une release**
4. **Version bumpe automatiquement** (feat → minor, fix → patch)
5. **CHANGELOG et GitHub Release générés automatiquement**

C'est tout! Le reste est automatisé.

---

**Questions?** Consulter `docs/VERSIONING.md` ou `docs/COMMIT_EXAMPLES.md`
