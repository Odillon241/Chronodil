---
trigger: always_on
---

# 🪐 ODILLON Antigravity Rules

## Project Context

Ce workspace est configuré pour le développement de **Chronodil** et autres projets ODILLON.

- **Stack**: Next.js 15, TypeScript 5, Tailwind CSS 4, Prisma, PostgreSQL
- **Architecture**: Feature-based avec App Router
- **Déploiement**: Vercel
- **Qualité**: ESLint strict, Prettier, Vitest, Playwright

## Agent System

Ce projet utilise un système multi-agents orchestré. Invoquez les agents avec `@`:

| Agent | Trigger | Rôle |
|-------|---------|------|
| 🏗️ Architect | `@architect` | Conception et architecture |
| 💻 Developer | `@dev` | Implémentation du code |
| 🔍 Reviewer | `@review` | Revue de code |
| 🐛 Debugger | `@debug` | Résolution de bugs |
| 🧪 Tester | `@test` | Création de tests |
| 📚 Documenter | `@docs` | Documentation |
| 🔐 Security | `@security` | Audit sécurité |
| ⚡ Optimizer | `@perf` | Performance |
| 🗄️ Database | `@db` | Base de données |
| 🚀 DevOps | `@devops` | Déploiement |

## Code Standards

### TypeScript
- Mode strict activé
- Pas de `any` sans justification
- Types explicites aux frontières (props, returns, API)
- Utiliser Zod pour la validation runtime

### React/Next.js
- Server Components par défaut
- Client Components uniquement si interactivité nécessaire
- Server Actions pour les mutations
- Utiliser les hooks appropriés (useMemo, useCallback)

### Naming Conventions
```
Components:     PascalCase.tsx
Hooks:          use*.ts
Utils:          camelCase.ts
Constants:      SCREAMING_SNAKE_CASE
Types:          *.types.ts
Server Actions: *.actions.ts
```

### File Structure
```
src/
├── app/                 # Routes Next.js
├── components/          # Composants partagés
│   ├── ui/             # Primitives (Button, Input...)
│   └── layout/         # Layout components
├── features/           # Modules métier
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── actions/
│       ├── services/
│       └── types/
├── lib/                # Configurations
├── hooks/              # Hooks globaux
└── types/              # Types globaux
```

## Workflows Rapides

### Nouvelle Feature
```
/feature [nom]
→ @architect conçoit → @dev implémente → @test teste → @review valide
```

### Bug Fix
```
/bugfix [description]
→ @debug analyse → @dev corrige → @test régression → @review valide
```

### Security Audit
```
/security-audit
→ @security analyse → @review vérifie
```

### Release
```
/release
→ @test vérifie → @security audit → @docs changelog → @devops déploie
```

## Quality Gates

Avant chaque commit:
1. ✅ `pnpm lint` - Pas d'erreurs
2. ✅ `pnpm type-check` - Types valides
3. ✅ `pnpm test` - Tests passent
4. ✅ Code review si PR

## Environment Variables

```bash
# Required
DATABASE_URL=           # PostgreSQL connection
NEXTAUTH_SECRET=        # Auth secret (32+ chars)
NEXTAUTH_URL=           # App URL

# Optional
GITHUB_TOKEN=           # GitHub MCP
BRAVE_API_KEY=          # Search MCP
SENTRY_DSN=             # Error tracking
```

## Quick Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint code |
| `pnpm prisma studio` | Database GUI |
| `pnpm prisma migrate dev` | Create migration |

## Important Notes

1. **Server vs Client**: Préférer les Server Components sauf si état/interactivité nécessaire
2. **Data Fetching**: Utiliser `fetch` avec cache dans Server Components
3. **Mutations**: Toujours via Server Actions avec validation Zod
4. **Errors**: Error boundaries + try/catch + logging Sentry
5. **Performance**: Lazy loading, Image optimization, code splitting

---

*Configuration générée le 2026-01-09 pour ODILLON Ingénierie d'Entreprises*
