# Setup Checklist - Semantic Release Configuration

Checklist complète pour finir la configuration de semantic-release.

## Phase 1: Installation des Dépendances ✅

- [x] semantic-release installé
- [x] @semantic-release/changelog installé
- [x] @semantic-release/git installé
- [x] @semantic-release/github installé
- [x] commitlint installé
- [x] @commitlint/config-conventional installé

**Commande:**

```bash
pnpm install
```

## Phase 2: Configuration Locale ✅

- [x] .releaserc.json créé avec configuration complète
- [x] commitlint.config.cjs créé avec règles de validation
- [x] .husky/commit-msg créé (hook commitlint)
- [x] .husky/pre-commit créé (hook lint-staged)
- [x] .gitmessage créé (template de commit)
- [x] Git config configuré pour utiliser le template

**Vérifier:**

```bash
ls -la .releaserc.json
ls -la commitlint.config.cjs
ls -la .husky/
git config commit.template
```

## Phase 3: GitHub Actions ✅

- [x] .github/workflows/release.yml créé
- [x] Workflow configuré pour main, staging, develop
- [x] Jobs configurés: lint, test, build, release

**Vérifier:**

```bash
cat .github/workflows/release.yml
```

## Phase 4: Documentation ✅

- [x] docs/VERSIONING.md créé (guide complet)
- [x] docs/COMMIT_EXAMPLES.md créé (exemples pratiques)
- [x] docs/SEMANTIC_RELEASE_SETUP.md créé (setup détaillé)
- [x] docs/RELEASE_PROCESS.md créé (processus complet)
- [x] docs/README.md créé (index documentation)
- [x] docs/SETUP_CHECKLIST.md créé (ce fichier)

## Phase 5: Configuration GitHub (À FAIRE) ⚠️

### 5.1: Configurer Branch Rules

**Pour la branche `main`:**

1. Aller sur: https://github.com/your-org/chronodil-app/settings/branches
2. Cliquer "Add rule" si la règle n'existe pas
3. Pattern: `main`
4. Configurer:
   - [ ] Require a pull request before merging (1 approval)
   - [ ] Require status checks to pass before merging
   - [ ] Require branches to be up to date before merging
   - [ ] Require code owners review
   - [ ] Allow force pushes: OFF
   - [ ] Allow deletions: OFF

**Pour la branche `staging`:**

1. Pattern: `staging`
2. Configurer:
   - [ ] Require a pull request before merging (1 approval)
   - [ ] Require status checks to pass before merging
   - [ ] Require branches to be up to date before merging
   - [ ] Allow force pushes: OFF

**Pour la branche `develop`:**

1. Pattern: `develop`
2. Configurer:
   - [ ] Require a pull request before merging
   - [ ] Require status checks to pass before merging (optional)
   - [ ] Allow force pushes: OFF

### 5.2: Configurer Action Permissions

1. Aller sur: https://github.com/your-org/chronodil-app/settings/actions
2. Sous "Workflow permissions":
   - [ ] Select "Read and write permissions"
   - [ ] ✅ Allow GitHub Actions to create and approve pull requests

### 5.3: Vérifier les Secrets

Le token `GITHUB_TOKEN` est **automatiquement fourni**. Pas besoin de créer un
secret.

**Optional - Pour Slack notifications:**

1. Aller sur: https://github.com/your-org/chronodil-app/settings/secrets/actions
2. Cliquer "New repository secret"
3. Name: `SLACK_WEBHOOK_URL`
4. Value: Coller le webhook Slack
5. Cliquer "Add secret"

## Phase 6: Vérification Locale (À FAIRE) ⚠️

### 6.1: Valider le Setup

```bash
# Valider la configuration complète
pnpm validate:release

# Output attendu:
# ✅ All validations PASSED - Setup is complete!
```

### 6.2: Tester commitlint Localement

```bash
# Tester un message valide
echo "feat(test): test commit" | pnpm commitlint

# Tester un message invalide (doit rejeter)
echo "invalid message" | pnpm commitlint
```

### 6.3: Tester le Hook husky

```bash
# Créer un commit test (sans pousser)
git checkout -b test/semantic-release
echo "test" > test.txt
git add test.txt

# Tenter de committer avec message invalide (doit être rejeté)
git commit -m "invalid message"
# Output: ✖ Error in commit message

# Committer avec message valide (doit passer)
git commit -m "feat(test): test semantic release setup"
# Output: ✔ Commit message is valid
# Commit créé

# Annuler (ne pas pousser)
git reset HEAD~1
git checkout test.txt
git checkout main
git branch -D test/semantic-release
```

## Phase 7: Test du Workflow Complet (À FAIRE) ⚠️

### 7.1: Feature PR Test

```bash
# Créer une feature branch
git checkout -b feature/test-release

# Faire un changement
echo "feature test" >> README.md

# Commit au format Conventional
git add .
git commit -m "feat(test): test semantic release workflow"

# Vérifier le hook passe
# Output: ✔ Commit message is valid

# Push et créer une PR
git push origin feature/test-release
# Créer une PR manuellement sur GitHub vers develop
```

### 7.2: Review et Merge

1. Sur GitHub:
   - Attendre les CI checks (doivent passer)
   - Demander une review
   - Merger la PR

2. GitHub Actions se déclenche automatiquement:
   - Workflow `release.yml` s'exécute
   - semantic-release crée une beta release

### 7.3: Vérifier la Release

```bash
# Pull les tags
git fetch --tags

# Voir la nouvelle release
git tag | tail -5

# Voir les détails
git show v0.2.0-beta.1
```

## Phase 8: Documentation Équipe (À FAIRE) ⚠️

- [ ] Partager le lien vers docs/VERSIONING.md avec l'équipe
- [ ] Partager le lien vers docs/COMMIT_EXAMPLES.md
- [ ] Vérifier que tous ont accès au repository
- [ ] Vérifier que les hooks husky fonctionnent pour tous

## Phase 9: Configuration CI/CD (À FAIRE) ⚠️

### 9.1: Vérifier le Workflow release.yml

```bash
# Vérifier que le workflow est valide
cd .github/workflows
cat release.yml | head -50
```

### 9.2: Configurer les Status Checks

1. Aller sur: https://github.com/your-org/chronodil-app/settings/branches
2. Pour chaque branche, ajouter les required status checks:
   - [ ] `build` workflow
   - [ ] `test` workflow
   - [ ] `lint` workflow
   - [ ] `release` workflow (optional)

## Phase 10: Slack Notifications (Optional) ⚠️

Si vous voulez les notifications Slack:

### 10.1: Créer l'App Slack

1. Aller sur: https://api.slack.com/apps
2. "Create New App" → "From scratch"
3. Name: "Chronodil Releases"
4. Workspace: Sélectionner votre workspace
5. Cliquer "Create App"

### 10.2: Activer Incoming Webhooks

1. Dans l'app, aller sur "Incoming Webhooks"
2. Activer: ON
3. "Add New Webhook to Workspace"
4. Sélectionner le channel: #releases (ou créer)
5. "Allow"
6. Copier l'URL du webhook

### 10.3: Ajouter le Secret GitHub

```bash
# Via GitHub CLI (rapide)
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/..."

# Ou manuellement sur GitHub Settings
```

### 10.4: Vérifier le Workflow

Le workflow release.yml inclut déjà les notifications. Aucune modification
nécessaire.

## Phase 11: Documentation Finale (À FAIRE) ⚠️

- [ ] README.md mis à jour avec lien vers docs/VERSIONING.md
- [ ] CONTRIBUTING.md créé avec guide pour les commits
- [ ] Lien vers SEMANTIC_RELEASE_SETUP.md dans les ressources
- [ ] Équipe informée du nouveau processus

## Phase 12: Monitoring et Maintenance (À FAIRE) ⚠️

- [ ] Surveiller les releases créées chaque semaine
- [ ] Vérifier que CHANGELOG.md est à jour
- [ ] Vérifier que les commits sont au bon format
- [ ] Mettre à jour les versions des dépendances semantic-release

## Commandes Essentielles

```bash
# Valider le setup
pnpm validate:release

# Tester commitlint
echo "feat(test): message" | pnpm commitlint

# Créer une release manuellement (rare!)
GITHUB_TOKEN=xxx pnpm release --dry-run

# Voir les tags localement
git tag

# Voir les releases GitHub
gh release list

# Voir les commits depuis le dernier tag
git log v1.0.0..HEAD --oneline
```

## Troubleshooting

### "The workflow file is invalid"

Vérifier la syntaxe YAML du fichier `.github/workflows/release.yml`

```bash
# Valider le YAML
cat .github/workflows/release.yml | head -50
```

### "Permission denied" on push

Vérifier les permissions dans le workflow:

```yaml
permissions:
  contents: write
  issues: write
  pull-requests: write
```

### "No commits to release"

Les commits ne suivent pas le format Conventional Commits:

```bash
git log --oneline -5
# Chaque ligne doit être: "type(scope): message"
```

## Prochaines Étapes

1. ✅ Configuration complète (ce document)
2. ⏳ Test du premier workflow
3. ⏳ Formation équipe aux Conventional Commits
4. ⏳ Ajuster les règles de branch si besoin
5. ⏳ Ajouter les notifications Slack

## Support

Pour toute question:

1. Consulter docs/VERSIONING.md
2. Consulter docs/SEMANTIC_RELEASE_SETUP.md
3. Consulter docs/COMMIT_EXAMPLES.md
4. Contacter @devops-release

---

**Last Updated:** 2026-01-22 **Status:** Ready for testing **Next Step:** Run
validation and test workflow
