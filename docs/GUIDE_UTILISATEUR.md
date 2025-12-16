# Guide Utilisateur - Chronodil

## 📖 Table des matières

- [Introduction](#introduction)
- [Premier pas](#premier-pas)
- [Rôles et permissions](#rôles-et-permissions)
- [Dashboard (Tableau de bord)](#dashboard-tableau-de-bord)
- [Gestion des tâches](#gestion-des-tâches)
- [Gestion des projets](#gestion-des-projets)
- [Feuilles de temps RH](#feuilles-de-temps-rh)
- [Rapports](#rapports)
- [Notifications](#notifications)
- [Chat et messagerie](#chat-et-messagerie)
- [Paramètres](#paramètres)
- [Audit](#audit)
- [FAQ et Résolution de problèmes](#faq-et-résolution-de-problèmes)

---

## Introduction

**Chronodil** est une application de gestion du temps, des tâches et des projets conçue pour faciliter le suivi des activités professionnelles. Elle permet de :

- ✅ Gérer des tâches et projets
- ⏰ Suivre le temps de travail avec des feuilles de temps RH
- 📊 Visualiser des rapports et statistiques
- 💬 Communiquer avec votre équipe
- 🔔 Recevoir des notifications et rappels
- 🎯 Organiser votre travail selon différentes vues (Kanban, Gantt, Calendrier, Liste)

---

## Premier pas

### Connexion à l'application

1. **Accéder à l'application** via votre navigateur web
2. **Saisir vos identifiants** (email et mot de passe)
3. **Cliquer sur "Se connecter"**

> **Comptes par défaut** (après installation) :
> - Admin : `admin@chronodil.com` / `Admin2025!`
> - Manager : `manager@chronodil.com` / `Manager2025!`
> - Employé : `employe@chronodil.com` / `Employee2025!`

### Interface principale

Une fois connecté, vous accédez au **Dashboard** (tableau de bord) qui affiche :
- Vos statistiques de tâches
- Vos projets actifs
- Vos tâches récentes
- Vos feuilles de temps RH

La **barre latérale gauche** contient la navigation principale :
- 🏠 **Dashboard** : Vue d'ensemble
- ✅ **Tâches** : Gestion de vos tâches
- 📁 **Projets** : Gestion des projets
- 📋 **Feuilles de temps RH** : Gestion des activités RH
- 📊 **Rapports** : Analyses et exports
- 💬 **Chat** : Messagerie d'équipe
- 🔔 **Notifications** : Alertes et rappels
- 🔍 **Audit** : Historique des actions (Admin/RH)
- ⚙️ **Paramètres** : Configuration

---

## Rôles et permissions

Chronodil utilise un système de **5 rôles** avec des permissions différentes :

### 🟢 EMPLOYEE (Employé)
**Accès :** Vue limitée à ses propres données
- ✅ Créer et gérer ses propres tâches
- ✅ Voir les projets auxquels il est affecté
- ✅ Créer et soumettre ses feuilles de temps RH
- ✅ Communiquer via le chat
- ✅ Modifier son profil

### 🔵 MANAGER (Responsable)
**Accès :** Vue étendue sur son équipe
- ✅ Toutes les permissions de l'employé
- ✅ Voir et gérer les tâches de son équipe
- ✅ **Valider les feuilles de temps RH** de son équipe
- ✅ Créer et gérer des projets
- ✅ Affecter des membres aux projets
- ✅ Voir les rapports d'équipe

### 🟣 HR (Ressources Humaines)
**Accès :** Gestion RH globale
- ✅ Toutes les permissions du Manager
- ✅ **Validation finale des feuilles de temps** (signature Odillon)
- ✅ Gestion des utilisateurs
- ✅ Gestion des départements
- ✅ Gestion des jours fériés
- ✅ Accès aux logs d'audit

### 🔴 ADMIN (Administrateur)
**Accès :** Contrôle total
- ✅ Toutes les permissions du système
- ✅ Gestion des paramètres de l'application
- ✅ Gestion complète des utilisateurs et rôles
- ✅ Accès aux logs d'audit
- ✅ Configuration avancée

### 🟠 DIRECTEUR (Directeur)
**Accès :** Vue stratégique
- ✅ Toutes les permissions de l'Admin
- ✅ Vue sur tous les projets et statistiques
- ✅ Rapports consolidés
- ✅ Validation des décisions stratégiques

---

## Dashboard (Tableau de bord)

Le **Dashboard** est votre point d'entrée principal. Il affiche :

### 📊 Statistiques clés

1. **Statistiques de tâches**
   - Nombre de tâches par statut (TODO, IN_PROGRESS, DONE)
   - Évolution par rapport à la période précédente
   - Graphiques de distribution

2. **Projets actifs**
   - Les 5 derniers projets actifs
   - Nombre de tâches par projet
   - Code couleur pour identification rapide

3. **Mes projets**
   - Projets auxquels vous êtes affecté
   - Votre rôle dans le projet

4. **Tâches récentes**
   - Les 10 dernières tâches créées
   - Statut, priorité, complexité
   - Projet associé

5. **Feuilles de temps RH**
   - Vos dernières feuilles de temps
   - Statut de validation (Brouillon, En attente, Approuvé)
   - Heures totales

### 📅 Actions rapides

- **Bouton "+" en haut à droite** : Créer une nouvelle tâche
- **Navigation rapide** : Cliquer sur un projet ou une tâche pour accéder aux détails

---

## Gestion des tâches

La page **Tâches** (`/dashboard/tasks`) est le cœur de la gestion de votre travail.

### 📋 Vues disponibles

Chronodil offre **5 modes de visualisation** pour s'adapter à votre méthode de travail :

#### 1. 📝 Vue Liste (par défaut)
- Liste détaillée de toutes vos tâches
- Tri et filtrage avancés
- Actions rapides sur chaque ligne

#### 2. 📊 Vue Kanban
- Colonnes par statut (TODO, IN_PROGRESS, DONE)
- Glisser-déposer pour changer le statut
- Vue d'ensemble de l'avancement

#### 3. 📅 Vue Calendrier
- Visualisation par date d'échéance
- Glisser-déposer pour changer la date
- Vue mensuelle/hebdomadaire

#### 4. 🗓️ Vue Gantt
- Diagramme de Gantt pour planification
- Dépendances entre tâches
- Timeline du projet

#### 5. 🗺️ Vue Roadmap
- Vue stratégique des jalons
- Planification long terme
- Vue d'ensemble des projets

**Changer de vue** : Utilisez les onglets en haut de la page.

### ➕ Créer une tâche

1. **Cliquer sur le bouton "+"** (en haut à droite)
2. **Remplir les informations** :

   **Informations principales :**
   - **Nom** : Titre court et descriptif (obligatoire)
   - **Description** : Détails de la tâche (optionnel)
   - **Projet** : Sélectionner un projet ou "Aucun projet"
   - **Statut** : TODO (À faire), IN_PROGRESS (En cours), DONE (Terminé)
   - **Priorité** : LOW (Basse), MEDIUM (Moyenne), HIGH (Haute)
   - **Complexité** : FAIBLE, MOYEN, ÉLEVÉ

   **Planification :**
   - **Date d'échéance** : Date limite de la tâche
   - **Heures estimées** : Temps estimé pour compléter la tâche
   - **Rappel** : Date et heure du rappel (optionnel)
   - **Son activé** : Activer le son pour le rappel

   **Partage (optionnel) :**
   - **Partager avec des utilisateurs** : Affecter la tâche à d'autres membres
   - **Feuille de temps RH** : Lier la tâche à une feuille de temps existante

3. **Cliquer sur "Créer la tâche"**

> **💡 Astuce** : Si vous créez une activité RH en mode "Saisie manuelle" (sans lien vers une tâche), Chronodil créera automatiquement une tâche correspondante.

### ✏️ Modifier une tâche

1. **Cliquer sur la tâche** dans la liste
2. **Cliquer sur l'icône "Éditer"** (crayon)
3. **Modifier les informations**
4. **Enregistrer**

### 🗑️ Supprimer une tâche

1. **Clic droit sur la tâche** → **"Supprimer"**
2. Ou cliquer sur le menu **"⋮"** → **"Supprimer"**
3. **Confirmer la suppression**

> ⚠️ **Attention** : La suppression est définitive.

### 🔍 Filtrer et rechercher

**Barre de filtres** (en haut de la page) :

1. **Recherche textuelle** : Rechercher par nom ou description
2. **Filtre par statut** : TODO, IN_PROGRESS, DONE
3. **Filtre par priorité** : LOW, MEDIUM, HIGH
4. **Filtre par projet** : Sélectionner un projet spécifique
5. **Filtre par utilisateur** : Voir les tâches d'un membre (Manager+)

**Réinitialiser les filtres** : Cliquer sur "Réinitialiser"

### 📝 Commentaires et historique

**Onglets disponibles** (vue détail de tâche) :

1. **Commentaires** : Discuter sur la tâche avec l'équipe
   - Ajouter un commentaire
   - Modifier/supprimer ses commentaires
   - Voir l'historique des discussions

2. **Activité** : Timeline des actions
   - Qui a modifié quoi et quand
   - Historique complet des changements
   - Audit trail

### 🔄 Synchronisation temps réel

Chronodil utilise **Supabase Realtime** pour synchroniser les tâches en temps réel :
- Les changements sont visibles instantanément pour toute l'équipe
- Pas besoin de rafraîchir la page
- Notifications automatiques lors de modifications

---

## Gestion des projets

La page **Projets** (`/dashboard/projects`) permet de gérer vos projets.

### ➕ Créer un projet

1. **Cliquer sur "Nouveau projet"**
2. **Remplir les informations** :
   - **Nom** : Nom du projet (obligatoire)
   - **Code** : Code unique (ex: CHRON-2025) (obligatoire)
   - **Description** : Détails du projet (optionnel)
   - **Couleur** : Code couleur pour identification visuelle
   - **Département** : Sélectionner un département (si configuré)
   - **Budget horaire** : Nombre d'heures prévues
   - **Taux horaire** : Coût par heure (optionnel)
   - **Dates** : Date de début et fin (optionnel)
3. **Cliquer sur "Créer"**

### 👥 Gérer l'équipe du projet

1. **Ouvrir le projet**
2. **Cliquer sur "Gérer l'équipe"** (icône utilisateurs)
3. **Ajouter des membres** :
   - Sélectionner un utilisateur
   - Définir son rôle (membre, responsable)
   - Confirmer
4. **Retirer un membre** : Cliquer sur "Retirer" à côté de son nom

### 📊 Suivre l'avancement

**Indicateurs de santé du projet** :
- **Vert** : Projet sur les rails
- **Orange** : Attention requise
- **Rouge** : Projet en difficulté

**Critères d'évaluation** :
- Respect du budget horaire
- Tâches terminées vs tâches totales
- Tâches en retard

### 📋 Actions sur les projets

**Menu contextuel** (clic droit ou menu "⋮") :

1. **Modifier** : Éditer les informations du projet
2. **Archiver** : Désactiver le projet (ne le supprime pas)
3. **Cloner** : Créer une copie du projet
4. **Supprimer** : Supprimer définitivement (Admin uniquement)
5. **Exporter** : Exporter les données du projet

### 🔍 Filtrer les projets

**Vues disponibles** :
- **Tous** : Tous les projets
- **Actifs** : Projets en cours
- **Archivés** : Projets terminés ou inactifs
- **Mes projets** : Projets où je suis membre

**Modes d'affichage** :
- **Grille** : Vue en cartes (par défaut)
- **Liste** : Vue en tableau

---

## Feuilles de temps RH

La page **Feuilles de temps RH** (`/dashboard/hr-timesheet`) permet de gérer les activités RH hebdomadaires.

### 📋 Qu'est-ce qu'une feuille de temps RH ?

Une feuille de temps RH regroupe toutes vos **activités professionnelles hebdomadaires** :
- Activités opérationnelles (OPERATIONAL)
- Activités de reporting (REPORTING)

Chaque activité a :
- Un **type** : OPERATIONAL ou REPORTING
- Une **périodicité** : DAILY (Quotidien), WEEKLY (Hebdomadaire), MONTHLY (Mensuel), PUNCTUAL (Ponctuel)
- Une **durée** : Heures passées
- Un **statut** : IN_PROGRESS ou COMPLETED

### ➕ Créer une feuille de temps

1. **Cliquer sur "Nouvelle feuille de temps"**
2. **Sélectionner la semaine** : La semaine de référence (Lundi au Dimanche)
3. **Remplir les informations d'en-tête** :
   - Nom de l'employé (prérempli)
   - Poste
   - Site

### 📝 Ajouter des activités

**Deux méthodes disponibles** :

#### Méthode 1 : Lier une tâche existante

1. **Sélectionner "Tâche existante"**
2. **Choisir une tâche** dans la liste déroulante
   - Seules les tâches actives (TODO, IN_PROGRESS) sont affichées
3. Les informations sont **pré-remplies automatiquement** :
   - Nom de l'activité
   - Description
   - Type d'activité
   - Périodicité
   - Priorité
   - Complexité

#### Méthode 2 : Saisie manuelle

1. **Sélectionner "Saisie manuelle"**
2. **Remplir manuellement** :
   - Nom de l'activité
   - Description
   - Type d'activité (OPERATIONAL ou REPORTING)
   - Nom de l'activité spécifique
   - Périodicité
   - Priorité
   - Complexité
   - Heures estimées

> **💡 Important** : Si vous créez une activité en mode "Saisie manuelle", Chronodil **créera automatiquement une tâche correspondante** pour assurer la synchronisation bidirectionnelle.

### 🗓️ Planifier l'activité

**Informations de planning** :
- **Date de début** : Premier jour de l'activité
- **Date de fin** : Dernier jour de l'activité
- **Heures totales** : Temps total prévu pour cette activité
- **Quantité hebdomadaire** : Nombre de fois par semaine (pour activités récurrentes)

### ✅ Statut de l'activité

- **IN_PROGRESS** : Activité en cours
- **COMPLETED** : Activité terminée

### 💾 Sauvegarder la feuille de temps

**Statuts de la feuille de temps** :

1. **DRAFT (Brouillon)** :
   - Feuille en cours de rédaction
   - Modifications possibles
   - Pas encore soumise pour validation

2. **PENDING (En attente)** :
   - Feuille soumise à validation
   - En attente d'approbation du manager
   - Modifications impossibles (annuler la soumission d'abord)

3. **MANAGER_APPROVED (Approuvée par le manager)** :
   - Validée par le manager
   - En attente de signature finale RH/Odillon
   - Le manager a signé

4. **APPROVED (Approuvée)** :
   - Validation finale effectuée (signature Odillon)
   - Feuille de temps finalisée
   - Archive permanente

5. **REJECTED (Rejetée)** :
   - Feuille refusée par le manager ou RH
   - Raison indiquée dans les commentaires
   - À corriger et soumettre à nouveau

### 📤 Soumettre pour validation

1. **Vérifier que toutes les activités sont complètes**
2. **Ajouter des observations** (optionnel) :
   - Commentaires pour le manager
   - Explications sur des activités particulières
3. **Cliquer sur "Soumettre pour validation"**
4. La feuille passe au statut **PENDING**

> ⚠️ Une fois soumise, vous ne pouvez plus modifier la feuille. Pour faire des changements, annulez d'abord la soumission.

### ✅ Valider une feuille de temps (Manager)

**Si vous êtes Manager** :

1. **Accéder à "Feuilles de temps RH"**
2. **Onglet "À valider"** : Voir les feuilles en attente
3. **Ouvrir une feuille** : Cliquer sur "Voir les détails"
4. **Vérifier les activités** :
   - Contrôler les heures déclarées
   - Vérifier la cohérence des activités
5. **Action** :
   - **Approuver** : Cliquer sur "Approuver"
     - Ajouter un commentaire (optionnel)
     - La feuille passe à **MANAGER_APPROVED**
   - **Rejeter** : Cliquer sur "Rejeter"
     - **Obligatoire** : Indiquer la raison du rejet
     - L'employé peut corriger et soumettre à nouveau

### 🔏 Validation finale (RH/Odillon)

**Si vous êtes RH** :

1. **Accéder aux feuilles avec statut MANAGER_APPROVED**
2. **Effectuer la validation finale** (signature Odillon)
3. **Ajouter des commentaires RH** (optionnel)
4. La feuille passe à **APPROVED**

> **Workflow complet** :
> DRAFT → PENDING (soumis) → MANAGER_APPROVED (manager) → APPROVED (RH/Odillon)

### 📊 Statistiques des feuilles de temps

La page affiche :
- **Graphique des validations** : Évolution des validations par semaine
- **Répartition par statut** : Nombre de feuilles par statut
- **Total d'heures** : Heures déclarées par période

### 🔍 Filtrer les feuilles de temps

**Filtres disponibles** :
- **Par statut** : DRAFT, PENDING, MANAGER_APPROVED, APPROVED, REJECTED
- **Par période** : Semaine, mois, année
- **Par utilisateur** : Voir les feuilles d'un employé (Manager+)

### 📥 Exporter une feuille de temps

1. **Ouvrir une feuille de temps**
2. **Cliquer sur "Exporter"**
3. **Choisir le format** :
   - **Excel** : Export détaillé avec toutes les activités
   - **PDF** : Format imprimable pour signature papier

---

## Rapports

La page **Rapports** (`/dashboard/reports`) permet de générer des analyses et exports.

> **Note** : Cette fonctionnalité est en cours de développement et sera enrichie dans les prochaines versions.

### 📊 Types de rapports disponibles

1. **Rapport d'activité individuel**
   - Temps de travail par jour/semaine/mois
   - Répartition par projet
   - Heures par type d'activité

2. **Rapport d'équipe** (Manager+)
   - Temps de travail de l'équipe
   - Comparaison des membres
   - Indicateurs de performance

3. **Rapport de projet** (Manager+)
   - Heures par projet
   - Avancement vs budget
   - Ressources affectées

4. **Rapport RH** (RH uniquement)
   - Statistiques globales
   - Validations en attente
   - Conformité des saisies

### 📅 Générer un rapport

1. **Sélectionner le type de rapport**
2. **Définir la période** :
   - Semaine en cours
   - Mois en cours
   - Période personnalisée (date de début et fin)
3. **Choisir les filtres** :
   - Projet(s) spécifique(s)
   - Utilisateur(s)
   - Département(s)
4. **Cliquer sur "Générer"**

### 📥 Exporter un rapport

**Formats disponibles** :
- **Excel (.xlsx)** : Pour analyse détaillée
- **PDF (.pdf)** : Pour archivage ou impression
- **CSV (.csv)** : Pour import dans d'autres outils

### 📧 Partager un rapport

1. **Générer le rapport**
2. **Cliquer sur "Partager"**
3. **Saisir les destinataires** (emails)
4. **Envoyer**

> Les rapports sont envoyés par email avec un lien de téléchargement.

---

## Notifications

La page **Notifications** (`/dashboard/notifications`) centralise toutes vos alertes.

### 🔔 Types de notifications

1. **Notifications de tâches** :
   - Tâche assignée
   - Tâche modifiée
   - Tâche terminée
   - Date d'échéance approchante
   - Rappel de tâche

2. **Notifications de projet** :
   - Ajout à un projet
   - Modification du projet
   - Commentaire sur un projet

3. **Notifications de feuille de temps** :
   - Feuille validée
   - Feuille rejetée
   - Rappel de soumission
   - Commentaire du manager

4. **Notifications système** :
   - Mise à jour de l'application
   - Message d'administration

### 🔍 Gérer les notifications

**Actions disponibles** :
- **Marquer comme lu** : Cliquer sur la notification
- **Marquer tout comme lu** : Bouton en haut de la page
- **Supprimer une notification** : Cliquer sur l'icône "×"
- **Accéder au contenu** : Cliquer sur la notification pour voir l'élément concerné

### ⚙️ Paramétrer les notifications

**Accéder aux paramètres** : Dashboard → Paramètres → Notifications

**Options disponibles** :
- **Notifications de bureau** : Activer/désactiver les notifications système
- **Notifications par email** : Recevoir des emails pour les événements importants
- **Son des notifications** : Activer/désactiver le son
- **Type de son** : Choisir le son (default, subtle, alert)
- **Volume** : Régler le volume (0-100%)

---

## Chat et messagerie

La page **Chat** (`/dashboard/chat`) permet de communiquer avec votre équipe.

### 💬 Types de conversations

1. **Conversations directes (DIRECT)** :
   - Discussion 1-à-1 avec un collègue
   - Privée et confidentielle

2. **Conversations de groupe (GROUP)** :
   - Discussion avec plusieurs personnes
   - Gestion des membres

3. **Conversations de projet (PROJECT)** :
   - Discussion liée à un projet spécifique
   - Tous les membres du projet ont accès

### ➕ Démarrer une conversation

1. **Cliquer sur "Nouvelle conversation"**
2. **Choisir le type** :
   - Direct : Sélectionner un utilisateur
   - Groupe : Sélectionner plusieurs utilisateurs et donner un nom
   - Projet : Sélectionner un projet existant
3. **Confirmer**

### 💬 Envoyer un message

1. **Sélectionner une conversation** dans la liste de gauche
2. **Taper votre message** dans le champ en bas
3. **Envoyer** :
   - Appuyer sur `Entrée` pour envoyer
   - `Maj + Entrée` pour aller à la ligne

### 📎 Pièces jointes

1. **Cliquer sur l'icône de trombone** 📎
2. **Sélectionner un fichier** depuis votre ordinateur
3. **Le fichier est uploadé et partagé** dans la conversation

**Types de fichiers supportés** :
- Documents (PDF, DOCX, XLSX, etc.)
- Images (PNG, JPG, GIF, etc.)
- Archives (ZIP, RAR, etc.)
- Limite : 10 MB par fichier

### 🔍 Rechercher dans les messages

1. **Utiliser la barre de recherche** en haut
2. **Taper un mot-clé**
3. **Voir les résultats** filtrés

### 🔕 Mettre en sourdine une conversation

1. **Ouvrir la conversation**
2. **Menu "⋮"** → **"Mettre en sourdine"**
3. Vous ne recevrez plus de notifications pour cette conversation

### 👥 Gérer les membres (groupe/projet)

**Si vous êtes administrateur de la conversation** :

1. **Menu "⋮"** → **"Gérer les membres"**
2. **Ajouter un membre** : Sélectionner et confirmer
3. **Retirer un membre** : Cliquer sur "Retirer"
4. **Promouvoir en administrateur** : Cliquer sur "Promouvoir"

### 📝 Répondre à un message

1. **Survoler un message**
2. **Cliquer sur "Répondre"** (icône flèche)
3. **Taper votre réponse**
4. Le message original est cité dans votre réponse

### 😊 Réactions

1. **Survoler un message**
2. **Cliquer sur l'icône de réaction** (emoji)
3. **Choisir une réaction**

---

## Paramètres

La page **Paramètres** (`/dashboard/settings`) permet de configurer votre compte et l'application.

### 👤 Profil

**Accès** : Paramètres → Profil

**Informations modifiables** :
- **Nom** : Votre nom complet
- **Email** : Votre adresse email (utilisée pour la connexion)
- **Avatar** : Votre photo de profil
  - Cliquer sur l'avatar actuel pour uploader une nouvelle image
  - Rogner l'image pour l'ajuster
  - Formats acceptés : JPG, PNG (max 2MB)
- **Département** : Votre département (si configuré)
- **Manager** : Votre responsable hiérarchique (défini par l'admin)

### 🔔 Notifications

**Accès** : Paramètres → Notifications (via section Rappels)

**Rappels de feuilles de temps** :
- **Activer les rappels** : Recevoir des notifications pour soumettre vos feuilles
- **Heure du rappel** : Définir l'heure (ex: 17:00)
- **Jours de rappel** : Sélectionner les jours (Lundi, Mardi, etc.)

**Notifications de bureau** :
- **Activer** : Afficher des notifications système
- **Autorisation du navigateur** : Le navigateur demandera la permission

**Notifications par email** :
- **Activer** : Recevoir des emails pour les événements importants

**Son des notifications** :
- **Activer le son** : Jouer un son lors des notifications
- **Type de son** : default, subtle, alert
- **Volume** : Curseur de 0 à 100%

### 🎨 Apparence

**Accès** : Paramètres → Apparence (section Général)

**Thème** :
- **Mode sombre** : Activer/désactiver (activé par défaut)
- **Couleur d'accent** : Choisir parmi plusieurs couleurs (rusty-red par défaut)

**Affichage** :
- **Densité de vue** : normal, compact, comfortable
- **Taille de police** : 10px à 16px (12px par défaut)

### 🌍 Localisation

**Accès** : Paramètres → Général → Localisation

**Langue** :
- Français (fr) - par défaut
- D'autres langues seront ajoutées dans les prochaines versions

**Format de date** :
- DD/MM/YYYY (français)
- MM/DD/YYYY (américain)
- YYYY-MM-DD (ISO)

**Format d'heure** :
- 24 heures (par défaut)
- 12 heures (AM/PM)

**Fuseau horaire** :
- Africa/Libreville (par défaut)
- Liste complète des fuseaux horaires disponibles

### ♿ Accessibilité

**Accès** : Paramètres → Général → Accessibilité

**Options** :
- **Contraste élevé** : Améliorer la lisibilité pour les malvoyants
- **Mode lecteur d'écran** : Optimiser pour les lecteurs d'écran
- **Réduire les animations** : Désactiver les animations pour éviter les distractions

### 👥 Gestion des utilisateurs (Admin/RH)

**Accès** : Paramètres → Utilisateurs

**Actions disponibles** :
- **Voir la liste des utilisateurs** : Tous les utilisateurs de l'application
- **Ajouter un utilisateur** : Créer un nouveau compte
  - Email, nom, rôle, département, manager
  - Le nouvel utilisateur reçoit un email d'invitation
- **Modifier un utilisateur** : Changer le rôle, département, etc.
- **Désactiver un utilisateur** : Bloquer l'accès sans supprimer le compte
- **Supprimer un utilisateur** : Suppression définitive (avec confirmation)

### 🏢 Départements (Admin/RH)

**Accès** : Paramètres → Départements (non encore implémenté)

**Gestion des départements** :
- Créer un département
- Modifier un département
- Définir un responsable de département

### 🎯 Objectifs hebdomadaires

**Accès** : Paramètres → Profil

**Objectif hebdomadaire** :
- Définir votre objectif d'heures par semaine (40h par défaut)
- Utilisé pour calculer votre taux de réalisation

---

## Audit

La page **Audit** (`/dashboard/audit`) permet de consulter l'historique des actions (Admin/RH uniquement).

### 📋 Logs d'audit

**Informations enregistrées** :
- **Utilisateur** : Qui a effectué l'action
- **Action** : Type d'action (CREATE, UPDATE, DELETE, LOGIN, etc.)
- **Entité** : Type d'objet modifié (Task, Project, User, etc.)
- **ID de l'entité** : Identifiant unique de l'objet
- **Changements** : Détails des modifications (avant/après)
- **Adresse IP** : IP de l'utilisateur
- **User Agent** : Navigateur et système d'exploitation
- **Date** : Horodatage précis

### 🔍 Filtrer les logs

**Filtres disponibles** :
- **Par utilisateur** : Voir les actions d'un utilisateur spécifique
- **Par action** : Filtrer par type d'action
- **Par entité** : Voir les modifications d'un type d'objet
- **Par date** : Période spécifique

### 📥 Exporter les logs

1. **Appliquer les filtres** (optionnel)
2. **Cliquer sur "Exporter"**
3. **Choisir le format** : CSV ou Excel
4. **Télécharger le fichier**

---

## FAQ et Résolution de problèmes

### ❓ Questions fréquentes

#### Q : Pourquoi je ne vois pas le sélecteur de tâche dans le formulaire de feuille de temps RH ?

**R :** Le sélecteur de tâche n'apparaît que si :
1. Vous avez des tâches actives (statut TODO ou IN_PROGRESS)
2. Vous êtes créateur ou membre de ces tâches
3. Les tâches ont `isActive = true`

**Solution** : Créez d'abord une tâche avec le statut TODO ou IN_PROGRESS, puis créez votre feuille de temps.

#### Q : Ma feuille de temps est bloquée au statut PENDING, pourquoi ?

**R :** Une fois soumise (statut PENDING), vous ne pouvez plus modifier la feuille. Elle est en attente de validation par votre manager.

**Solution** :
- Si vous devez faire des modifications, **annulez la soumission** d'abord.
- Modifiez la feuille (elle repasse en DRAFT).
- Soumettez à nouveau.

#### Q : Pourquoi je ne peux pas créer une tâche ?

**R :** Vérifiez :
1. Votre session est-elle active ? (Déconnexion/reconnexion)
2. Avez-vous rempli tous les champs obligatoires ? (Nom)
3. Les logs du serveur pour voir l'erreur exacte

**Solution** : Consultez les logs dans la console du navigateur (F12) pour voir le message d'erreur détaillé.

#### Q : Les notifications ne s'affichent pas ?

**R :** Vérifiez :
1. **Paramètres du navigateur** : Autorisez les notifications pour Chronodil
2. **Paramètres de l'application** : Activez les notifications de bureau dans Paramètres → Notifications
3. **Système d'exploitation** : Vérifiez que les notifications ne sont pas bloquées au niveau système

#### Q : Comment supprimer une activité dans une feuille de temps ?

**R :** Cliquez sur l'icône de poubelle 🗑️ à côté de l'activité, puis confirmez la suppression.

> ⚠️ Si la feuille est déjà soumise (PENDING), annulez d'abord la soumission.

#### Q : Puis-je modifier une tâche liée à une feuille de temps approuvée ?

**R :** Oui, vous pouvez toujours modifier la tâche. La modification n'affecte pas la feuille de temps déjà validée (les données sont enregistrées au moment de la validation).

#### Q : Comment changer de mot de passe ?

**R :** Actuellement, la fonctionnalité de changement de mot de passe n'est pas encore implémentée dans l'interface. Contactez votre administrateur.

### 🐛 Problèmes courants

#### ⚠️ Erreur "Connection pool timeout"

**Cause** : Trop de requêtes simultanées à la base de données.

**Solution** :
1. Rechargez la page (F5)
2. Si le problème persiste, contactez l'administrateur
3. L'administrateur doit vérifier la configuration `connection_limit` dans `.env`

#### ⚠️ Erreur "Unauthorized" lors d'une action

**Cause** : Votre session a expiré ou vous n'avez pas les permissions.

**Solution** :
1. Déconnectez-vous et reconnectez-vous
2. Vérifiez votre rôle (certaines actions sont réservées aux Managers/Admin)

#### ⚠️ Les modifications ne s'affichent pas en temps réel

**Cause** : Problème de connexion Realtime avec Supabase.

**Solution** :
1. Vérifiez votre connexion Internet
2. Rechargez la page (F5)
3. Videz le cache du navigateur (Ctrl+Maj+Suppr)

#### ⚠️ La page se charge lentement

**Cause** : Trop de données ou connexion lente.

**Solution** :
1. Utilisez les filtres pour réduire la quantité de données affichées
2. Videz le cache du navigateur
3. Vérifiez votre connexion Internet

#### ⚠️ Impossible d'uploader une pièce jointe

**Cause** : Fichier trop volumineux ou format non supporté.

**Solution** :
1. Vérifiez que le fichier fait moins de 10 MB
2. Vérifiez que le format est supporté
3. Compressez le fichier si nécessaire (ZIP)

### 📞 Support

Si vous rencontrez un problème non résolu :

1. **Vérifiez ce guide** : La solution est peut-être ici
2. **Consultez les logs** : Ouvrez la console du navigateur (F12)
3. **Contactez votre manager** : Pour les questions liées aux processus
4. **Contactez l'administrateur** : Pour les problèmes techniques
5. **Email support** : contact@chronodil.com

---

## 📚 Ressources supplémentaires

### 🔗 Liens utiles

- **Documentation technique** : Voir `README.md` et `CLAUDE.md` à la racine du projet
- **Changelog** : Voir `CLAUDE.md` pour les dernières mises à jour
- **GitHub** : [Danel2025/CHRONODIL_app](https://github.com/Danel2025/CHRONODIL_app)

### 🎓 Bonnes pratiques

**Pour les employés** :
- ✅ Créez vos tâches dès qu'elles sont identifiées
- ✅ Mettez à jour régulièrement le statut de vos tâches
- ✅ Soumettez vos feuilles de temps chaque semaine
- ✅ Ajoutez des descriptions détaillées pour faciliter la compréhension
- ✅ Utilisez les rappels pour ne rien oublier

**Pour les managers** :
- ✅ Validez les feuilles de temps rapidement
- ✅ Ajoutez des commentaires constructifs en cas de rejet
- ✅ Suivez l'avancement des projets régulièrement
- ✅ Communiquez avec votre équipe via le chat
- ✅ Utilisez les rapports pour identifier les tendances

**Pour les administrateurs** :
- ✅ Configurez les départements et utilisateurs dès le début
- ✅ Consultez régulièrement les logs d'audit
- ✅ Assurez-vous que les sauvegardes sont effectuées
- ✅ Formez les nouveaux utilisateurs
- ✅ Maintenez l'application à jour

---

## ✨ Conclusion

Chronodil est un outil puissant pour gérer votre temps et vos projets. N'hésitez pas à explorer toutes les fonctionnalités et à personnaliser l'application selon vos besoins.

**Version du guide** : 1.0.0
**Dernière mise à jour** : 2025-11-12
**Application** : Chronodil v0.1.0 (Next.js 16)

---

**Chronodil** - Gérez vos temps efficacement 🚀
