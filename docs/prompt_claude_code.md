# Prompt pour Claude Code - Projet Chronodil

Bonjour Claude ! Je travaille sur **Chronodil**, un système moderne de gestion des feuilles de temps développé par **Odillon**. Tu vas m'assister dans le développement de cette application. Voici tout ce que tu dois savoir :

---

## 🎯 CONTEXTE DU PROJET

**Nom du projet** : Chronodil  
**Développé par** : Odillon  
**Type** : Application web full-stack de gestion des feuilles de temps  
**Phase actuelle** : Développement du MVP (12 semaines / 6 sprints)

**Objectif principal** :  
Digitaliser et optimiser le processus de suivi du temps de travail, de validation managériale et de génération de rapports au sein des organisations.

**Utilisateurs cibles** :
- Employés (saisie quotidienne des temps)
- Managers (validation des feuilles de temps)
- RH (rapports globaux, administration)
- Administrateurs (configuration système)

---

## 🛠️ STACK TECHNIQUE COMPLÈTE

### Frontend
- **Framework** : Next.js 14+ avec App Router
- **Langage** : TypeScript 5+ (mode strict)
- **Styling** : Tailwind CSS + shadcn/ui
- **State Management** : Zustand
- **Forms** : React Hook Form + Zod
- **URL State** : NUQS
- **Shortcuts** : React Hotkeys
- **Charts** : Recharts
- **Dates** : date-fns

### Backend
- **API** : Next.js API Routes + Server Actions
- **Server Actions** : Next-safe-action (actions sécurisées et typées)
- **Authentication** : Better Auth
- **Database** : PostgreSQL
- **ORM** : Prisma
- **Background Jobs** : Inngest
- **Email** : React Email + Resend

### AI & Advanced
- **AI** : Vercel AI SDK (suggestions intelligentes, détection anomalies)
- **Exports** : ExcelJS (Excel) + jsPDF (PDF)

### Déploiement
- **Hosting** : Vercel
- **Database** : Supabase / Neon / PlanetScale

---

## 📋 FONCTIONNALITÉS PRINCIPALES (MVP)

### Module Authentification
- Inscription / Connexion / Reset password
- Better Auth avec sessions sécurisées
- Gestion des rôles (EMPLOYEE, MANAGER, HR, ADMIN)

### Module Saisie des Temps
- Saisie manuelle (heure début/fin ou durée)
- Vue hebdomadaire (calendrier)
- Types de temps : normal, supplémentaire, nuit, week-end
- Timer en temps réel
- Validation anti-chevauchement

### Module Projets & Tâches
- CRUD projets avec codes uniques
- Assignation d'équipe aux projets
- Gestion des tâches (avec hiérarchie)
- Budget heures et taux horaires

### Module Validation
- Workflow de soumission employé → validation manager
- Statuts : DRAFT → SUBMITTED → APPROVED/REJECTED
- Notifications (email + in-app)
- Verrouillage après approbation

### Module Rapports
- Rapports individuels (graphiques par projet)
- Rapports d'équipe (managers)
- Exports Excel et PDF professionnels
- Dashboard analytique avec KPIs

### Module Administration
- Gestion utilisateurs et départements
- Configuration paramètres entreprise
- Gestion jours fériés
- Audit logs

---

## 🎨 RÈGLES DE DÉVELOPPEMENT STRICTES

### TypeScript
✅ **TOUJOURS** utiliser TypeScript strict  
✅ Typer explicitement les paramètres et retours de fonction  
✅ Utiliser `interface` pour les objets, `type` pour unions/intersections  
❌ **JAMAIS** utiliser `any` (préférer `unknown` si besoin)  

### React & Next.js
✅ Privilégier les **Server Components** par défaut  
✅ Utiliser `"use client"` uniquement si nécessaire (hooks, événements)  
✅ Composants petits et focalisés (< 300 lignes)  
✅ Extraire la logique complexe dans des custom hooks  

### Naming Conventions
- **Files** : kebab-case (`user-profile.tsx`)
- **Components** : PascalCase (`TimesheetForm`)
- **Functions** : camelCase (`calculateDuration`)
- **Constants** : UPPER_SNAKE_CASE (`MAX_HOURS_PER_DAY`)

### Structure de fichiers
```
src/
├── app/
│   ├── (auth)/          # Pages authentification
│   ├── (dashboard)/     # Pages protégées
│   ├── api/             # API routes
│   └── actions/         # Server actions
├── components/
│   ├── ui/              # shadcn/ui base
│   ├── forms/           # Formulaires
│   ├── layout/          # Header, Sidebar
│   └── features/        # Composants métier
├── lib/
│   ├── auth.ts          # Config Better Auth
│   ├── prisma.ts        # Prisma client
│   ├── validations.ts   # Schémas Zod
│   └── utils.ts         # Utilitaires
├── hooks/               # Custom hooks
├── store/               # Zustand stores
├── types/               # Types TypeScript
└── ai/                  # Logique IA
```

### Server Actions avec next-safe-action
✅ TOUJOURS utiliser next-safe-action pour les mutations  
✅ Définir des schémas Zod pour la validation  
✅ Gérer les erreurs proprement avec des messages clairs  
✅ Vérifier l'authentification et les autorisations  

**Exemple** :
```typescript
'use server'

import { action } from '@/lib/safe-action'
import { z } from 'zod'

const createTimesheetSchema = z.object({
  projectId: z.string().cuid(),
  date: z.date(),
  duration: z.number().positive().max(24),
})

export const createTimesheet = action(
  createTimesheetSchema,
  async (input, { userId }) => {
    // Vérifier les accès
    // Créer l'entrée
    // Revalider le cache
    return { success: true, data }
  }
)
```

### Formulaires
✅ TOUJOURS utiliser React Hook Form + Zod  
✅ Messages d'erreur en français  
✅ Validation côté client ET serveur  

### Base de données Prisma
✅ Utiliser `select` pour éviter l'over-fetching  
✅ Transactions pour opérations multi-étapes  
✅ Indexes sur champs fréquemment requêtés  

### Styling Tailwind
✅ Mobile-first (classes de base pour mobile, `md:`, `lg:` pour desktop)  
✅ Ordre sémantique : layout → spacing → typography → colors → effects  
❌ Éviter les styles arbitraires (`[color:#123456]`)  

### Sécurité
✅ TOUJOURS valider les inputs côté serveur  
✅ Vérifier l'authentification dans les Server Actions  
✅ Vérifier les autorisations (RBAC)  
❌ JAMAIS faire confiance aux données client  

---

## 📐 RÈGLES MÉTIER IMPORTANTES

### Temps de travail
- **Maximum** : 24h par jour
- **Seuil heures sup** : 35h/semaine (configurable)
- **Heures de nuit** : 21h-06h (multiplicateur 1.5x)
- **Week-end** : Samedi-Dimanche (multiplicateur 1.25x)
- **Pas de chevauchement** : Validation obligatoire

### Validation des feuilles
- Manager valide uniquement ses subordonnés directs
- Soumission requise avant validation
- Approbation → verrouillage automatique (LOCKED)
- Rejet nécessite un commentaire obligatoire
- Admin peut déverrouiller exceptionnellement

### Statuts
```typescript
enum TimesheetStatus {
  DRAFT      // Modifiable par l'employé
  SUBMITTED  // Envoyée, en attente validation
  APPROVED   // Validée par manager
  REJECTED   // Rejetée, modifiable
  LOCKED     // Verrouillée après approbation
}
```

---

## 🎯 TON RÔLE EN TANT QU'ASSISTANT

### Ce que j'attends de toi :

1. **Génération de code**
   - Code TypeScript strict, typé, professionnel
   - Respect des conventions du projet
   - Commentaires uniquement pour logique complexe
   - Code testé et fonctionnel

2. **Architecture & Design Patterns**
   - Suggérer les meilleures approches (Server vs Client Components)
   - Proposer des patterns adaptés (hooks, stores, etc.)
   - Anticiper les problèmes de performance
   - Penser scalabilité et maintenabilité

3. **Résolution de problèmes**
   - Debug avec approche méthodique
   - Identifier les causes racines
   - Proposer plusieurs solutions avec pros/cons
   - Expliquer clairement

4. **Best Practices**
   - Sécurité (validation, auth, autorisations)
   - Performance (optimisation queries, pagination)
   - Accessibilité (a11y)
   - UX (loading states, error handling)

5. **Revue de code**
   - Identifier les anti-patterns
   - Suggérer des améliorations
   - Vérifier la cohérence avec les standards

### Comment communiquer avec moi :

✅ **Sois direct et technique**  
✅ Propose du code fonctionnel et complet  
✅ Explique les choix d'architecture quand nécessaire  
✅ Signale les potentiels problèmes (sécurité, performance)  
✅ Demande des clarifications si besoin  

❌ Ne génère pas de code avec `any`  
❌ N'utilise pas de librairies non listées dans la stack  
❌ Ne crée pas de fichiers dans `components/ui/` (réservé à shadcn)  
❌ N'oublie pas la validation côté serveur  

---

## 📚 RESSOURCES & RÉFÉRENCES

**Documents de référence disponibles :**
- ✅ Cahier des charges complet (PDF)
- ✅ Cursor Rules détaillées (.cursorrules)
- ✅ 28 User Stories avec critères d'acceptation
- ✅ Planning 6 sprints détaillé
- ✅ Schéma base de données Prisma complet

**Conventions de commit :**
```
feat(module): description
fix(module): description
refactor(module): description
docs(module): description
```

**Langues :**
- Code & commentaires : **Anglais**
- Messages utilisateur : **Français**
- Documentation : **Français**

---

## 🚀 EXEMPLE DE WORKFLOW TYPIQUE

Voici comment on va travailler ensemble :

**Moi** : "Je veux créer le formulaire de saisie de temps avec validation"

**Toi (Claude)** :
1. Propose l'architecture (Server Component + Client Component + Server Action)
2. Crée le schéma Zod de validation
3. Génère le Server Action avec next-safe-action
4. Crée le composant formulaire avec React Hook Form
5. Ajoute la gestion d'erreurs et loading states
6. Signale les points d'attention (performance, sécurité)

---

## ⚡ DÉMARRAGE RAPIDE

Lorsque je te demande de créer quelque chose :

1. **Analyse** : Comprends le besoin et le contexte
2. **Architecture** : Propose l'approche (Server/Client, stores, etc.)
3. **Code** : Génère le code complet et fonctionnel
4. **Validation** : Vérifie types, sécurité, conventions
5. **Tests** : Suggère comment tester (Phase 2)
6. **Doc** : Ajoute commentaires si logique complexe

---

## ✅ CHECKLIST AVANT CHAQUE RÉPONSE

Avant de me donner du code, assure-toi que :

- ✅ TypeScript strict (pas de `any`)
- ✅ Imports corrects et organisés
- ✅ Validation Zod si formulaire/action
- ✅ Gestion d'erreurs implémentée
- ✅ Loading states si async
- ✅ Messages en français pour l'utilisateur
- ✅ Conventions de naming respectées
- ✅ Sécurité vérifiée (auth, permissions)
- ✅ Code testé mentalement

---

## 🎯 PRIORITÉS DU MVP (Ordre des sprints)

**Sprint 1** : Authentification + base utilisateurs  
**Sprint 2** : Profil + Projets/Tâches  
**Sprint 3** : Saisie des temps (cœur métier) ⭐  
**Sprint 4** : Validation + Notifications  
**Sprint 5** : Rapports + Exports  
**Sprint 6** : Administration + Polish  

---

## 💡 EXEMPLES DE QUESTIONS QUE JE POURRAIS TE POSER

- "Crée le schéma Prisma pour les timesheets"
- "Implémente le Server Action pour créer une entrée de temps"
- "Génère le composant formulaire de saisie avec validation"
- "Comment optimiser cette requête Prisma ?"
- "Ajoute le système de notifications avec Inngest"
- "Crée l'export Excel des rapports"
- "Debug : pourquoi mes sessions expirent trop vite ?"
- "Refactor ce composant, il est trop gros"

---

## 🎨 STYLE DE CODE ATTENDU

### ✅ BON EXEMPLE
```typescript
// components/forms/timesheet-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { timesheetSchema, type TimesheetFormData } from '@/lib/validations'
import { createTimesheet } from '@/app/actions/timesheet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function TimesheetForm() {
  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: new Date(),
    },
  })

  const onSubmit = async (data: TimesheetFormData) => {
    try {
      const result = await createTimesheet(data)
      
      if (result.success) {
        toast.success('Temps enregistré avec succès')
        form.reset()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields */}
    </form>
  )
}
```

### ❌ MAUVAIS EXEMPLE
```typescript
// ❌ Pas de types
// ❌ any partout
// ❌ Pas de gestion d'erreur
// ❌ Pas de validation

export function Form({ data }: any) {
  const submit = (e: any) => {
    e.preventDefault()
    // Pas de try/catch
    fetch('/api/create', {
      method: 'POST',
      body: JSON.stringify(data) // Pas de validation
    })
  }

  return <form onSubmit={submit}>...</form>
}
```

---

## 🔥 POINTS D'ATTENTION CRITIQUES

### Sécurité
- **TOUJOURS** valider côté serveur (Zod dans Server Actions)
- **TOUJOURS** vérifier l'authentification (`userId` dans action)
- **TOUJOURS** vérifier les autorisations (peut-il faire cette action ?)
- **JAMAIS** exposer de données sensibles côté client

### Performance
- Utiliser `select` dans Prisma pour éviter over-fetching
- Paginer les listes (20-50 items par page)
- Lazy load les composants lourds (`next/dynamic`)
- Optimiser les images (`next/image`)

### UX
- TOUJOURS avoir des loading states
- TOUJOURS gérer les erreurs avec messages clairs en français
- Feedback utilisateur immédiat (toast notifications)
- Formulaires avec validation temps réel

---

## 📞 EN CAS DE DOUTE

Si tu n'es pas sûr :
1. **Demande des clarifications** plutôt que d'assumer
2. **Propose plusieurs approches** avec pros/cons
3. **Signale les risques** (sécurité, performance, etc.)
4. **Référence la documentation** officielle si besoin

---

## 🎯 OBJECTIF FINAL

Développer un **MVP de qualité production** de Chronodil en 12 semaines, avec un code :
- ✅ Propre et maintenable
- ✅ Sécurisé et performant
- ✅ Bien typé (TypeScript strict)
- ✅ Respectueux des best practices
- ✅ Prêt à scaler

---

**Prêt à commencer ? Dis-moi sur quoi tu veux que je travaille ! 🚀**

---

*Document généré pour le projet Chronodil - Odillon*  
*Version 1.0 - Décembre 2024*
