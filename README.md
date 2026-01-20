# Chronodil - Application de Gestion des Temps

Application web moderne et responsive pour la gestion des feuilles de temps,
développée avec Next.js 16, TypeScript, Prisma et Better Auth.

![Chronodil](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3)
![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E)

## 🎯 Fonctionnalités

### Pour tous les utilisateurs

- ✅ **Authentification sécurisée** avec Better Auth
- ⏰ **Saisie des temps** intuitive avec calcul automatique de la durée
- 📊 **Tableau de bord** avec statistiques en temps réel
- 📁 **Gestion de projets** et tâches
- 📅 **Vue calendrier** des activités
- 📈 **Rapports et analytics** détaillés
- 🎨 **Interface responsive** adaptée mobile et desktop

### Pour les managers

- ✔️ **Validation des temps** de l'équipe
- 👥 **Gestion d'équipe** et affectation aux projets
- 📊 **Tableaux de bord** avancés
- 💬 **Système de commentaires** pour les validations

### Pour les RH et Admins

- 👤 **Gestion des utilisateurs** et rôles
- 🏢 **Gestion des départements**
- ⚙️ **Configuration** de l'application
- 📝 **Audit logs** complets
- 📅 **Gestion des jours fériés**

## 🛠️ Stack Technique

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Langage**: TypeScript 5.9
- **Base de données**: PostgreSQL avec Prisma ORM
- **Authentification**: Better Auth
- **UI**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **Validation**: Zod + React Hook Form
- **Server Actions**: next-safe-action
- **État global**: Zustand
- **Notifications**: Sonner
- **Icônes**: Lucide React
- **Dates**: date-fns
- **Charts**: Recharts
- **Export**: ExcelJS, jsPDF
- **Linting**: ESLint 9 (flat config) + typescript-eslint
- **Formatting**: Prettier 3
- **Git Hooks**: Husky + lint-staged

## 📋 Prérequis

- Node.js 20.9+ (requis pour Next.js 16)
- PostgreSQL 14+
- pnpm 10+ (recommandé) ou npm/yarn

## 🚀 Installation

### 1. Cloner le projet

```bash
cd Chronodil_App
```

### 2. Installer pnpm (si pas déjà installé)

```bash
corepack enable
corepack prepare pnpm@10.28.0 --activate
# ou
npm install -g pnpm@10
```

### 3. Installer les dépendances

```bash
pnpm install
```

### 4. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chronodil"

# Better Auth
BETTER_AUTH_SECRET="votre-secret-key-securisee"
BETTER_AUTH_URL="http://localhost:3000"

# Inngest - Optionnel
INNGEST_EVENT_KEY="votre-inngest-event-key"
INNGEST_SIGNING_KEY="votre-inngest-signing-key"

# AI (Vercel AI SDK) - Optionnel
OPENAI_API_KEY="votre-openai-api-key"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
createdb chronodil

# Générer le client Prisma
pnpm prisma generate

# Exécuter les migrations
pnpm db:migrate

# Alimenter la base avec les données de test
pnpm db:seed
```

### 6. Lancer l'application

```bash
# Mode développement
pnpm dev

# Mode production
pnpm build
pnpm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
Chronodil_App/
├── .husky/                    # Git hooks (pre-commit)
├── .vscode/                   # Configuration VS Code
├── prisma/
│   └── schema.prisma          # Schéma de base de données
├── src/
│   ├── app/                   # Routes Next.js (App Router)
│   │   ├── api/              # API routes
│   │   ├── auth/             # Pages d'authentification
│   │   └── dashboard/        # Pages du dashboard
│   ├── components/           # Composants React
│   │   ├── ui/              # Composants UI (shadcn)
│   │   └── layout/          # Composants de layout
│   ├── lib/                  # Utilitaires et configurations
│   │   ├── auth.ts          # Configuration Better Auth
│   │   ├── db.ts            # Client Prisma
│   │   ├── safe-action.ts   # Configuration Server Actions
│   │   └── validations/     # Schémas Zod
│   └── types/               # Types TypeScript
├── public/                   # Assets statiques
├── .env                      # Variables d'environnement
├── .prettierrc               # Configuration Prettier
├── .prettierignore           # Fichiers ignorés par Prettier
├── eslint.config.mjs         # Configuration ESLint (flat config)
├── next.config.mjs           # Configuration Next.js
└── package.json
```

## 🎨 Palette de couleurs

L'application utilise une palette de couleurs cohérente :

- **OU Crimson** (#880d1e) - Couleur primaire
- **Rusty Red** (#dd2d4a) - Boutons et accents
- **Bright Pink** (#f26a8d) - Éléments interactifs
- **Amaranth Pink** (#f49cbb) - Fond et cartes
- **Light Cyan** (#cbeef3) - Éléments secondaires

## 📚 Documentation

### Gestion des temps

1. Naviguer vers "Saisie des temps"
2. Sélectionner un projet et optionnellement une tâche
3. Renseigner la date et la durée (ou heures début/fin)
4. Ajouter une description
5. Soumettre la journée

### Validation des temps

1. Les managers accèdent à "Validation"
2. Consulter les saisies en attente
3. Approuver ou rejeter avec commentaire

### Rapports

1. Accéder à "Rapports"
2. Sélectionner la période
3. Choisir le type de rapport
4. Exporter en Excel ou PDF

## 🔧 Scripts disponibles

```bash
# Développement
pnpm dev             # Lancer en mode développement (Turbopack)
pnpm build           # Build de production
pnpm start           # Lancer en mode production

# Qualité du code
pnpm lint            # Exécuter ESLint
pnpm lint:fix        # Corriger les erreurs ESLint automatiquement
pnpm format          # Formater le code avec Prettier
pnpm format:check    # Vérifier le formatage sans modifier
pnpm check-all       # lint + format:check + tsc (vérification complète)

# Base de données
pnpm db:seed         # Alimenter la base de données
pnpm db:migrate      # Créer/exécuter une migration
pnpm db:studio       # Interface admin Prisma
pnpm db:push         # Push du schéma sans migration
pnpm db:pull         # Pull du schéma depuis la DB
```

## 🎯 Qualité du code

### Configuration ESLint + Prettier + Husky

Le projet utilise une configuration stricte pour garantir la qualité du code :

- **ESLint 9** avec flat config (`eslint.config.mjs`)
  - `next/core-web-vitals` + `next/typescript`
  - `typescript-eslint` avec `projectService: true`
  - Intégration Prettier pour éviter les conflits

- **Prettier** (`.prettierrc`)
  - 100 caractères max par ligne
  - Sans point-virgule, single quotes
  - Trailing commas

- **Husky + lint-staged** (pre-commit hook)
  - Lint et format automatique sur les fichiers staged
  - Empêche les commits avec des erreurs de lint

### VS Code

Extensions recommandées (installées automatiquement) :

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`

Auto-fix on save activé dans `.vscode/settings.json`.

## 🗣️ Dictée vocale rapide (Cursor)

- **Windows**: appuyez sur `Windows + H` dans Cursor (éditeur ou chat), puis
  dictez. Si cela ne fonctionne pas:
  - Paramètres > Confidentialité et sécurité > Microphone → autoriser les
    applications de bureau
  - Paramètres > Heure et langue > Parole → activer les services de
    reconnaissance vocale en ligne
- **macOS**: Réglages Système > Clavier > Dictée → activer; démarrer la dictée
  avec la touche `Fn` (deux pressions).
- **Astuce**: placez le curseur là où vous voulez insérer le texte avant de
  démarrer.
- **Ponctuation (fr)**: dites « virgule », « point », « point d’interrogation »,
  « point-virgule », « deux-points », « nouvelle ligne ».
- **Mise à jour**: Cursor ne propose pas encore de saisie vocale native;
  surveillez les nouveautés dans les docs: `https://docs.cursor.com`.

## 🐛 Debugging

### Problèmes de connexion à la base de données

Vérifier que PostgreSQL est démarré et que `DATABASE_URL` est correct.

### Erreur d'authentification

S'assurer que `BETTER_AUTH_SECRET` est défini dans `.env`.

### Problèmes de build

Nettoyer le cache :

```bash
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

## 💡 Pourquoi pnpm ?

- ⚡ **Plus rapide** : Installation 2x plus rapide que npm
- 💾 **Économise l'espace** : Stockage partagé des packages
- 🔒 **Plus sécurisé** : Gestion stricte des dépendances
- 🎯 **Monorepo-friendly** : Parfait pour les workspaces

## 🤝 Contribution

Ce projet est en développement actif. Pour contribuer :

1. Fork le projet
2. Installer les dépendances (`pnpm install`)
3. Créer une branche (`git checkout -b feature/AmazingFeature`)
4. Développer avec les extensions VS Code recommandées
5. Vérifier le code (`pnpm check-all`)
6. Commit les changements (Husky lint automatiquement)
7. Push vers la branche (`git push origin feature/AmazingFeature`)
8. Ouvrir une Pull Request

> **Note**: Le hook pre-commit exécute automatiquement ESLint et Prettier sur
> les fichiers modifiés.

## 📝 License

Ce projet est sous licence privée.

## 📧 Contact

Pour toute question : contact@chronodil.com

---

**Chronodil** - Gérez vos temps efficacement 🚀
