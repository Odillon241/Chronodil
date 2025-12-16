# 🚀 Next.js 16 - Best Practices 2025

Guide complet des meilleures pratiques pour Next.js 16 en 2025, adapté au projet Chronodil.

---

## 📋 Table des matières

1. [React Server Components (RSC)](#1-react-server-components-rsc)
2. [App Router & Architecture](#2-app-router--architecture)
3. [Stratégies de rendu](#3-stratégies-de-rendu)
4. [Optimisation des performances](#4-optimisation-des-performances)
5. [Gestion du cache](#5-gestion-du-cache)
6. [Sécurité](#6-sécurité)
7. [TypeScript & Validation](#7-typescript--validation)
8. [Images & Assets](#8-images--assets)
9. [Core Web Vitals](#9-core-web-vitals)
10. [Architecture & Scalabilité](#10-architecture--scalabilité)

---

## 1. React Server Components (RSC)

### ✅ Principe fondamental
**Par défaut, tous les composants sont des Server Components** dans Next.js 16 avec l'App Router.

### 🎯 Best Practices

#### Utiliser les Server Components pour :
- ✅ **Fetch de données** (base de données, APIs)
- ✅ **Accès aux ressources serveur** (fichiers, variables d'environnement)
- ✅ **Composants lourds** (réduire la taille du bundle client)
- ✅ **Code sensible** (ne pas exposer au client)
- ✅ **SEO** (contenu statique rendu côté serveur)

```typescript
// ✅ BON - Server Component (par défaut)
// app/dashboard/timesheets/page.tsx
export default async function TimesheetsPage() {
  // Fetch direct dans le Server Component
  const timesheets = await prisma.timesheet.findMany({
    where: { userId: currentUser.id },
    include: { project: true, task: true },
  })

  return (
    <div>
      <h1>Mes feuilles de temps</h1>
      <TimesheetList timesheets={timesheets} />
    </div>
  )
}
```

#### Utiliser les Client Components uniquement pour :
- ✅ **Interactivité** (onClick, onChange, etc.)
- ✅ **Hooks React** (useState, useEffect, useContext)
- ✅ **Browser APIs** (localStorage, window, document)
- ✅ **Context Providers** (pour partager l'état)
- ✅ **Bibliothèques tierces** nécessitant le client

```typescript
// ✅ BON - Client Component (nécessaire pour interactivité)
// components/forms/timesheet-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function TimesheetForm({ projectId }: { projectId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm()
  
  // ... logique du formulaire
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

#### ⚠️ Anti-patterns à éviter

```typescript
// ❌ MAUVAIS - Client Component inutile
'use client'
export function TimesheetDisplay({ timesheet }: { timesheet: Timesheet }) {
  return <div>{timesheet.description}</div> // Pas d'interactivité !
}

// ✅ BON - Server Component
export function TimesheetDisplay({ timesheet }: { timesheet: Timesheet }) {
  return <div>{timesheet.description}</div>
}
```

### 📦 Réduction du bundle client

**Avant** (tous les composants côté client) :
- Bundle initial : ~500KB
- Tous les composants chargés même si non utilisés

**Après** (Server Components) :
- Bundle initial : ~200KB (-60%)
- Seuls les composants interactifs sont chargés

---

## 2. App Router & Architecture

### 📁 Structure recommandée

```
app/
├── (auth)/                    # Route group (non affecte l'URL)
│   ├── login/
│   └── register/
├── (dashboard)/               # Route group pour dashboard
│   ├── layout.tsx            # Layout spécifique au dashboard
│   ├── timesheets/
│   │   ├── page.tsx
│   │   ├── loading.tsx       # Loading UI
│   │   ├── error.tsx         # Error boundary
│   │   └── [id]/
│   │       └── page.tsx
│   └── projects/
├── layout.tsx                 # Layout racine
├── page.tsx
├── loading.tsx                # Loading global
├── error.tsx                  # Error boundary global
└── not-found.tsx              # 404 page
```

### 🎯 Best Practices pour les layouts

#### Layouts imbriqués
```typescript
// app/layout.tsx (Root Layout)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

// app/(dashboard)/layout.tsx (Dashboard Layout)
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

#### Loading States
```typescript
// app/dashboard/timesheets/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
```

#### Error Boundaries
```typescript
// app/dashboard/timesheets/error.tsx
'use client' // Les Error Boundaries doivent être Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Une erreur est survenue</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}
```

### 🔄 Streaming avec Suspense

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<DashboardSkeleton />}>
        <RecentTimesheets />
      </Suspense>
      
      <Suspense fallback={<StatsSkeleton />}>
        <WeeklyStats />
      </Suspense>
    </div>
  )
}

// Composants séparés qui fetch leurs propres données
async function RecentTimesheets() {
  const timesheets = await getRecentTimesheets()
  return <TimesheetList timesheets={timesheets} />
}

async function WeeklyStats() {
  const stats = await getWeeklyStats()
  return <StatsDisplay stats={stats} />
}
```

**Avantages** :
- ⚡ Affichage progressif du contenu
- 🎯 Meilleure expérience utilisateur
- 📉 Réduction du TTFB (Time To First Byte)

---

## 3. Stratégies de rendu

### 📊 Comparaison des stratégies

| Stratégie | Quand l'utiliser | Exemple |
|-----------|------------------|---------|
| **SSG** (Static Site Generation) | Contenu statique, rarement mis à jour | Pages marketing, blogs, documentation |
| **SSR** (Server-Side Rendering) | Données dynamiques, personnalisées | Dashboard utilisateur, profils |
| **ISR** (Incremental Static Regeneration) | Contenu qui change périodiquement | Catalogue produits, articles de blog |
| **CSR** (Client-Side Rendering) | Interactivité temps réel | Formulaires, dashboards temps réel |
| **PPR** (Partial Prerendering) | Mix statique/dynamique | Pages avec parties statiques + dynamiques |

### 🎯 Recommandations pour Chronodil

#### Pages statiques (SSG)
```typescript
// app/pricing/page.tsx
export const dynamic = 'force-static' // Optionnel, SSG par défaut

export default function PricingPage() {
  return <div>Tarifs...</div>
}
```

#### Pages dynamiques (SSR)
```typescript
// app/dashboard/timesheets/page.tsx
export const dynamic = 'force-dynamic' // Force SSR

export default async function TimesheetsPage() {
  const session = await auth()
  const timesheets = await getTimesheets(session.user.id)
  
  return <TimesheetList timesheets={timesheets} />
}
```

#### ISR avec revalidation
```typescript
// app/projects/[id]/page.tsx
export const revalidate = 3600 // Revalidate toutes les heures

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  return <ProjectDetails project={project} />
}
```

#### Partial Prerendering (PPR) - Next.js 16
```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true, // Active Partial Prerendering
  },
}

// app/dashboard/page.tsx
// Les parties statiques sont pré-rendues
// Les parties dynamiques sont streamées
export default function DashboardPage() {
  return (
    <div>
      {/* Statique - pré-rendu */}
      <StaticHeader />
      
      {/* Dynamique - streamé */}
      <Suspense fallback={<Loading />}>
        <UserDashboard />
      </Suspense>
    </div>
  )
}
```

---

## 4. Optimisation des performances

### ⚡ Bundle Size Optimization

#### Dynamic Imports
```typescript
// ✅ BON - Import dynamique pour composants lourds
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Si le composant n'a pas besoin de SSR
})

export default function AnalyticsPage() {
  return <HeavyChart />
}
```

#### Tree Shaking
```typescript
// ✅ BON - Import spécifique
import { format } from 'date-fns'

// ❌ MAUVAIS - Import de tout le module
import * as dateFns from 'date-fns'
```

### 🎯 Code Splitting automatique

Next.js 16 fait automatiquement le code splitting par route. Chaque route a son propre bundle.

```typescript
// ✅ BON - Chaque route est automatiquement splitée
app/
├── dashboard/page.tsx        // Bundle 1
├── dashboard/timesheets/page.tsx  // Bundle 2
└── dashboard/projects/page.tsx   // Bundle 3
```

### 📦 Optimisation des dépendances

```typescript
// ✅ BON - Utiliser les exports ESM
import { Button } from '@/components/ui/button'

// ❌ MAUVAIS - Import de CommonJS (plus lourd)
const Button = require('@/components/ui/button')
```

---

## 5. Gestion du cache

### 🎯 Cache avec `fetch()`

Next.js 16 améliore la gestion du cache avec `fetch()` natif.

```typescript
// ✅ Cache avec revalidation
async function getTimesheets(userId: string) {
  const response = await fetch(`/api/timesheets/${userId}`, {
    next: { revalidate: 3600 }, // Revalidate toutes les heures
  })
  return response.json()
}

// ✅ Cache permanent
async function getStaticData() {
  const response = await fetch('https://api.example.com/data', {
    cache: 'force-cache', // Cache permanent
  })
  return response.json()
}

// ✅ Pas de cache (toujours frais)
async function getRealTimeData() {
  const response = await fetch('https://api.example.com/realtime', {
    cache: 'no-store', // Pas de cache
  })
  return response.json()
}
```

### 🔄 Revalidation manuelle

```typescript
// app/actions/timesheet.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createTimesheet(data: TimesheetData) {
  await prisma.timesheet.create({ data })
  
  // Revalider les chemins spécifiques
  revalidatePath('/dashboard/timesheets')
  revalidatePath('/dashboard')
  
  // Ou revalider par tag
  revalidateTag('timesheets')
}
```

### 📊 Cache Tags

```typescript
// Fetch avec tag
async function getTimesheets() {
  const response = await fetch('/api/timesheets', {
    next: { tags: ['timesheets'] },
  })
  return response.json()
}

// Revalidation par tag
revalidateTag('timesheets')
```

---

## 6. Sécurité

### 🔐 Variables d'environnement

```typescript
// ✅ BON - Variables serveur uniquement
// .env.local
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
API_KEY=...

// ❌ MAUVAIS - Variables exposées au client
// .env.local
NEXT_PUBLIC_API_KEY=... // ⚠️ Accessible côté client !
```

### 🛡️ Middleware de sécurité

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Headers de sécurité
  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: '/dashboard/:path*',
}
```

### 🔒 Validation des données

```typescript
// ✅ BON - Validation serveur avec Zod
'use server'

import { z } from 'zod'

const createTimesheetSchema = z.object({
  projectId: z.string().cuid(),
  duration: z.number().positive().max(24),
  date: z.date(),
})

export async function createTimesheet(input: unknown) {
  // ✅ Validation stricte
  const validated = createTimesheetSchema.parse(input)
  
  // ✅ Vérification d'autorisation
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  // ✅ Création sécurisée
  return await prisma.timesheet.create({
    data: {
      ...validated,
      userId: session.user.id,
    },
  })
}
```

---

## 7. TypeScript & Validation

### 📘 Type Safety

```typescript
// ✅ BON - Types stricts
interface TimesheetFormProps {
  projectId: string
  onSubmit: (data: TimesheetData) => Promise<void>
}

export function TimesheetForm({ projectId, onSubmit }: TimesheetFormProps) {
  // ...
}

// ❌ MAUVAIS - any
export function TimesheetForm({ projectId, onSubmit }: any) {
  // ...
}
```

### ✅ Validation Runtime avec Zod

```typescript
// lib/validations/timesheet.ts
import { z } from 'zod'

export const timesheetSchema = z.object({
  projectId: z.string().cuid('ID de projet invalide'),
  date: z.date({
    required_error: 'La date est requise',
  }),
  duration: z
    .number()
    .positive('La durée doit être positive')
    .max(24, 'La durée ne peut pas dépasser 24 heures'),
  description: z.string().max(500).optional(),
})

export type TimesheetFormData = z.infer<typeof timesheetSchema>
```

---

## 8. Images & Assets

### 🖼️ Composant Image de Next.js

```typescript
// ✅ BON - Utiliser next/image
import Image from 'next/image'

export function UserAvatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
      priority // Pour les images above-the-fold
    />
  )
}

// ❌ MAUVAIS - Balise HTML native
<img src={src} alt={alt} /> // Pas d'optimisation !
```

### 📦 Optimisation des assets

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'], // Formats modernes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

---

## 9. Core Web Vitals

### 📊 Métriques à optimiser

#### LCP (Largest Contentful Paint)
```typescript
// ✅ Optimiser le LCP
export default function DashboardPage() {
  return (
    <div>
      {/* Charger le contenu principal en priorité */}
      <Image
        src="/hero-image.jpg"
        alt="Hero"
        priority // Priorité haute
        width={1200}
        height={600}
      />
      
      {/* Contenu secondaire peut attendre */}
      <Suspense fallback={<Loading />}>
        <SecondaryContent />
      </Suspense>
    </div>
  )
}
```

#### FID (First Input Delay)
```typescript
// ✅ Réduire le FID - Code splitting
import dynamic from 'next/dynamic'

// Charger les composants lourds de manière asynchrone
const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <Skeleton />,
})
```

#### CLS (Cumulative Layout Shift)
```typescript
// ✅ Éviter le CLS - Dimensions explicites
<Image
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  // ✅ Dimensions définies = pas de shift
/>

// ❌ MAUVAIS - Pas de dimensions
<Image src="/image.jpg" alt="Image" /> // ⚠️ CLS possible
```

---

## 10. Architecture & Scalabilité

### 🏗️ Architecture modulaire

```
src/
├── app/                    # Routes (App Router)
├── components/
│   ├── ui/                # Composants UI réutilisables
│   ├── features/          # Composants métier
│   └── layout/             # Composants de layout
├── lib/
│   ├── actions/           # Server Actions
│   ├── utils/             # Utilitaires
│   └── validations/        # Schémas Zod
├── hooks/                  # Custom hooks
└── types/                  # Types TypeScript
```

### 🔄 Server Actions

```typescript
// app/actions/timesheet.ts
'use server'

import { action } from '@/lib/safe-action'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createSchema = z.object({
  projectId: z.string().cuid(),
  duration: z.number().positive().max(24),
  date: z.date(),
})

export const createTimesheet = action(
  createSchema,
  async (input, { userId }) => {
    const timesheet = await prisma.timesheet.create({
      data: {
        ...input,
        userId,
      },
    })

    revalidatePath('/dashboard/timesheets')
    
    return { success: true, data: timesheet }
  }
)
```

### 📡 API Routes (si nécessaire)

```typescript
// app/api/timesheets/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timesheets = await prisma.timesheet.findMany({
    where: { userId: session.user.id },
  })

  return NextResponse.json(timesheets)
}
```

**Note** : Préférer les Server Actions aux API Routes pour la plupart des cas d'usage.

---

## 🎯 Checklist de migration Next.js 16

### ✅ À vérifier dans votre projet

- [ ] Utiliser Server Components par défaut
- [ ] Marquer les Client Components avec `'use client'`
- [ ] Implémenter `loading.tsx` pour chaque route
- [ ] Implémenter `error.tsx` pour chaque route
- [ ] Utiliser `next/image` pour toutes les images
- [ ] Optimiser les imports (dynamic imports pour composants lourds)
- [ ] Valider les données avec Zod
- [ ] Utiliser les Server Actions plutôt que les API Routes
- [ ] Configurer le cache approprié avec `fetch()`
- [ ] Tester les Core Web Vitals

---

## 📚 Ressources

- [Documentation officielle Next.js](https://nextjs.org/docs)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Core Web Vitals](https://web.dev/vitals/)

---

## 🔄 Mises à jour régulières

Ce document devrait être mis à jour régulièrement pour refléter :
- Les nouvelles fonctionnalités de Next.js
- Les changements dans les best practices
- Les optimisations découvertes dans le projet

**Dernière mise à jour** : Janvier 2025
**Version Next.js** : 16.x

