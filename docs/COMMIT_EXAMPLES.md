# Exemples de Commits Conventional Commits

Guide pratique avec des exemples réels pour le projet Chronodil.

## Structure de Base

```
type(scope): description

body (optional)

footer (optional)
```

## Type: `feat` → Increment MINOR Version

### Nouvelle Feature Simple

```bash
git commit -m "feat(auth): add OAuth Google provider"
# Résultat: 1.2.0 → 1.3.0
```

### Feature avec Détails

```bash
git commit -m "feat(notifications): add push notification system

- Implement Service Worker for push handling
- Add VAPID key configuration
- Create PushSubscription model in database
- Integrate with Inngest for scheduled notifications"
```

### Feature avec Scope Spécifique

```bash
git commit -m "feat(dashboard): add real-time analytics widget

Features:
- Live user count updates via WebSocket
- Revenue chart with hourly data
- Custom date range filter"
```

### Feature avec Multiple Scopes (plusieurs commits)

```bash
git commit -m "feat(chat): add message reactions"
git commit -m "feat(chat): add message pinning"
git commit -m "feat(chat): add message forwarding"
# Chaque commit = 1 feat = 1 MINOR bump (mais semver les combine = 1 MINOR pour tous)
```

## Type: `fix` → Increment PATCH Version

### Correction Simple

```bash
git commit -m "fix(tasks): resolve task creation timeout"
# Résultat: 1.2.3 → 1.2.4
```

### Bug Fix avec Détails

```bash
git commit -m "fix(auth): resolve session expiration issue

Root cause: Session timeout was not being refreshed on page interaction.

Changes:
- Add activity listener to refresh session
- Extend session timeout from 30min to 1hour
- Add session refresh before logout redirect"
```

### Fix avec Issue Reference

```bash
git commit -m "fix(hr-timesheet): resolve duplicate activity creation

Closes #456

Root cause: addHRActivity was being called twice on form submission
due to React StrictMode double-mounting in development."
```

### Critical Bug Fix

```bash
git commit -m "fix(database): resolve connection pool exhaustion

This critical fix prevents the application from hanging.

Root cause: connection_limit=1 was insufficient for parallel queries
with Promise.all() on dashboard page.

Solution: Increased connection_limit to 10 in DATABASE_URL"
```

## Type: `perf` → Increment PATCH Version

### Performance Improvement Simple

```bash
git commit -m "perf(queries): add composite indexes for task filtering"
# Résultat: 1.2.3 → 1.2.4
```

### Performance with Metrics

```bash
git commit -m "perf(api): optimize user list endpoint

Performance improvements:
- Add database indexing on status and userId
- Implement cursor-based pagination
- Reduce query time from 500ms to 50ms
- Reduce payload size from 2MB to 200KB

Benchmark:
- Before: GET /users?limit=100 = 500ms
- After: GET /users?limit=100 = 50ms"
```

### Frontend Performance

```bash
git commit -m "perf(frontend): optimize React Component rendering

- Implement React.memo for TaskCard
- Add useMemo for expensive calculations
- Reduce re-renders from 15 → 3 per interaction
- Improve FCP from 3.2s → 1.8s"
```

## Type: `docs` → NO Release (informational only)

### Documentation Update

```bash
git commit -m "docs: update VERSIONING.md with examples"
# Résultat: Pas de release créée
```

### README Update

```bash
git commit -m "docs: add setup instructions for OAuth"
```

### API Documentation

```bash
git commit -m "docs: document payment API endpoints"
```

## Type: `test` → NO Release

### Add Unit Tests

```bash
git commit -m "test: add unit tests for userActions"
```

### Add Integration Tests

```bash
git commit -m "test: add E2E tests for chat flow

- Test creating new conversation
- Test sending and receiving messages
- Test user presence updates"
```

### Test Coverage Improvement

```bash
git commit -m "test: improve coverage for auth module

Added tests for:
- Session refresh logic
- Token validation
- Password reset flow"
```

## Type: `style` → NO Release

### Code Formatting

```bash
git commit -m "style: format code with prettier"
```

### Spacing and Whitespace

```bash
git commit -m "style: fix indentation in TaskForm"
```

## Type: `refactor` → NO Release

### Extract Component

```bash
git commit -m "refactor: extract TaskCard into separate component"
```

### Improve Code Structure

```bash
git commit -m "refactor: simplify authentication logic

- Extract password validation into utility function
- Reduce authentication service from 500 → 200 lines
- Improve readability with better naming"
```

### Database Query Optimization (No Behavior Change)

```bash
git commit -m "refactor: simplify Prisma query using include instead of separate queries"
```

## Type: `build` → NO Release

### Update Dependencies

```bash
git commit -m "build: update Next.js to 16.1.0"
```

### Update Build Config

```bash
git commit -m "build: optimize Turbopack configuration"
```

## Type: `ci` → NO Release

### GitHub Actions Update

```bash
git commit -m "ci: add workflow for running E2E tests on PR"
```

### CI Configuration

```bash
git commit -m "ci: configure semantic-release for automated versioning"
```

## Type: `chore` → NO Release

### Maintenance Task

```bash
git commit -m "chore: cleanup unused dependencies"
```

### Project Maintenance

```bash
git commit -m "chore: update git hooks configuration"
```

## Type: `revert` → PATCH Version

### Revert a Commit

```bash
git commit -m "revert: undo refactoring that introduced regression

This reverts commit abc1234.

Reason: The refactoring introduced a performance regression
in the task list rendering."
```

## BREAKING CHANGES → Increment MAJOR Version

### Breaking Change with Exclamation Mark

```bash
git commit -m "feat(api)!: migrate REST API to GraphQL

BREAKING CHANGE: All REST API endpoints removed.
Clients must migrate to the new GraphQL API.

Migration guide: https://docs.chronodil.com/migration-guide"
```

### Breaking Change in Footer

```bash
git commit -m "feat(auth): switch from JWT to opaque tokens

BREAKING CHANGE: Authentication tokens are no longer JWT format.
The token validation endpoint has been removed.
All clients must use the new /auth/verify endpoint."
```

### Multiple Breaking Changes

```bash
git commit -m "feat(data-model)!: refactor user and project schema

BREAKING CHANGE:
- User.role moved to UserMetadata table
- Project.status enum changed from [active, inactive] to [draft, active, archived]
- Removed deprecated Project.deletedAt field

Migration script: scripts/migrate-v2-schema.ts"
```

### Chained Breaking Changes

```bash
git commit -m "refactor(database)!: consolidate tables and change schema

BREAKING CHANGE: UserRole enum changed
- ADMIN → SYSTEM_ADMIN
- MANAGER → TEAM_LEAD
- USER → CONTRIBUTOR

BREAKING CHANGE: TaskStatus enum changed
- TODO → BACKLOG
- IN_PROGRESS → ACTIVE
- DONE → COMPLETED"
```

## Complex Examples

### Feature with Multiple Commits

```bash
# Commit 1
git commit -m "feat(payments): add Stripe integration

Add Stripe SDK and basic configuration"

# Commit 2
git commit -m "feat(payments): implement payment processing

Implement /api/payments/create endpoint"

# Commit 3
git commit -m "feat(payments): add payment webhook handler

Handle Stripe events: payment.success, payment.failed"

# Result: v1.5.0 (1 minor bump for all 3 features)
```

### Feature + Bug Fix in Same PR

```bash
# Feature commit
git commit -m "feat(chat): add message encryption"

# Bug fix commit (during implementation)
git commit -m "fix(chat): resolve message ordering issue"

# Result: v1.5.0 (feat bump, fix is included)
```

### Large Feature with Multiple Scopes

```bash
git commit -m "feat(notifications): implement comprehensive notification system

## Features

### Push Notifications
- Service Worker for handling push events
- VAPID key configuration and rotation
- Browser permission handling

### Email Notifications
- Email template system with variables
- Schedule notifications for later delivery
- Batch processing for bulk notifications

### In-App Notifications
- Real-time notification delivery via WebSocket
- Notification preferences per user
- Quiet hours configuration

### Notification Center
- Unified notification inbox page
- Filtering and sorting by type/date
- Batch actions (mark as read, delete)

## Testing
- 45 new unit tests
- 12 E2E tests
- 95% code coverage

## Documentation
- New docs/NOTIFICATIONS.md
- API endpoint documentation
- User guide for notification preferences"
```

## Anti-Patterns (À ÉVITER!)

### ❌ Type Invalide

```bash
# ❌ MAUVAIS - "new" n'existe pas
git commit -m "new(auth): add OAuth"

# ✅ BON
git commit -m "feat(auth): add OAuth"
```

### ❌ Pas de Scope

```bash
# ❌ MAUVAIS - scope manquant
git commit -m "feat: add new feature"

# ✅ BON
git commit -m "feat(dashboard): add new widget"
```

### ❌ Majuscule au Début

```bash
# ❌ MAUVAIS - majuscule
git commit -m "feat(auth): Add OAuth provider"

# ✅ BON
git commit -m "feat(auth): add OAuth provider"
```

### ❌ Point à la Fin

```bash
# ❌ MAUVAIS - point à la fin
git commit -m "feat(auth): add OAuth provider."

# ✅ BON
git commit -m "feat(auth): add OAuth provider"
```

### ❌ Message Trop Long sans Scope

```bash
# ❌ MAUVAIS
git commit -m "feat: This is a very long feature description that should have been split"

# ✅ BON
git commit -m "feat(auth): add OAuth provider"
```

### ❌ Vague et Non-Spécifique

```bash
# ❌ MAUVAIS - trop vague
git commit -m "feat: improve stuff"
git commit -m "fix: various bugs"

# ✅ BON
git commit -m "feat(performance): optimize database queries"
git commit -m "fix(auth): resolve session timeout issue"
```

## Bonnes Pratiques

### 1. Commits Atomiques

Chaque commit = une unité de travail logique.

```bash
# ❌ MAUVAIS - trop de changements
git commit -m "feat: add payment system and fix auth and update docs"

# ✅ BON - commits séparés
git commit -m "feat(payments): add Stripe integration"
git commit -m "fix(auth): resolve session bug"
git commit -m "docs: update authentication guide"
```

### 2. Messages Clairs et Descriptifs

```bash
# ❌ MAUVAIS
git commit -m "feat(tasks): stuff"

# ✅ BON
git commit -m "feat(tasks): implement recurring task scheduling

- Add cron expression support
- Create task_recurrence table
- Implement Inngest function for daily execution"
```

### 3. Référencer les Issues

```bash
# ✅ BON - référence l'issue
git commit -m "fix(notifications): resolve delivery failures

Closes #789

Root cause: Push subscription validation was rejecting valid subscriptions."
```

### 4. Squash Commits Avant Merge (Optional)

```bash
# Si vous avez plusieurs commits WIP sur une feature
git rebase -i main

# Puis squash en un seul commit bien formé
git commit -m "feat(chat): add message encryption"
```

### 5. Éviter les Commits Merge

```bash
# ❌ À ÉVITER
# "Merge branch 'feature/x' into main"

# ✅ À PRÉFÉRER - Rebase
git rebase main
git push origin feature/x --force
```

## Génération du CHANGELOG

À partir des commits, semantic-release génère automatiquement:

```markdown
# v1.5.0 (2026-01-22)

## Features

- **auth:** add OAuth Google provider ([abc1234](https://github.com/...))
- **notifications:** implement push notification system
  ([def5678](https://github.com/...))

## Bug Fixes

- **tasks:** resolve task creation timeout ([ghi9012](https://github.com/...))
- **auth:** resolve session expiration issue ([jkl3456](https://github.com/...))

## Performance

- **queries:** optimize user list query ([mno7890](https://github.com/...))

## Breaking Changes

- **api:** migrate REST API to GraphQL
  - All REST endpoints removed
  - Clients must use GraphQL API
```

Cela vient directement de vos commits!
