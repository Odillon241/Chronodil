# Chronodil App - Project Instructions

## Build Status
✅ Build successful - No syntax errors detected
✅ TypeScript check passed
✅ All pages compile successfully (25 pages)

## Tech Stack
- **Next.js**: 16.0.0 (Turbopack enabled by default)
- **React**: 19.2.0
- **TypeScript**: 5.9.3
- **Node.js**: 20.9.0+ (minimum required)
- **next-intl**: 4.4.0 (internationalization)
- **Prisma**: 6.17.1 (ORM)

## Next.js 16 Features & Optimizations

### Active Performance Optimizations

1. **⚡ React Compiler** (Stable)
   - Status: **ENABLED** in `next.config.js`
   - Feature: Automatic memoization of components
   - Benefit: Reduces unnecessary re-renders with zero manual code changes
   - Package: `babel-plugin-react-compiler@1.0.0`

2. **🚀 Turbopack** (Stable - Default Bundler)
   - Status: **ENABLED BY DEFAULT**
   - Speed: 5-10x faster Fast Refresh, 2-5x faster builds
   - No configuration needed - replaces Webpack

3. **💾 Turbopack Filesystem Caching**
   - Status: **ENABLED** in `next.config.js`
   - Feature: Stores compiler artifacts on disk between runs
   - Benefit: Significantly faster compile times across dev server restarts

### Breaking Changes from Next.js 15

1. **Async Dynamic APIs** ✅ HANDLED
   - `params`, `searchParams`, `cookies()`, `headers()` require `await`
   - All instances verified with Next.js codemod
   - TypeScript types updated accordingly

2. **middleware.ts → proxy.ts**
   - Status: **Using middleware.ts** (still supported in Next.js 16)
   - Migration optional - current setup works fine
   - `proxy.ts` runs on Node.js runtime only (no Edge runtime)

3. **Node.js & TypeScript Requirements**
   - Node.js: ≥20.9.0 (Node 18 not supported)
   - TypeScript: ≥5.1.0

## Known Issues & Solutions

### Browser Console Warnings (Non-Critical)

1. **Font 404 Errors** ℹ️
   - Status: **NORMAL BEHAVIOR** - Safe to ignore
   - Description: Next.js font optimization attempts to load fallback font files that may not exist
   - Impact: None - Primary fonts load correctly
   - Files affected: inter-latin-*.woff2, jetbrains-mono-*.woff2
   - **No action required** - This is expected Next.js behavior

2. **Prisma Studio Runtime Error** ✅ RÉSOLU
   - Statut: **RÉSOLU**
   - Description: Prisma Studio était incapable de traiter les requêtes
   - Cause: Prisma Client désynchronisé après modifications du schéma
   - Solution appliquée:
     ```bash
     pnpm prisma db pull --force    # Synchroniser le schéma
     pnpm prisma format             # Formater le schéma
     pnpm prisma generate           # Régénérer le client
     pnpm prisma migrate status     # Vérifier les migrations
     ```
   - Résultat: Client Prisma régénéré avec succès, 7 migrations à jour

### Procédure de résolution des erreurs Prisma

Si vous rencontrez des erreurs Prisma similaires:

1. **Vérifier la connexion à la base de données**
   ```bash
   pnpm prisma db pull
   ```

2. **Régénérer le Prisma Client**
   ```bash
   pnpm prisma generate
   ```

3. **Vérifier l'état des migrations**
   ```bash
   pnpm prisma migrate status
   ```

4. **Si nécessaire, créer une nouvelle migration**
   ```bash
   pnpm prisma migrate dev --name descriptive_name
   ```

## Development Commands

```bash
# Development (uses Turbopack by default)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Database management
pnpm db:studio     # Open Prisma Studio
pnpm db:push       # Push schema changes
pnpm db:migrate    # Run migrations
```

## Development Notes
- Build output: 25 pages generated successfully
- All TypeScript types valid
- React Compiler enabled for automatic optimization
- Turbopack filesystem caching improves dev server restart speed