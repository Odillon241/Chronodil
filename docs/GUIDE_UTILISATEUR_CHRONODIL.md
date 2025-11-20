# CHRONODIL
## Guide Utilisateur Complet
### Application de Gestion du Temps et des Projets

---

**Version du guide** : 2.0.0
**Dernière mise à jour** : Novembre 2025
**Application** : Chronodil v0.1.0 (Next.js 16)
**Auteur** : Équipe Chronodil

---

## 📋 Table des matières

1. [Introduction](#1-introduction)
2. [Premiers pas](#2-premiers-pas)
3. [Rôles et permissions](#3-rôles-et-permissions)
4. [Dashboard](#4-dashboard)
5. [Gestion des tâches](#5-gestion-des-tâches)
6. [Gestion des projets](#6-gestion-des-projets)
7. [Feuilles de temps RH](#7-feuilles-de-temps-rh)
8. [Rapports et analyses](#8-rapports-et-analyses)
9. [Chat et collaboration](#9-chat-et-collaboration)
10. [Paramètres et préférences](#10-paramètres-et-préférences)
11. [Bonnes pratiques](#11-bonnes-pratiques)
12. [Raccourcis clavier](#12-raccourcis-clavier)
13. [FAQ et dépannage](#13-faq-et-dépannage)
14. [Glossaire](#14-glossaire)

---

## 1. Introduction

### 🎯 Qu'est-ce que Chronodil ?

Chronodil est une **application moderne de gestion du temps et des projets** conçue pour améliorer la productivité et la collaboration au sein de votre organisation. Elle combine :

- ✅ **Gestion des tâches** avec 5 vues différentes
- 📊 **Suivi de projets** et gestion d'équipe
- ⏱️ **Feuilles de temps RH** avec workflow de validation
- 📈 **Rapports et analyses** personnalisables
- 💬 **Chat d'équipe** en temps réel
- 🔔 **Notifications** intelligentes

### 🌟 Avantages clés

| Avantage | Description |
|----------|-------------|
| **Interface intuitive** | Design moderne et ergonomique adapté à tous les profils |
| **Temps réel** | Synchronisation instantanée des données entre utilisateurs |
| **Flexibilité** | 5 vues de tâches pour s'adapter à votre style de travail |
| **Conformité RH** | Workflow de validation des temps conforme aux exigences légales |
| **Analyses poussées** | Tableaux de bord et rapports pour piloter votre activité |
| **Sécurité** | Authentification robuste et contrôle d'accès par rôles |

### 🎓 À qui s'adresse Chronodil ?

- **Employés** : Gérer vos tâches quotidiennes et déclarer vos temps
- **Managers** : Piloter vos équipes et valider les temps
- **RH** : Superviser les déclarations et analyser les données
- **Administrateurs** : Configurer et administrer l'application

---

## 2. Premiers pas

### 🔐 Connexion à l'application

#### Première connexion

1. **Accédez à l'URL** de Chronodil fournie par votre organisation
2. **Saisissez votre email** professionnel
3. **Entrez votre mot de passe** (fourni par l'administrateur)
4. Cliquez sur **"Se connecter"**

> 💡 **Conseil** : Lors de votre première connexion, pensez à modifier votre mot de passe dans les paramètres.

#### Comptes de démonstration

Pour tester l'application, utilisez l'un des comptes suivants :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Administrateur** | admin@chronodil.com | Admin2025! |
| **Manager** | manager@chronodil.com | Manager2025! |
| **Employé** | employe@chronodil.com | Employee2025! |

> ⚠️ **Important** : Ces comptes sont à usage de démonstration uniquement. En production, utilisez vos identifiants personnels.

### 🧭 Navigation dans l'interface

#### Barre latérale (Sidebar)

La navigation principale se trouve dans la **barre latérale gauche** :

| Icône | Section | Description | Raccourci |
|-------|---------|-------------|-----------|
| 🏠 | **Dashboard** | Vue d'ensemble et statistiques | `Ctrl+D` |
| ✅ | **Tâches** | Gestion de vos tâches quotidiennes | `Ctrl+T` |
| 📁 | **Projets** | Vos projets et leurs équipes | `Ctrl+P` |
| 📋 | **Feuilles RH** | Activités RH hebdomadaires | `Ctrl+H` |
| 📊 | **Rapports** | Analyses et exports de données | `Ctrl+R` |
| 💬 | **Chat** | Messagerie d'équipe | `Ctrl+M` |

#### Barre supérieure (Header)

En haut de page, vous trouverez :

- **🔍 Recherche globale** (`Ctrl+K`) : Recherche rapide dans toutes les données
- **🔔 Notifications** : Centre de notifications en temps réel
- **👤 Profil utilisateur** : Accès aux paramètres et déconnexion

#### Palette de commandes

Utilisez **Ctrl+K** pour ouvrir la **palette de commandes** et accéder rapidement à n'importe quelle fonction :

```
Ctrl+K → "nouvelle tâche" → Entrée
Ctrl+K → "rapport hebdomadaire" → Entrée
```

### 🎨 Thème et apparence

Chronodil propose deux thèmes :

- **☀️ Mode clair** : Pour une utilisation en journée
- **🌙 Mode sombre** : Pour réduire la fatigue visuelle

Changez de thème via le menu utilisateur (icône en haut à droite).

---

## 3. Rôles et permissions

Chronodil utilise un **système de rôles hiérarchiques** avec 5 niveaux. Chaque rôle hérite des permissions du niveau inférieur.

### 👤 EMPLOYEE (Employé)

**Niveau de base** pour tous les utilisateurs de l'application.

#### Permissions

✅ **Tâches**
- Créer ses propres tâches
- Modifier et supprimer ses tâches
- Voir les tâches des projets dont il est membre
- Commenter les tâches

✅ **Projets**
- Consulter les projets auxquels il est affecté
- Voir les membres de l'équipe projet
- Suivre l'avancement du projet

✅ **Feuilles de temps**
- Créer et modifier ses feuilles de temps (statut DRAFT)
- Soumettre ses feuilles pour validation
- Consulter l'historique de ses déclarations

✅ **Chat**
- Envoyer et recevoir des messages
- Participer aux conversations d'équipe

✅ **Profil**
- Modifier ses informations personnelles
- Gérer ses préférences

#### Cas d'usage typique

> **Marie, développeuse** : Elle crée ses tâches quotidiennes, les organise en Kanban, déclare ses temps hebdomadaires et communique avec son équipe via le chat.

---

### 👨‍💼 MANAGER (Responsable)

**Gestion d'équipe** et première validation des temps.

#### Permissions additionnelles

✅ **Projets**
- **Créer** de nouveaux projets
- **Affecter** des membres aux projets
- **Modifier** les informations des projets
- **Archiver** des projets terminés

✅ **Validation**
- **Valider** les feuilles de temps de son équipe (PENDING → MANAGER_APPROVED)
- **Rejeter** une feuille avec commentaire explicatif
- Voir le statut de validation en temps réel

✅ **Équipe**
- Consulter les tâches de ses collaborateurs
- Voir les statistiques d'équipe
- Réaffecter des tâches

#### Workflow de validation Manager

```
1. Employé soumet sa feuille → Statut PENDING
2. Manager reçoit une notification
3. Manager consulte la feuille
4. Manager valide → MANAGER_APPROVED (ou rejette → DRAFT)
5. Feuille passe à l'étape suivante (validation RH)
```

#### Cas d'usage typique

> **Thomas, Chef de projet** : Il crée des projets, affecte son équipe, suit l'avancement des tâches via Gantt, et valide les feuilles de temps chaque vendredi.

---

### 👔 HR (Ressources Humaines)

**Gestion RH globale** et validation finale des temps.

#### Permissions additionnelles

✅ **Validation finale**
- **Approuver** définitivement les feuilles (MANAGER_APPROVED → APPROVED)
- **Signature Odillon** : Validation officielle conforme
- **Rejeter** vers le manager avec motif

✅ **Gestion utilisateurs**
- Créer des comptes utilisateurs
- Modifier les informations RH (département, poste)
- Désactiver des comptes
- Gérer les droits d'accès

✅ **Audit**
- Accès aux **logs d'audit** complets
- Traçabilité de toutes les actions
- Export des données RH

✅ **Rapports RH**
- Rapports de temps par département
- Analyses d'activité globale
- Export massif pour paie

#### Workflow de validation RH

```
1. Manager approuve → Statut MANAGER_APPROVED
2. RH reçoit notification
3. RH vérifie conformité
4. RH approuve → APPROVED (signature Odillon)
5. Feuille verrouillée et archivée
```

#### Cas d'usage typique

> **Sophie, DRH** : Elle valide les feuilles hebdomadaires, génère les rapports mensuels pour la paie, gère les comptes utilisateurs et consulte les logs d'audit.

---

### 🔧 ADMIN (Administrateur)

**Contrôle total** de l'application.

#### Permissions additionnelles

✅ **Administration système**
- Accès aux **paramètres globaux**
- Configuration de l'authentification
- Gestion des intégrations (API)
- Maintenance de la base de données

✅ **Gestion des rôles**
- Attribuer/modifier les rôles utilisateurs
- Créer des rôles personnalisés (futur)
- Gérer les permissions fines

✅ **Support technique**
- Accès aux logs système
- Débogage en temps réel
- Résolution des problèmes techniques

✅ **Sécurité**
- Gestion des sessions
- Contrôle d'accès IP (si configuré)
- Audit de sécurité

#### Cas d'usage typique

> **Lucas, Admin IT** : Il configure l'application, gère les comptes, résout les problèmes techniques, effectue les mises à jour et garantit la sécurité du système.

---

### 📊 Tableau récapitulatif des permissions

| Fonctionnalité | EMPLOYEE | MANAGER | HR | ADMIN |
|----------------|----------|---------|-----|-------|
| Gérer ses tâches | ✅ | ✅ | ✅ | ✅ |
| Voir tâches d'équipe | ⚠️ Limitée | ✅ | ✅ | ✅ |
| Créer projets | ❌ | ✅ | ✅ | ✅ |
| Soumettre feuille temps | ✅ | ✅ | ✅ | ✅ |
| Validation Manager | ❌ | ✅ | ✅ | ✅ |
| Validation RH finale | ❌ | ❌ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ✅ | ✅ |
| Logs d'audit | ❌ | ⚠️ Limités | ✅ | ✅ |
| Paramètres système | ❌ | ❌ | ❌ | ✅ |

> 💡 **Légende** : ✅ Accès complet | ⚠️ Accès partiel | ❌ Pas d'accès

---

## 4. Dashboard

Le **Dashboard** est votre **point d'entrée** dans Chronodil. Il offre une **vue d'ensemble** de toutes vos activités en temps réel.

### 📊 Widgets disponibles

#### 1. Vue d'ensemble (Aperçu)

**Indicateurs clés** affichés en haut de page :

```
┌─────────────────────────────────────────────────────────┐
│  📋 12 Tâches actives  │  ⏱️ 35h cette semaine  │  ✅ 8 Terminées  │
└─────────────────────────────────────────────────────────┘
```

- **Tâches actives** : Nombre de tâches en cours (TODO + IN_PROGRESS)
- **Heures travaillées** : Total de la semaine en cours
- **Tâches terminées** : Nombre de tâches complétées ce mois

#### 2. Tâches du jour

Liste des **tâches prioritaires** avec échéance aujourd'hui :

- Triées par priorité (HIGH → MEDIUM → LOW)
- Statut visuel (couleur selon urgence)
- Action rapide : Marquer comme terminée en 1 clic

> 💡 **Astuce** : Glissez-déposez les tâches pour réorganiser vos priorités.

#### 3. Activité récente

Fil d'actualité des **dernières actions** :

```
• Thomas a validé votre feuille de temps (il y a 5 min)
• Nouvelle tâche assignée : "Révision du rapport" (il y a 1h)
• Marie a commenté "Design homepage" (il y a 2h)
```

#### 4. Projets en cours

**Cartes projet** avec indicateurs de progression :

```
┌──────────────────────────────────┐
│  Site Web Entreprise             │
│  ███████████░░░░░░░  68%         │
│  👥 5 membres  │  📅 J-12        │
└──────────────────────────────────┘
```

- Barre de progression
- Nombre de membres
- Jours restants avant échéance

#### 5. Graphique d'activité

**Graphique hebdomadaire** des heures travaillées :

```
Heures par jour
   8h ┤     ╭─╮
   6h ┤   ╭─╯ ╰╮
   4h ┤ ╭─╯    ╰─╮
   2h ┤─╯        ╰──
      └──────────────
      L M M J V S D
```

#### 6. Feuilles de temps en attente

**Pour les Managers/RH** : Liste des feuilles à valider

```
⏳ 3 feuilles en attente de validation
• Marie Dupont - Semaine 46 (PENDING)
• Jean Martin - Semaine 46 (MANAGER_APPROVED)
```

### 🎛️ Personnalisation du Dashboard

Cliquez sur **⚙️ Personnaliser** pour :

- ✅ Afficher/masquer les widgets
- 🔄 Réorganiser les widgets (glisser-déposer)
- 🎨 Choisir les couleurs des graphiques
- 📊 Sélectionner la période d'analyse (semaine, mois, année)

> 💡 **Bonnes pratiques** : Configurez votre dashboard selon votre rôle. Un manager privilégiera les widgets d'équipe, un employé les tâches personnelles.

---

## 5. Gestion des tâches

Le module **Tâches** est le **cœur** de votre organisation quotidienne. Chronodil propose **5 vues complémentaires** pour s'adapter à votre style de travail.

### 📋 Les 5 vues disponibles

#### 1. 📝 Vue Liste

**Tableau détaillé** avec toutes les informations :

- **Colonnes** : Nom, Projet, Statut, Priorité, Assigné, Échéance
- **Tri** : Cliquez sur les en-têtes de colonnes
- **Filtres** : Par statut, priorité, projet, assigné
- **Recherche** : Champ de recherche en haut

**Quand utiliser ?**
- Besoin de voir beaucoup de détails
- Tri et filtrage avancés
- Export de données

#### 2. 📊 Vue Kanban

**Colonnes par statut** avec glisser-déposer :

```
┌─────────────┬─────────────┬─────────────┐
│  À FAIRE    │  EN COURS   │  TERMINÉ    │
├─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │ Tâche 1 │ │ │ Tâche 3 │ │ │ Tâche 5 │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │
│ ┌─────────┐ │ ┌─────────┐ │             │
│ │ Tâche 2 │ │ │ Tâche 4 │ │             │
│ └─────────┘ │ └─────────┘ │             │
└─────────────┴─────────────┴─────────────┘
```

**Quand utiliser ?**
- Méthode Agile/Scrum
- Visualisation du flux de travail
- Réorganisation rapide

> 💡 **Astuce** : Glissez une carte d'une colonne à l'autre pour changer son statut instantanément.

#### 3. 📅 Vue Calendrier

**Organisation par dates** d'échéance :

```
        Novembre 2025
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
│     │ 📌2 │     │ 📌1 │ 📌3 │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
```

**Quand utiliser ?**
- Planification hebdomadaire/mensuelle
- Gestion des échéances
- Vue chronologique

#### 4. 📈 Vue Gantt

**Timeline de projet** avec dépendances :

```
Tâche         Nov |─────────────────────────|
──────────────────┼──────────────────────────
Tâche 1       ████████░░░░░░░░░░░░
Tâche 2            ████████░░░░░░░░
Tâche 3                 ████████
```

**Quand utiliser ?**
- Planification de projet complexe
- Visualisation des dépendances
- Suivi de la charge de travail

**Fonctionnalités** :
- Zoom timeline (jour, semaine, mois)
- Glisser-déposer pour déplacer les tâches
- Créer des dépendances entre tâches

#### 5. 🗺️ Vue Roadmap

**Vision stratégique long terme** :

```
Q4 2025                    Q1 2026
├───────────────────────────┼─────────────────
│ Phase 1: Conception      │ Phase 2: Dev
│ ████████████              │
│                          │ Phase 3: Tests
│                          │      ████████
```

**Quand utiliser ?**
- Planification stratégique
- Communication avec stakeholders
- Vision d'ensemble multi-projets

### ➕ Créer une tâche

#### Méthode 1 : Bouton "+"

1. Cliquez sur le bouton **"+"** en haut à droite
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Nom** | ✅ Oui | Titre court et descriptif |
| **Description** | ⚠️ Recommandé | Détails, contexte, objectifs |
| **Projet** | ❌ Non | Projet parent (optionnel) |
| **Statut** | ✅ Oui | TODO / IN_PROGRESS / DONE |
| **Priorité** | ✅ Oui | LOW / MEDIUM / HIGH |
| **Complexité** | ⚠️ Recommandé | FAIBLE / MOYEN / ÉLEVÉ |
| **Assigné à** | ❌ Non | Membre de l'équipe |
| **Date d'échéance** | ⚠️ Recommandé | Date limite |
| **Heures estimées** | ❌ Non | Estimation en heures |

3. Cliquez sur **"Créer la tâche"**

#### Méthode 2 : Raccourci clavier

```
Ctrl+N → Ouvre le formulaire de création rapide
```

#### Méthode 3 : Depuis le Kanban

- Cliquez sur **"+ Ajouter"** dans une colonne
- La tâche est créée directement avec le statut de la colonne

### ✏️ Modifier une tâche

#### Accès au formulaire d'édition

- **Vue Liste** : Cliquez sur l'icône ✏️
- **Vue Kanban** : Cliquez sur la carte
- **Toutes vues** : Double-clic sur la tâche

#### Modifications rapides

**Sans ouvrir le formulaire** :

- **Kanban** : Glisser-déposer entre colonnes (change le statut)
- **Gantt** : Glisser-déposer sur la timeline (change les dates)
- **Liste** : Clic sur le statut/priorité (menu déroulant)

### 🔗 Synchronisation bidirectionnelle

> 💡 **Fonctionnalité unique** : Chronodil synchronise automatiquement les tâches et les activités RH.

#### Scénario 1 : Création depuis Tâches

```
1. Vous créez une tâche "Formation Next.js"
2. Vous créez une feuille de temps RH
3. Vous pouvez sélectionner "Formation Next.js" dans la liste
4. Les informations sont pré-remplies automatiquement
```

#### Scénario 2 : Création depuis Feuilles RH (saisie manuelle)

```
1. Vous créez une feuille de temps RH
2. Vous choisissez "Saisie manuelle"
3. Vous remplissez les champs (nom, description, etc.)
4. Une tâche est créée AUTOMATIQUEMENT
5. La tâche apparaît dans le module Tâches
```

> ⚠️ **Important** : Cette synchronisation garantit qu'aucune activité RH n'est "perdue" et que tout est traçable via les tâches.

### 🗑️ Supprimer une tâche

1. Ouvrez la tâche (mode édition)
2. Cliquez sur **"🗑️ Supprimer"** (en bas du formulaire)
3. Confirmez la suppression

> ⚠️ **Attention** : La suppression est **définitive** et **irréversible**. Assurez-vous de vouloir vraiment supprimer la tâche.

**Alternative** : Plutôt que supprimer, vous pouvez :
- Passer le statut à DONE
- Archiver le projet parent
- Marquer comme "inactive"

### 🔍 Filtrer et rechercher

#### Filtres rapides

En haut de chaque vue, utilisez les filtres :

- **Statut** : TODO, IN_PROGRESS, DONE, TOUS
- **Priorité** : LOW, MEDIUM, HIGH, TOUTES
- **Projet** : Sélectionnez un projet spécifique
- **Assigné** : Mes tâches / Équipe / Tous

#### Recherche textuelle

Champ de recherche en temps réel :

```
Tapez "rapport" → Filtrage instantané sur :
- Nom de la tâche
- Description
- Commentaires
- Tags
```

#### Filtres avancés (Vue Liste)

Cliquez sur **"Filtres avancés"** pour combiner :

- Date de création (entre le X et le Y)
- Date d'échéance (prochains 7 jours, ce mois, etc.)
- Complexité
- Nombre d'heures estimées

### 💬 Commentaires et collaboration

#### Ajouter un commentaire

1. Ouvrez une tâche
2. Scrollez jusqu'à la section **"Commentaires"**
3. Tapez votre message
4. Cliquez sur **"Envoyer"**

#### Mentions

Mentionnez un utilisateur pour le notifier :

```
@marie Peux-tu valider cette approche ?
```

Marie recevra une notification instantanée.

#### Pièces jointes (futur)

> 🚀 **Prochainement** : Vous pourrez joindre des fichiers aux tâches (images, PDF, etc.)

---

## 6. Gestion des projets

Les **Projets** permettent de **regrouper des tâches** et d'**organiser des équipes** autour d'objectifs communs.

> 📌 **Disponible pour** : MANAGER, HR, ADMIN

### 📁 Qu'est-ce qu'un projet ?

Un projet dans Chronodil contient :

- **Informations** : Nom, description, dates, statut
- **Équipe** : Liste des membres affectés
- **Tâches** : Ensemble de tâches liées au projet
- **Statistiques** : Progression, heures, budget

### ➕ Créer un projet

#### Étapes

1. Allez dans **Projets** (barre latérale)
2. Cliquez sur **"+ Nouveau projet"**
3. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Nom** | ✅ Oui | Nom du projet |
| **Description** | ⚠️ Recommandé | Objectifs, contexte |
| **Date de début** | ❌ Non | Date de lancement |
| **Date de fin** | ⚠️ Recommandé | Échéance globale |
| **Statut** | ✅ Oui | ACTIVE / ARCHIVED |
| **Budget** | ❌ Non | Budget alloué (optionnel) |
| **Chef de projet** | ⚠️ Recommandé | Manager responsable |

4. Cliquez sur **"Créer le projet"**

### 👥 Gérer l'équipe projet

#### Ajouter des membres

1. Ouvrez le projet
2. Cliquez sur l'onglet **"Équipe"**
3. Cliquez sur **"+ Ajouter un membre"**
4. Sélectionnez les utilisateurs
5. Définissez leur rôle (optionnel) :
   - **Chef de projet** : Responsable principal
   - **Membre** : Contributeur standard
   - **Observer** : Lecture seule (futur)

6. Cliquez sur **"Ajouter"**

#### Retirer des membres

1. Cliquez sur l'icône **"🗑️"** à côté du membre
2. Confirmez le retrait

> ⚠️ **Attention** : Les tâches assignées au membre restent inchangées. Réaffectez-les manuellement si nécessaire.

### 📊 Suivre l'avancement

#### Tableau de bord projet

Chaque projet dispose d'un **tableau de bord dédié** :

```
┌────────────────────────────────────────────────┐
│  📁 Site Web Entreprise                        │
│  ████████████░░░░░░░░  68% complété            │
├────────────────────────────────────────────────┤
│  📋 12/18 tâches terminées                     │
│  ⏱️ 145h / 200h estimées                       │
│  👥 5 membres                                  │
│  📅 Échéance: 31/12/2025 (J-42)                │
└────────────────────────────────────────────────┘
```

#### Graphiques d'avancement

- **Burndown chart** : Visualiser la vélocité
- **Répartition par statut** : Camembert TODO/IN_PROGRESS/DONE
- **Heures par membre** : Diagramme en barres

### 📋 Lier des tâches au projet

#### Méthode 1 : Lors de la création de tâche

Sélectionnez le projet dans le champ **"Projet"** du formulaire.

#### Méthode 2 : Depuis le projet

1. Ouvrez le projet
2. Onglet **"Tâches"**
3. Cliquez sur **"+ Nouvelle tâche"**
4. Le projet est pré-sélectionné

#### Méthode 3 : Réaffecter une tâche existante

1. Éditez la tâche
2. Changez le champ **"Projet"**
3. Enregistrez

### 🗂️ Archiver un projet

Lorsqu'un projet est terminé :

1. Ouvrez le projet
2. Cliquez sur **"⚙️ Paramètres"**
3. Changez le statut à **"ARCHIVED"**
4. Enregistrez

**Effet** :
- Le projet n'apparaît plus dans la liste active
- Les tâches restent accessibles
- Les données sont conservées pour les rapports

**Restaurer** : Repassez le statut à **"ACTIVE"**

### 🔒 Permissions sur les projets

| Action | EMPLOYEE | MANAGER | HR | ADMIN |
|--------|----------|---------|-----|-------|
| Voir projet (si membre) | ✅ | ✅ | ✅ | ✅ |
| Créer projet | ❌ | ✅ | ✅ | ✅ |
| Modifier projet | ❌ | ✅ (si chef) | ✅ | ✅ |
| Ajouter membres | ❌ | ✅ (si chef) | ✅ | ✅ |
| Archiver projet | ❌ | ✅ (si chef) | ✅ | ✅ |
| Supprimer projet | ❌ | ❌ | ❌ | ✅ |

---

## 7. Feuilles de temps RH

Les **Feuilles de temps RH** permettent de déclarer vos **activités hebdomadaires** pour le suivi RH et la paie. Elles suivent un **workflow de validation structuré**.

### 📋 Structure d'une feuille de temps

Chaque feuille contient :

- **En-tête** : Semaine, collaborateur, poste, site
- **Activités** : Liste des tâches effectuées avec :
  - Nom de l'activité
  - Description
  - Dates (début/fin)
  - Nombre d'heures
  - Périodicité (quotidien, hebdomadaire, etc.)
  - Type d'activité RH
- **Totaux** : Heures totales de la semaine
- **Validations** : Statut et signatures

### 🔄 Workflow de validation

Une feuille passe par **4 étapes** :

```
1. DRAFT (Brouillon)
   ↓ [Employé soumet]
2. PENDING (En attente validation)
   ↓ [Manager valide]
3. MANAGER_APPROVED (Validé par manager)
   ↓ [RH valide]
4. APPROVED (Validé final - Signature Odillon)
```

#### Détails des statuts

| Statut | Modifiable | Actions disponibles | Qui agit |
|--------|------------|---------------------|----------|
| **DRAFT** | ✅ Oui | Éditer, Supprimer, Soumettre | Employé |
| **PENDING** | ❌ Non | Valider, Rejeter | Manager |
| **MANAGER_APPROVED** | ❌ Non | Approuver, Rejeter | RH |
| **APPROVED** | ❌ Non | Export | RH |

### ➕ Créer une feuille de temps

#### Étape 1 : Accès

1. Cliquez sur **"Feuilles RH"** (barre latérale)
2. Cliquez sur **"+ Nouvelle feuille de temps"**

#### Étape 2 : Informations générales

Remplissez l'en-tête :

| Champ | Description |
|-------|-------------|
| **Semaine** | Sélectionnez la semaine (ex: Semaine 46 - 2025) |
| **Poste** | Votre fonction (ex: Développeur Full Stack) |
| **Site** | Lieu de travail (ex: Paris - Siège) |
| **Notes** | Commentaires généraux (optionnel) |

#### Étape 3 : Ajouter des activités

Vous avez **2 méthodes** pour ajouter des activités :

##### Méthode 1 : Tâche existante (recommandée)

1. Cliquez sur **"+ Ajouter une activité"**
2. Sélectionnez **"Tâche existante"**
3. Choisissez la tâche dans la liste
4. Les champs sont **pré-remplis** automatiquement :
   - Nom
   - Description
   - Type d'activité
   - Complexité
5. Ajustez si nécessaire :
   - Dates (début/fin)
   - Heures travaillées
   - Périodicité

##### Méthode 2 : Saisie manuelle

1. Cliquez sur **"+ Ajouter une activité"**
2. Sélectionnez **"Saisie manuelle"**
3. Remplissez tous les champs :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Nom** | ✅ | Nom de l'activité |
| **Description** | ⚠️ Recommandé | Détails de l'activité |
| **Type d'activité** | ✅ | DEVELOPMENT, MEETING, FORMATION, etc. |
| **Nom d'activité** | ❌ | Classification supplémentaire |
| **Date de début** | ✅ | Date de début |
| **Date de fin** | ✅ | Date de fin |
| **Heures** | ✅ | Nombre d'heures (ex: 7.5) |
| **Périodicité** | ✅ | DAILY, WEEKLY, MONTHLY, ONE_TIME |
| **Complexité** | ⚠️ Recommandé | FAIBLE, MOYEN, ÉLEVÉ |

4. Cliquez sur **"Ajouter"**

> 💡 **Synchronisation** : Une tâche sera **créée automatiquement** pour cette activité, assurant la traçabilité.

#### Étape 4 : Vérifier le total

Le total des heures s'affiche en bas :

```
┌────────────────────────────┐
│  Total semaine: 37.5h      │
│  ────────────────────────  │
│  Lundi:     7.5h           │
│  Mardi:     7.5h           │
│  Mercredi:  7.5h           │
│  Jeudi:     7.5h           │
│  Vendredi:  7.5h           │
└────────────────────────────┘
```

> ⚠️ **Vérification** : Assurez-vous que le total correspond à vos heures contractuelles (ex: 35h, 39h).

#### Étape 5 : Soumettre

1. Vérifiez que toutes les activités sont correctes
2. Cliquez sur **"Soumettre pour validation"**
3. Confirmez

**Résultat** :
- Statut passe à **PENDING**
- Manager reçoit une **notification**
- Vous ne pouvez **plus modifier** la feuille

### ✏️ Modifier une feuille

#### Feuille en statut DRAFT

Cliquez sur **"✏️ Modifier"** pour :
- Ajouter/supprimer des activités
- Modifier les heures
- Changer les dates

#### Feuille en statut PENDING, MANAGER_APPROVED, APPROVED

**Impossible de modifier directement**.

**Pour modifier** :
1. Contactez votre manager/RH
2. Ils peuvent **rejeter** la feuille
3. Elle repasse en statut **DRAFT**
4. Vous pouvez maintenant modifier
5. Resoumettez après correction

### ✅ Valider une feuille (Manager/RH)

#### Pour les Managers

1. Allez dans **"Feuilles RH"**
2. Filtrez par statut **"PENDING"**
3. Cliquez sur une feuille à valider
4. Vérifiez les activités :
   - Cohérence des heures
   - Description suffisante
   - Conformité avec le travail réalisé
5. **Option 1 : Valider**
   - Cliquez sur **"✅ Valider"**
   - La feuille passe à **MANAGER_APPROVED**
6. **Option 2 : Rejeter**
   - Cliquez sur **"❌ Rejeter"**
   - Ajoutez un **commentaire explicatif**
   - La feuille repasse à **DRAFT**

#### Pour les RH

1. Filtrez par statut **"MANAGER_APPROVED"**
2. Vérifiez la conformité légale :
   - Respect du temps de travail
   - Cohérence avec le contrat
   - Signatures présentes
3. **Option 1 : Approuver (Signature Odillon)**
   - Cliquez sur **"✅ Approuver définitivement"**
   - Confirmez la signature Odillon
   - La feuille passe à **APPROVED**
   - **Verrouillage final** : Plus aucune modification possible
4. **Option 2 : Rejeter vers Manager**
   - Cliquez sur **"❌ Rejeter"**
   - Expliquez le motif
   - La feuille repasse à **PENDING**

### 📊 Rapport hebdomadaire

Une fois **APPROVED**, la feuille est :

- **Verrouillée** définitivement
- **Disponible pour export** (Excel, PDF)
- **Intégrée** aux rapports de paie
- **Archivée** avec signature Odillon

### 📤 Exporter une feuille

1. Ouvrez la feuille (statut APPROVED)
2. Cliquez sur **"📤 Exporter"**
3. Choisissez le format :
   - **Excel** : Pour traitement paie
   - **PDF** : Pour archivage papier
   - **JSON** : Pour intégration système

### 🔔 Notifications

Vous recevez des **notifications** automatiques :

| Événement | Destinataire | Message |
|-----------|--------------|---------|
| Feuille soumise | Manager | "Marie a soumis sa feuille S46" |
| Feuille validée (Manager) | Employé + RH | "Votre feuille S46 a été validée" |
| Feuille approuvée (RH) | Employé | "Votre feuille S46 est approuvée" |
| Feuille rejetée | Employé | "Votre feuille S46 a été rejetée : [motif]" |

### ⚠️ Bonnes pratiques

| ✅ À faire | ❌ À éviter |
|-----------|-----------|
| Déclarer vos temps chaque vendredi | Attendre la fin du mois |
| Être précis dans les descriptions | Laisser vide ou "divers" |
| Vérifier le total avant soumission | Soumettre sans relire |
| Utiliser les tâches existantes | Toujours en saisie manuelle |
| Respecter la périodicité réelle | Mettre tout en "quotidien" |

---

## 8. Rapports et analyses

Le module **Rapports** permet de **générer des analyses** et d'**exporter des données** pour le pilotage de l'activité.

> 📌 **Accès** : Tous les rôles (rapports personnels) | MANAGER, HR, ADMIN (rapports d'équipe)

### 📊 Types de rapports disponibles

#### 1. Rapport personnel

**Pour les employés** : Vos statistiques individuelles

- Heures travaillées (semaine, mois, année)
- Tâches terminées
- Répartition par projet
- Historique des feuilles de temps

**Accès** : `Rapports > Mon activité`

#### 2. Rapport d'équipe

**Pour les managers** : Statistiques de votre équipe

- Heures par collaborateur
- Tâches en retard
- Charge de travail (capacité vs planifié)
- Projets en cours

**Accès** : `Rapports > Mon équipe`

#### 3. Rapport global

**Pour HR/ADMIN** : Vue d'ensemble de l'organisation

- Total heures par département
- Coûts par projet
- Analyse de la productivité
- Données de paie

**Accès** : `Rapports > Organisation`

### 📈 Générer un rapport

#### Étape 1 : Sélectionner le type

1. Cliquez sur **"Rapports"** (barre latérale)
2. Choisissez le type de rapport

#### Étape 2 : Configurer les filtres

| Filtre | Options |
|--------|---------|
| **Période** | Semaine, Mois, Trimestre, Année, Personnalisée |
| **Utilisateurs** | Tous, Équipe, Département, Sélection manuelle |
| **Projets** | Tous, Actifs, Archivés, Sélection |
| **Statuts** | TODO, IN_PROGRESS, DONE, Tous |

#### Étape 3 : Sélectionner les métriques

Cochez les indicateurs à inclure :

- ✅ Heures totales
- ✅ Nombre de tâches
- ✅ Taux de complétion
- ✅ Budget consommé
- ✅ Répartition par priorité
- ✅ Délais de validation

#### Étape 4 : Générer

Cliquez sur **"📊 Générer le rapport"**

Le rapport s'affiche avec :
- **Graphiques** interactifs
- **Tableaux** de données
- **Indicateurs clés**

### 📤 Exporter un rapport

Une fois généré, cliquez sur **"📤 Exporter"** :

| Format | Usage |
|--------|-------|
| **Excel (.xlsx)** | Analyse approfondie, traitement données |
| **PDF** | Présentation, archivage |
| **CSV** | Import dans autres outils |
| **JSON** | Intégration API |

### 📊 Rapports prédéfinis

Chronodil propose des **modèles de rapports** prêts à l'emploi :

#### 1. Rapport hebdomadaire

**Configuration automatique** :
- Période : Semaine en cours
- Données : Heures, tâches, projets
- Format : PDF

**Envoi** : Par email chaque lundi matin (optionnel)

#### 2. Rapport mensuel de paie

**Pour RH** :
- Période : Mois précédent
- Données : Heures approuvées, feuilles validées
- Format : Excel
- Export automatique le 1er du mois

#### 3. Dashboard projet

**Pour managers** :
- Progression du projet
- Tâches par membre
- Budget vs réalisé
- Timeline Gantt

### 🎨 Personnaliser un rapport

Créez vos **modèles personnalisés** :

1. Configurez un rapport
2. Cliquez sur **"💾 Enregistrer comme modèle"**
3. Donnez un nom
4. Le modèle apparaît dans **"Mes modèles"**

**Avantages** :
- Regénération en 1 clic
- Planification automatique
- Partage avec l'équipe

### 🔔 Planifier un rapport

Pour recevoir un rapport **automatiquement** :

1. Générez le rapport
2. Cliquez sur **"⏰ Planifier"**
3. Configurez :
   - **Fréquence** : Quotidien, Hebdomadaire, Mensuel
   - **Jour** : Lundi, Vendredi, 1er du mois, etc.
   - **Heure** : 08:00, 17:00, etc.
   - **Format** : Excel, PDF
   - **Destinataires** : Vous, équipe, RH
4. Cliquez sur **"Activer"**

**Exemple** :
```
Rapport hebdomadaire équipe
• Tous les vendredis à 17:00
• Format : PDF
• Envoyé à : vous + manager@chronodil.com
```

### 📊 Indicateurs clés (KPI)

#### Pour les employés

- **Heures semaine** : Total semaine en cours
- **Tâches complétées** : Nombre de DONE ce mois
- **Taux de complétion** : Pourcentage de tâches terminées dans les délais
- **Moyenne heures/jour** : Tendance hebdomadaire

#### Pour les managers

- **Charge équipe** : Heures planifiées vs disponibles
- **Vélocité** : Nombre de tâches terminées / semaine
- **Tâches en retard** : Échéance dépassée
- **Taux de validation** : % de feuilles validées en temps

#### Pour RH/Admin

- **Total heures organisation** : Toutes équipes
- **Coût par projet** : Budget vs réalisé
- **Taux d'approbation** : % de feuilles approuvées sans rejet
- **Conformité** : % de feuilles dans les délais

---

## 9. Chat et collaboration

Le module **Chat** permet la **communication en temps réel** entre les membres de l'équipe.

> 🚀 **Temps réel** : Les messages sont synchronisés instantanément via WebSocket.

### 💬 Types de conversations

#### 1. Messages directs (DM)

**Conversation privée** entre 2 utilisateurs :

- 🔒 Privé et confidentiel
- Notifications push
- Historique complet

**Créer** :
1. Cliquez sur **"💬 Chat"**
2. Cliquez sur **"+ Nouveau message"**
3. Sélectionnez un utilisateur
4. Tapez votre message

#### 2. Canaux de projet

**Discussion d'équipe** par projet :

- 👥 Tous les membres du projet
- Contexte partagé
- Historique projet

**Accès** : Automatiquement créés pour chaque projet

#### 3. Canaux d'équipe (futur)

> 🚀 **Prochainement** : Canaux thématiques (Général, Annonces, Support, etc.)

### ✉️ Envoyer un message

1. Sélectionnez une conversation (liste de gauche)
2. Tapez votre message dans le champ
3. **Option 1** : Appuyez sur **Entrée**
4. **Option 2** : Cliquez sur **"Envoyer"**

### 🔔 Mentions

**Mentionner** un utilisateur pour le notifier :

```
@marie Peux-tu vérifier ce rapport ?
```

**Mentionner tout le monde** :

```
@all Réunion dans 10 minutes !
```

### 📎 Pièces jointes (futur)

> 🚀 **Prochainement** : Envoi de fichiers (images, PDF, etc.)

### 🔍 Rechercher dans le chat

**Barre de recherche** en haut :

```
Rechercher : "rapport" → Tous les messages contenant "rapport"
```

**Filtres** :
- Par utilisateur
- Par date
- Par canal

### 🔕 Notifications

#### Paramètres de notification

Configurez vos préférences :

1. Cliquez sur **⚙️ Paramètres**
2. Section **"Notifications"**
3. Choisissez :
   - **Toujours** : Tous les messages
   - **Mentions uniquement** : Seulement si @vous
   - **Jamais** : Désactiver

#### Sons et alertes

- **Son** : Notification sonore (activable)
- **Bureau** : Notifications système (navigateur)
- **Email** : Résumé par email (configurable)

### ⏰ Statut de présence

Votre statut s'affiche automatiquement :

- 🟢 **En ligne** : Connecté et actif
- 🟡 **Absent** : Inactif > 10 min
- 🔴 **Hors ligne** : Déconnecté

**Définir manuellement** :
- Cliquez sur votre nom (en haut à droite)
- Sélectionnez le statut

### 📌 Épingler un message

**Messages importants** :

1. Survolez le message
2. Cliquez sur l'icône **"📌 Épingler"**
3. Le message reste en haut de la conversation

**Accéder** : Cliquez sur **"📌 Messages épinglés"**

---

## 10. Paramètres et préférences

Personnalisez votre expérience Chronodil dans les **Paramètres**.

**Accès** : Cliquez sur votre **avatar** (en haut à droite) → **"⚙️ Paramètres"**

### 👤 Profil

#### Informations personnelles

| Champ | Modifiable | Description |
|-------|------------|-------------|
| **Email** | ❌ Non | Email de connexion (contact admin pour modifier) |
| **Nom complet** | ✅ Oui | Prénom + Nom |
| **Avatar** | ✅ Oui | Photo de profil |
| **Téléphone** | ✅ Oui | Numéro de téléphone |
| **Poste** | ⚠️ RH/Admin | Fonction dans l'entreprise |
| **Département** | ⚠️ RH/Admin | Service de rattachement |

#### Changer l'avatar

1. Cliquez sur **"Modifier l'avatar"**
2. **Option 1** : Télécharger une image (JPG, PNG)
3. **Option 2** : Utiliser Gravatar (basé sur email)
4. Recadrez si nécessaire
5. Enregistrez

### 🔐 Sécurité

#### Changer le mot de passe

1. Section **"Sécurité"**
2. Cliquez sur **"Modifier le mot de passe"**
3. Remplissez :
   - Mot de passe actuel
   - Nouveau mot de passe
   - Confirmation
4. Cliquez sur **"Mettre à jour"**

**Exigences** :
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial

#### Sessions actives

Consultez vos **sessions actives** :

```
🖥️ Chrome - Windows - Paris (Actuelle)
📱 Safari - iPhone - Lyon (il y a 2h)
```

**Révoquer** : Cliquez sur **"Déconnecter"** pour fermer une session

### 🔔 Notifications

#### Types de notifications

| Type | Par défaut | Configurable |
|------|------------|--------------|
| **Tâches assignées** | ✅ Activé | Oui |
| **Mentions (@vous)** | ✅ Activé | Oui |
| **Validations** | ✅ Activé | Oui |
| **Commentaires** | ⚠️ Mentions uniquement | Oui |
| **Projets** | ✅ Activé | Oui |
| **Rapports** | ❌ Désactivé | Oui |

#### Canaux de notification

Pour chaque type, choisissez le canal :

- ✅ **Dans l'application** (cloche 🔔)
- ✅ **Email** (quotidien, immédiat)
- ✅ **Push navigateur** (si activé)

### 🎨 Apparence

#### Thème

- ☀️ **Clair** : Fond blanc, texte sombre
- 🌙 **Sombre** : Fond sombre, texte clair
- 🌓 **Automatique** : Selon l'heure (jour/nuit)

#### Taille de police

Ajustez la taille :
- **Petit** : Pour écrans haute résolution
- **Moyen** : Par défaut
- **Grand** : Pour meilleure lisibilité

#### Densité d'affichage

- **Compacte** : Plus d'infos à l'écran
- **Normale** : Par défaut
- **Confortable** : Plus d'espace

### 🌍 Langue et région

#### Langue

Actuellement disponible :
- 🇫🇷 **Français** (par défaut)

> 🚀 **Prochainement** : Anglais, Espagnol, Allemand

#### Fuseau horaire

Sélectionnez votre fuseau :
- Europe/Paris (UTC+1)
- Europe/London (UTC+0)
- America/New_York (UTC-5)
- etc.

**Impact** : Affichage des dates et heures locales

#### Format de date

Choisissez le format :
- **JJ/MM/AAAA** : 19/11/2025 (Europe)
- **MM/JJ/AAAA** : 11/19/2025 (USA)
- **AAAA-MM-JJ** : 2025-11-19 (ISO)

### ⏱️ Préférences de travail

#### Semaine de travail

Définissez vos jours travaillés :

```
☑️ Lundi
☑️ Mardi
☑️ Mercredi
☑️ Jeudi
☑️ Vendredi
☐ Samedi
☐ Dimanche
```

**Impact** : Calcul des jours ouvrés dans les échéances

#### Heures contractuelles

Définissez votre durée de travail hebdomadaire :
- 35 heures
- 37.5 heures
- 39 heures
- Personnalisé

**Impact** :
- Validation des feuilles de temps
- Alertes si dépassement
- Calculs de charge

#### Vue par défaut (Tâches)

Choisissez la vue qui s'ouvre automatiquement :
- Liste
- Kanban ⭐ (par défaut)
- Calendrier
- Gantt
- Roadmap

---

## 11. Bonnes pratiques

Adoptez ces **bonnes pratiques** pour tirer le meilleur parti de Chronodil.

### 📋 Gestion des tâches

#### ✅ Nommage des tâches

| ✅ Bon exemple | ❌ Mauvais exemple |
|---------------|-------------------|
| "Créer la page de connexion" | "Page" |
| "Corriger bug #145 - Erreur 404" | "Bug" |
| "Réunion équipe - Sprint planning" | "Réunion" |

**Règles** :
- **Verbe d'action** en début (Créer, Corriger, Analyser)
- **Spécifique** et sans ambiguïté
- **Contexte** suffisant (si besoin)

#### ✅ Descriptions complètes

Une bonne description contient :

```markdown
## Objectif
Créer la page de connexion utilisateur

## Détails
- Formulaire email + mot de passe
- Validation côté client
- Gestion des erreurs
- Lien "Mot de passe oublié"

## Critères d'acceptation
- [ ] Formulaire fonctionnel
- [ ] Messages d'erreur clairs
- [ ] Redirection après connexion
- [ ] Responsive mobile

## Ressources
- Maquette Figma: [lien]
- Doc API: [lien]
```

#### ✅ Priorisation

**Utilisez la matrice urgence/importance** :

| Urgent | Important | Priorité |
|--------|-----------|----------|
| ✅ | ✅ | 🔴 HIGH (faire immédiatement) |
| ✅ | ❌ | 🟡 MEDIUM (planifier) |
| ❌ | ✅ | 🟡 MEDIUM (déléguer si possible) |
| ❌ | ❌ | 🟢 LOW (éliminer ou reporter) |

#### ✅ Découpage des tâches

**Une tâche = 1 journée max**

Si > 1 jour, découpez :

```
❌ "Créer l'application mobile" (trop gros)

✅ Découpage :
1. "Setup projet React Native"
2. "Créer l'écran de connexion"
3. "Créer l'écran de liste"
4. "Créer l'écran de détail"
5. "Intégrer l'API"
6. "Tests et corrections"
```

#### ✅ Mise à jour régulière

**Rythme recommandé** :

- **Matin** : Planifier les tâches du jour (vue Kanban)
- **Pendant** : Déplacer les cartes (TODO → IN_PROGRESS → DONE)
- **Soir** : Vérifier l'avancement, préparer le lendemain

### 📊 Gestion des projets

#### ✅ Structure projet

**Hiérarchie claire** :

```
📁 Projet : Site Web Entreprise
├── 📋 Phase 1 : Conception
│   ├── ✅ Définir le cahier des charges
│   ├── ✅ Créer les maquettes
│   └── ⏳ Valider avec client
├── 📋 Phase 2 : Développement
│   ├── ⏳ Setup environnement
│   ├── 📌 Développer homepage
│   └── 📌 Développer pages secondaires
└── 📋 Phase 3 : Tests et déploiement
    └── 📌 Rédiger plan de tests
```

#### ✅ Équipe projet

**Définissez les rôles** :

| Rôle | Responsabilité | Exemple |
|------|----------------|---------|
| **Chef de projet** | Pilotage global | Thomas (Manager) |
| **Tech Lead** | Architecture technique | Marie (Senior Dev) |
| **Développeurs** | Réalisation | Jean, Sophie, Lucas |
| **QA** | Tests et qualité | Emma |

#### ✅ Suivi hebdomadaire

**Rituel hebdomadaire** :

```
🗓️ Lundi 9h : Sprint planning
- Objectifs de la semaine
- Répartition des tâches
- Questions bloquantes

🗓️ Vendredi 16h : Rétrospective
- Ce qui a bien fonctionné
- Ce qui peut être amélioré
- Actions pour la semaine suivante
```

### ⏱️ Feuilles de temps RH

#### ✅ Déclaration hebdomadaire

**Processus optimal** :

```
🗓️ Chaque vendredi 16h-17h :
1. Créer la feuille de temps
2. Ajouter toutes les activités de la semaine
3. Vérifier le total (doit = heures contractuelles)
4. Soumettre pour validation
```

**Pourquoi vendredi ?**
- Mémoire fraîche de la semaine
- Manager valide lundi
- RH approuve mardi
- Conforme aux délais de paie

#### ✅ Précision des descriptions

| ✅ Description précise | ❌ Description floue |
|-----------------------|---------------------|
| "Développement API REST - endpoints utilisateurs" | "Dev" |
| "Réunion sprint planning - définition user stories" | "Réunion" |
| "Formation Next.js 14 - nouveautés App Router" | "Formation" |

#### ✅ Cohérence avec les tâches

**Utilisez prioritairement les tâches existantes** :

```
✅ Méthode recommandée :
1. Créer vos tâches quotidiennes au fur et à mesure
2. En fin de semaine, créer la feuille RH
3. Sélectionner les tâches existantes
4. Heures pré-remplies automatiquement

❌ À éviter :
1. Attendre vendredi
2. Essayer de se souvenir de toute la semaine
3. Tout saisir manuellement
4. Risque d'oublis et d'incohérences
```

### 📈 Rapports et analyses

#### ✅ Rapports réguliers

**Planifiez vos rapports** :

| Fréquence | Rapport | Destinataire |
|-----------|---------|--------------|
| **Hebdomadaire** | Avancement projets | Manager + Équipe |
| **Mensuel** | Heures et budget | Manager + RH |
| **Trimestriel** | Bilan global | Direction |

#### ✅ Exploiter les données

**Utilisez les rapports pour** :

- 📊 Identifier les goulots d'étranglement
- ⏱️ Optimiser l'allocation des ressources
- 💰 Suivre les budgets projet
- 📈 Mesurer la vélocité d'équipe
- 🎯 Ajuster les objectifs

---

## 12. Raccourcis clavier

Gagnez du temps avec ces **raccourcis clavier**.

### 🌐 Globaux (toutes pages)

| Raccourci | Action |
|-----------|--------|
| `Ctrl+K` | Ouvrir la palette de commandes |
| `Ctrl+D` | Aller au Dashboard |
| `Ctrl+T` | Aller aux Tâches |
| `Ctrl+P` | Aller aux Projets |
| `Ctrl+H` | Aller aux Feuilles RH |
| `Ctrl+R` | Aller aux Rapports |
| `Ctrl+M` | Aller au Chat |
| `Ctrl+,` | Ouvrir les Paramètres |
| `Ctrl+/` | Afficher l'aide |
| `Esc` | Fermer le dialogue/modal |

### ✅ Page Tâches

| Raccourci | Action |
|-----------|--------|
| `Ctrl+N` | Nouvelle tâche |
| `Ctrl+F` | Rechercher une tâche |
| `Ctrl+1` | Vue Liste |
| `Ctrl+2` | Vue Kanban |
| `Ctrl+3` | Vue Calendrier |
| `Ctrl+4` | Vue Gantt |
| `Ctrl+5` | Vue Roadmap |
| `E` | Éditer la tâche sélectionnée |
| `D` | Supprimer la tâche sélectionnée (avec confirmation) |
| `C` | Commenter la tâche |
| `↑` `↓` | Naviguer entre les tâches |
| `Entrée` | Ouvrir la tâche sélectionnée |

### 📁 Page Projets

| Raccourci | Action |
|-----------|--------|
| `Ctrl+N` | Nouveau projet |
| `Ctrl+F` | Rechercher un projet |
| `E` | Éditer le projet sélectionné |
| `T` | Voir les tâches du projet |
| `U` | Voir l'équipe du projet |

### 💬 Chat

| Raccourci | Action |
|-----------|--------|
| `Ctrl+N` | Nouveau message |
| `Ctrl+F` | Rechercher dans le chat |
| `↑` `↓` | Naviguer entre les conversations |
| `Entrée` | Envoyer le message |
| `Shift+Entrée` | Nouvelle ligne (sans envoyer) |
| `@` | Mentionner un utilisateur |
| `Esc` | Quitter le champ de saisie |

### 📝 Éditeur de texte (descriptions, commentaires)

| Raccourci | Action |
|-----------|--------|
| `Ctrl+B` | Gras |
| `Ctrl+I` | Italique |
| `Ctrl+U` | Souligné |
| `Ctrl+K` | Insérer un lien |
| `Ctrl+Shift+7` | Liste numérotée |
| `Ctrl+Shift+8` | Liste à puces |
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Rétablir |

### ⚙️ Palette de commandes (`Ctrl+K`)

La **palette de commandes** permet d'accéder à **n'importe quelle fonction** :

```
Ctrl+K → Tapez ce que vous cherchez :

"nouvelle tâche" → Créer une tâche
"rapport équipe" → Générer rapport d'équipe
"profil" → Ouvrir paramètres profil
"thème sombre" → Activer mode sombre
"Marie" → Envoyer message à Marie
```

---

## 13. FAQ et dépannage

### ❓ Questions fréquentes

#### Q1 : Pourquoi je ne vois pas le sélecteur de tâche dans la feuille RH ?

**R :** Le sélecteur n'apparaît que si vous avez des **tâches actives** (statut TODO ou IN_PROGRESS) dont vous êtes **créateur ou membre**.

**Solution** :
1. Allez dans **Tâches**
2. Créez au moins une tâche avec statut TODO ou IN_PROGRESS
3. Retournez dans **Feuilles RH**
4. Le sélecteur apparaît maintenant

---

#### Q2 : Ma feuille de temps est bloquée au statut PENDING, je ne peux plus la modifier

**R :** C'est **normal**. Une fois soumise (PENDING), la feuille est **verrouillée** en attendant validation.

**Pour modifier** :
1. Contactez votre **manager**
2. Il peut **rejeter** la feuille (avec commentaire)
3. Elle repasse en statut **DRAFT**
4. Vous pouvez maintenant **modifier**
5. **Resoumettez** après correction

---

#### Q3 : Je ne vois pas tous les projets dans la liste

**R :** Vous ne voyez que les projets **dont vous êtes membre** ou **que vous avez créés**.

**Pour voir plus de projets** :
- Demandez à un **Manager** de vous ajouter au projet
- Les Admins voient tous les projets

---

#### Q4 : Mes modifications de tâches ne sont pas sauvegardées

**R :** Vérifiez :

1. **Connexion internet** : Vérifiez votre connexion
2. **Session expirée** : Reconnectez-vous
3. **Permissions** : Vérifiez que vous pouvez modifier cette tâche
4. **Champs obligatoires** : Tous les champs requis sont remplis ?

**Message d'erreur ?** Consultez les logs (F12 → Console) et contactez le support.

---

#### Q5 : Comment supprimer mon compte ?

**R :** Vous ne pouvez pas supprimer votre compte vous-même.

**Contactez** :
- Votre **RH** ou **Administrateur**
- Ils désactiveront votre compte

> 💡 **Note** : Les données historiques (feuilles approuvées) sont conservées pour conformité légale.

---

#### Q6 : Pourquoi certaines fonctionnalités sont grisées ?

**R :** Votre **rôle** ne permet pas d'accéder à ces fonctionnalités.

**Exemples** :
- **Employé** : Ne peut pas créer de projets
- **Employé/Manager** : Ne peut pas valider définitivement (signature RH)

**Consultez** : Section [Rôles et permissions](#3-rôles-et-permissions) de ce guide.

---

#### Q7 : Comment récupérer mon mot de passe oublié ?

**R :** Fonctionnalité de réinitialisation :

1. Page de connexion → Cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre **email**
3. Vous recevez un **lien de réinitialisation**
4. Cliquez sur le lien (valide 1h)
5. Définissez un **nouveau mot de passe**

**Pas reçu d'email ?** Vérifiez vos spams ou contactez l'admin.

---

#### Q8 : Les notifications ne fonctionnent pas

**R :** Vérifiez :

**1. Paramètres Chronodil**
- Allez dans **Paramètres → Notifications**
- Vérifiez que les notifications sont **activées**

**2. Paramètres navigateur**
- **Chrome** : Paramètres → Confidentialité → Notifications → Autoriser Chronodil
- **Firefox** : Options → Vie privée → Notifications → Autoriser
- **Safari** : Préférences → Sites web → Notifications → Autoriser

**3. Système d'exploitation**
- **Windows** : Paramètres → Système → Notifications
- **macOS** : Préférences Système → Notifications

---

#### Q9 : L'application est lente / ne charge pas

**R :** Solutions :

**1. Vider le cache**
```
Chrome/Edge : Ctrl+Shift+Del → Vider le cache
Firefox : Ctrl+Shift+Del → Données en cache
Safari : Cmd+Option+E
```

**2. Mettre à jour le navigateur**
- Utilisez la **dernière version** de Chrome, Firefox, Edge ou Safari

**3. Vérifier la connexion**
- **Test** : Ouvrez d'autres sites web
- **VPN** : Désactivez temporairement le VPN
- **Proxy** : Vérifiez les paramètres proxy

**4. Mode navigation privée**
- Testez en **navigation privée** (Ctrl+Shift+N)
- Si ça fonctionne → Problème d'extension ou cache

**Toujours lent ?** Contactez le support technique.

---

### 🛠️ Dépannage avancé

#### Console développeur

**Afficher la console** : `F12` (Windows/Linux) ou `Cmd+Option+I` (Mac)

**Onglets utiles** :
- **Console** : Messages d'erreur JavaScript
- **Network** : Requêtes réseau (échecs API)
- **Application** : Données en cache

**Recherchez** :
- Messages en **rouge** (erreurs)
- Requêtes avec statut **4xx** ou **5xx** (échecs)

**Capturez** : Faites une capture d'écran et envoyez au support.

---

#### Problèmes connus et solutions

| Problème | Cause | Solution |
|----------|-------|----------|
| "Session expirée" | Session timeout (24h inactivité) | Reconnectez-vous |
| Tâches dupliquées | Double-clic accidentel | Rafraîchir la page (F5) |
| Export vide | Filtres trop restrictifs | Élargir les filtres |
| Chat ne charge pas | Problème WebSocket | Vérifier firewall/proxy |

---

### 📞 Contacter le support

**Niveaux de support** :

#### 1️⃣ Niveau 1 : Questions fonctionnelles

**Contactez** : Votre **Manager**
- Comment utiliser une fonctionnalité
- Processus de validation
- Bonnes pratiques

#### 2️⃣ Niveau 2 : Problèmes RH

**Contactez** : Service **RH**
- Validation des feuilles
- Gestion des comptes
- Logs d'audit
- Rapports de paie

#### 3️⃣ Niveau 3 : Problèmes techniques

**Contactez** : **Administrateur IT**
- Bugs techniques
- Erreurs système
- Problèmes de connexion
- Configuration

**Email support** : contact@chronodil.com

**Incluez dans votre message** :
- **Nom et rôle**
- **Description du problème** (détaillée)
- **Étapes pour reproduire**
- **Captures d'écran** (si applicable)
- **Messages d'erreur** (console F12)
- **Navigateur et système** (ex: Chrome 120, Windows 11)

---

## 14. Glossaire

### 📖 Termes clés

#### A

**ADMIN**
: Rôle administrateur avec contrôle total de l'application.

**Activité RH**
: Tâche déclarée dans une feuille de temps RH.

**APPROVED**
: Statut final d'une feuille de temps après validation RH (signature Odillon).

#### B

**Backlog**
: Liste des tâches en attente (statut TODO).

**Burndown**
: Graphique montrant l'évolution de la charge de travail restante.

#### C

**Complexité**
: Estimation de la difficulté d'une tâche (FAIBLE, MOYEN, ÉLEVÉ).

#### D

**Dashboard**
: Tableau de bord avec vue d'ensemble des activités.

**DONE**
: Statut d'une tâche terminée.

**DRAFT**
: Statut initial d'une feuille de temps (brouillon modifiable).

#### E

**EMPLOYEE**
: Rôle de base pour les employés.

**Échéance**
: Date limite pour terminer une tâche.

#### F

**Feuille de temps RH**
: Déclaration hebdomadaire des activités professionnelles.

#### G

**Gantt**
: Vue de planification avec timeline et dépendances.

#### H

**HR**
: Rôle Ressources Humaines avec validation finale des temps.

**Heures estimées**
: Durée prévue pour réaliser une tâche.

#### I

**IN_PROGRESS**
: Statut d'une tâche en cours de réalisation.

#### K

**Kanban**
: Vue avec colonnes par statut (TODO, IN_PROGRESS, DONE).

**KPI**
: Key Performance Indicator (indicateur clé de performance).

#### M

**MANAGER**
: Rôle de responsable d'équipe avec pouvoir de validation.

**MANAGER_APPROVED**
: Statut d'une feuille validée par le manager.

**Mention**
: Notification d'un utilisateur via @nom.

#### P

**PENDING**
: Statut d'une feuille soumise en attente de validation.

**Priorité**
: Niveau d'urgence (LOW, MEDIUM, HIGH).

**Palette de commandes**
: Accès rapide aux fonctions (Ctrl+K).

#### R

**Roadmap**
: Vue stratégique long terme des projets.

**Rôle**
: Niveau de permission (EMPLOYEE, MANAGER, HR, ADMIN).

#### S

**Signature Odillon**
: Validation RH finale et officielle d'une feuille de temps.

**Statut**
: État d'avancement d'une tâche ou feuille de temps.

**Synchronisation bidirectionnelle**
: Lien automatique entre tâches et activités RH.

#### T

**TODO**
: Statut d'une tâche à faire.

**Tâche**
: Unité de travail à réaliser.

#### V

**Vélocité**
: Nombre de tâches terminées par période (mesure de productivité).

**Vue**
: Mode d'affichage des tâches (Liste, Kanban, Calendrier, Gantt, Roadmap).

#### W

**Workflow**
: Processus de validation structuré (ex: DRAFT → PENDING → APPROVED).

---

## 🎓 Conclusion

Vous êtes maintenant prêt à **maîtriser Chronodil** !

### 📚 Récapitulatif

Dans ce guide, vous avez appris :

✅ **Naviguer** dans l'interface et utiliser les raccourcis
✅ **Gérer vos tâches** avec 5 vues adaptées à votre style
✅ **Organiser des projets** et piloter des équipes
✅ **Déclarer vos temps** et suivre le workflow de validation
✅ **Générer des rapports** pour piloter votre activité
✅ **Collaborer** via le chat en temps réel
✅ **Personnaliser** votre expérience selon vos préférences

### 🚀 Prochaines étapes

1. **Explorez** les différentes fonctionnalités
2. **Créez** vos premières tâches et projets
3. **Déclarez** votre première feuille de temps
4. **Configurez** vos préférences et notifications
5. **Partagez** vos bonnes pratiques avec l'équipe

### 💡 Astuces finales

- **Palette de commandes** (`Ctrl+K`) : Votre meilleur ami pour la navigation rapide
- **Vue Kanban** : La plus populaire pour la gestion quotidienne
- **Feuilles hebdomadaires** : Déclarez chaque vendredi pour ne rien oublier
- **Synchronisation** : Utilisez les tâches existantes dans les feuilles RH
- **Notifications** : Configurez-les selon vos besoins pour ne rien manquer

### 📞 Besoin d'aide ?

1. **Consultez** ce guide (section FAQ)
2. **Utilisez** la palette de commandes pour trouver rapidement
3. **Contactez** votre manager pour les questions fonctionnelles
4. **Envoyez un email** à contact@chronodil.com pour le support technique

---

## 📄 Informations légales

**Éditeur** : Chronodil
**Version de l'application** : v0.1.0
**Version du guide** : 2.0.0
**Dernière mise à jour** : Novembre 2025
**Technologie** : Next.js 16, React 19, Prisma, Supabase

---

<div align="center">

**⏱️ Gérez vos temps efficacement avec Chronodil**

---

*Ce guide est mis à jour régulièrement. Consultez la version en ligne pour les dernières nouveautés.*

</div>
