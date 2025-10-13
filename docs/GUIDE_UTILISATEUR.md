# 📘 Guide Utilisateur - Chronodil

## Table des matières
1. [Introduction](#introduction)
2. [Connexion](#connexion)
3. [Tableau de bord](#tableau-de-bord)
4. [Saisie des temps](#saisie-des-temps)
5. [Projets](#projets)
6. [Validation](#validation)
7. [Rapports et Exports](#rapports-et-exports)
8. [Notifications](#notifications)
9. [Paramètres](#paramètres)
10. [Administration](#administration)

---

## Introduction

Chronodil est une application de gestion des temps de travail conçue pour :
- ✅ Saisir facilement vos heures de travail
- 📊 Suivre vos projets et tâches
- ✔️ Valider les temps de votre équipe
- 📈 Générer des rapports détaillés
- 📧 Recevoir des notifications importantes

### Rôles utilisateurs
- **EMPLOYEE** : Saisie des temps personnels
- **MANAGER** : Validation des temps de l'équipe
- **HR** : Accès complet aux données RH
- **ADMIN** : Administration complète du système

---

## Connexion

### Première connexion
1. Accédez à l'URL de l'application
2. Utilisez les identifiants fournis par votre administrateur
3. Changez votre mot de passe si nécessaire

### Mot de passe oublié
Contactez votre administrateur pour réinitialiser votre mot de passe.

---

## Tableau de bord

Le tableau de bord affiche :
- **Heures de la semaine** : Votre progression hebdomadaire
- **Projets actifs** : Nombre de projets sur lesquels vous travaillez
- **Statut validation** : État de validation de vos temps
- **Activité récente** : Dernières saisies et événements

---

## Saisie des temps

### Vue hebdomadaire

La vue hebdomadaire vous permet de voir toutes vos saisies en un coup d'œil :

1. **Navigation** : Utilisez les flèches pour changer de semaine
2. **Ajouter une entrée** : Cliquez sur "+ Ajouter" dans un jour
3. **Modifier** : Cliquez sur une entrée existante
4. **Statuts** :
   - 🟢 **Brouillon** : Non soumis
   - 🟡 **Soumis** : En attente de validation
   - ✅ **Approuvé** : Validé par le manager
   - ❌ **Rejeté** : Refusé

### Ajouter une saisie

1. Cliquez sur "Ajouter une entrée"
2. Remplissez le formulaire :
   - **Date** : Sélectionnez la date
   - **Projet** : Choisissez le projet
   - **Tâche** : Optionnel
   - **Type** : Normal, Heures sup., Nuit, Week-end
   - **Durée** : En heures (ex: 7.5)
   - **Description** : Détails de votre travail
3. Cliquez sur "Enregistrer"

### Soumettre pour validation

1. Complétez toutes vos saisies de la semaine
2. Cliquez sur "Soumettre la semaine"
3. Votre manager recevra une notification
4. Les entrées soumises ne peuvent plus être modifiées

---

## Projets

### Consulter les projets

Accédez à **Projets** dans le menu pour voir :
- Liste de tous les projets actifs
- Progression (heures utilisées / budget)
- Nombre de membres de l'équipe
- Statut du projet

### Gérer l'équipe projet

*Réservé aux MANAGERS, HR et ADMIN*

1. Cliquez sur "Gérer" sur un projet
2. **Ajouter un membre** :
   - Sélectionnez un utilisateur
   - Définissez son rôle (Membre/Chef de projet)
   - Cliquez sur "Ajouter au projet"
3. **Retirer un membre** : Cliquez sur ✖️ à côté du nom

---

## Validation

*Fonctionnalité réservée aux MANAGERS, HR et ADMIN*

### Valider les temps

1. Accédez à **Validation**
2. Consultez les statistiques :
   - Entrées en attente
   - Taux d'approbation
3. Pour chaque saisie :
   - Vérifiez les détails (projet, durée, description)
   - Cliquez sur "Valider"
   - Choisissez **Approuver** ou **Rejeter**
   - Ajoutez un commentaire si nécessaire

### Validation en masse

1. Cochez les entrées à valider
2. Cliquez sur "Valider la sélection"
3. Choisissez l'action globale
4. Toutes les notifications sont envoyées automatiquement

---

## Rapports et Exports

### Consulter les rapports

1. Accédez à **Rapports**
2. Sélectionnez la période :
   - Cette semaine
   - Ce mois
   - Ce trimestre
   - Cette année
3. Choisissez le type de rapport :
   - **Vue d'ensemble** : KPIs et graphiques
   - **Détaillé** : Toutes les saisies
   - **Par projet** : Statistiques projet
   - **Par utilisateur** : Statistiques utilisateur

### Exporter les données

#### Export Excel
1. Configurez vos filtres
2. Cliquez sur "Excel"
3. Le fichier .xlsx est téléchargé
4. Contient : Date, Employé, Projet, Durée, Statut

#### Export PDF
1. Configurez vos filtres
2. Cliquez sur "PDF"
3. Le rapport PDF est généré
4. Format professionnel avec graphiques

---

## Notifications

### Notifications in-app

- **Icône cloche** : Badge avec le nombre de notifications non lues
- Cliquez pour voir les 5 dernières
- Types de notifications :
  - ℹ️ Info
  - ✅ Succès
  - ⚠️ Avertissement
  - ❌ Erreur

### Notifications email

Les emails sont envoyés automatiquement pour :
- Soumission de feuille de temps
- Validation (approbation/rejet)
- Actions importantes

### Gérer les notifications

1. Accédez à **Notifications**
2. Actions disponibles :
   - Marquer comme lu
   - Tout marquer comme lu
   - Supprimer

---

## Paramètres

### Mon profil

1. Accédez à **Profil** via le menu utilisateur
2. Consultez vos informations :
   - Nom, Email, Rôle
   - Département
   - Manager assigné
   - Date d'inscription
3. **Modifier** :
   - Cliquez sur "Modifier"
   - Changez nom, email, photo
   - Enregistrez

### Jours fériés

*Visible par tous, modifiable par ADMIN/HR*

- Calendrier des jours fériés
- Utilisés pour les calculs de temps
- Ajouter : Nom, Date, Description

### Départements

*Visible par tous, modifiable par ADMIN/HR*

- Liste des départements
- Créer : Nom, Code, Description
- Affiche le nombre d'utilisateurs et projets

---

## Administration

*Réservé aux ADMIN et HR*

### Gestion des utilisateurs

1. Accédez à **Paramètres > Utilisateurs**
2. **Créer un utilisateur** :
   - Nom complet
   - Email
   - Mot de passe (min. 6 caractères)
   - Rôle
   - Département
   - Manager
3. **Modifier** : Cliquez sur l'icône ✏️
4. **Rechercher** : Utilisez la barre de recherche

### Audit des actions

1. Accédez à **Audit**
2. Consultez les statistiques :
   - Total des actions
   - Action principale
   - Entité principale
3. Filtrez par :
   - Entité (User, Project, etc.)
   - Action (CREATE, UPDATE, DELETE)
   - Recherche libre
4. Chaque log contient :
   - Date et heure
   - Utilisateur
   - Action effectuée
   - Entité modifiée
   - Adresse IP

---

## Support et Assistance

### Problèmes courants

**Je ne peux pas modifier ma saisie**
- Vérifiez que le statut est "Brouillon"
- Les entrées soumises/approuvées ne sont pas modifiables

**Ma feuille de temps n'apparaît pas**
- Vérifiez que vous avez sélectionné la bonne semaine
- Actualisez la page (F5)

**Je ne reçois pas de notifications email**
- Vérifiez vos spams
- Contactez l'administrateur si le problème persiste

### Contact

Pour toute question ou problème technique :
- Contactez votre administrateur système
- Email support : support@chronodil.app (si configuré)

---

## Astuces et Bonnes Pratiques

### Saisie des temps
- ✅ Saisissez vos temps quotidiennement
- ✅ Ajoutez des descriptions claires
- ✅ Soumettez vos temps en fin de semaine
- ❌ N'attendez pas la dernière minute

### Validation
- ✅ Validez régulièrement (2-3 fois par semaine)
- ✅ Donnez des commentaires constructifs
- ✅ Communiquez avec votre équipe

### Rapports
- 📊 Consultez vos rapports mensuellement
- 💾 Exportez vos données pour vos archives
- 📈 Analysez votre productivité

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Recherche globale (si disponible) |
| `F5` | Actualiser la page |
| `Esc` | Fermer les dialogues |

---

## Changelog

### Version MVP 1.0
- ✅ Saisie des temps hebdomadaire
- ✅ Gestion des projets et équipes
- ✅ Système de validation complet
- ✅ Notifications (in-app + email)
- ✅ Rapports et exports (Excel/PDF)
- ✅ Administration complète
- ✅ Audit des actions

---

**Chronodil** - Gestion intelligente de vos temps de travail
Version: MVP 1.0 | Date: 2025
