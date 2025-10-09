# Chronodil - Application de Gestion des Temps

Application web moderne et responsive pour la gestion des feuilles de temps, développée avec Next.js 14, TypeScript, Prisma et Better Auth.

![Chronodil](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

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

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript 5.6
- **Base de données**: PostgreSQL avec Prisma ORM
- **Authentification**: Better Auth
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Validation**: Zod + React Hook Form
- **Server Actions**: next-safe-action
- **État global**: Zustand
- **Notifications**: Sonner
- **Icônes**: Lucide React
- **Dates**: date-fns
- **Charts**: Recharts
- **Export**: ExcelJS, jsPDF

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 14+
- pnpm 8+ (recommandé) ou npm/yarn

## 🚀 Installation

### 1. Cloner le projet

```bash
cd Chronodil_App
```

### 2. Installer pnpm (si pas déjà installé)

```bash
npm install -g pnpm
# ou
corepack enable
corepack prepare pnpm@latest --activate
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

# Email (Resend) - Optionnel
RESEND_API_KEY="votre-resend-api-key"

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
├── next.config.js           # Configuration Next.js
├── tailwind.config.ts       # Configuration Tailwind
└── package.json
```

## 🎨 Palette de couleurs

L'application utilise une palette de couleurs cohérente :

- **OU Crimson** (#880d1e) - Couleur primaire
- **Rusty Red** (#dd2d4a) - Boutons et accents
- **Bright Pink** (#f26a8d) - Éléments interactifs
- **Amaranth Pink** (#f49cbb) - Fond et cartes
- **Light Cyan** (#cbeef3) - Éléments secondaires

## 🔑 Comptes par défaut

Après le seed de la base de données :

- **Admin**: admin@chronodil.com / Admin2025!
- **Manager**: manager@chronodil.com / Manager2025!
- **Employé**: employe@chronodil.com / Employee2025!

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
pnpm dev             # Lancer en mode développement
pnpm build           # Build de production
pnpm start           # Lancer en mode production
pnpm lint            # Linter le code
pnpm db:seed         # Alimenter la base de données
pnpm db:migrate      # Créer/exécuter une migration
pnpm db:studio       # Interface admin Prisma
```

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
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence privée.

## 📧 Contact

Pour toute question : contact@chronodil.com

---

**Chronodil** - Gérez vos temps efficacement 🚀
