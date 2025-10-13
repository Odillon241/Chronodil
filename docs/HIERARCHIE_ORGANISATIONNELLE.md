# Hiérarchie Organisationnelle - Chronodil

## 📊 Structure des Rôles

### 1. **DIRECTEUR** (Niveau Opérationnel Supérieur)
- **Rôle**: Direction de l'entreprise
- **Visibilité**: Visible dans toute l'application RH
- **Position hiérarchique**: Au sommet de la hiérarchie opérationnelle
- **Permissions**:
  - Validation finale des feuilles de temps HR (après validation manager)
  - Accès à tous les rapports et statistiques
  - Gestion des managers
  - Vue sur toute l'organisation

**Compte actuel**:
- 📧 Email: `directeur@chronodil.com`
- 👤 Nom: Odillon NANA
- 🔑 Mot de passe: `Directeur2024!` ⚠️ **À changer lors de la première connexion**

### 2. **MANAGER** (Niveau Intermédiaire)
- **Rôle**: Gestion d'équipe
- **Visibilité**: Visible dans l'application RH
- **Position hiérarchique**: Sous le DIRECTEUR
- **Manager**: Doit avoir un DIRECTEUR comme manager
- **Permissions**:
  - Première validation des feuilles de temps HR de leur équipe
  - Gestion des employés sous leur responsabilité
  - Soumission de leurs propres feuilles de temps (si assigné à un manager)

**Compte actuel**:
- 📧 Email: `anna@odillon.com`
- 👤 Nom: Anna
- 🎯 Manager: Odillon NANA (DIRECTEUR)
- 👥 Gère: Déreck

### 3. **HR (Ressources Humaines)** (Niveau Intermédiaire)
- **Rôle**: Gestion RH
- **Visibilité**: Visible dans l'application RH
- **Position hiérarchique**: Même niveau que MANAGER
- **Permissions**:
  - Validation finale des feuilles de temps HR (comme DIRECTEUR)
  - Gestion des paramètres RH
  - Accès aux données de tous les employés

### 4. **EMPLOYEE** (Niveau de Base)
- **Rôle**: Employé standard
- **Visibilité**: Visible dans l'application RH
- **Position hiérarchique**: Sous un MANAGER
- **Manager**: **OBLIGATOIRE** - Doit avoir un MANAGER, HR ou DIRECTEUR assigné
- **Permissions**:
  - Soumission de feuilles de temps
  - Saisie de temps de travail
  - Vue de ses propres données

**Compte actuel**:
- 📧 Email: `dereckdanel01@chronodil.com`
- 👤 Nom: Déreck
- 🎯 Manager: Anna (MANAGER)

### 5. **ADMIN** (Compte Technique)
- **Rôle**: Administration et maintenance de la plateforme
- **Visibilité**: **PAS visible dans les interfaces RH normales**
- **Position hiérarchique**: Hors hiérarchie RH (technique)
- **Permissions**:
  - Accès complet à toutes les fonctionnalités
  - Gestion des utilisateurs (création, modification, suppression)
  - Configuration système
  - Maintenance de la base de données

**Important**:
- ⚠️ Le compte ADMIN ne devrait PAS apparaître dans les workflows RH
- ⚠️ Le compte ADMIN ne peut PAS être sélectionné comme manager
- ✅ Seul le compte ADMIN peut accéder à `/dashboard/settings/users`

**Compte protégé**:
- 📧 Email: `admin@chronodil.com`
- ⚠️ Ce compte ne peut pas être supprimé
- ⚠️ Le rôle et l'email ne peuvent pas être modifiés

---

## 🏢 Hiérarchie Actuelle de Chronodil

```
┌─────────────────────────────────────────┐
│  ADMIN (Compte Technique)               │  ← Hors hiérarchie RH
│  admin@chronodil.com                    │     (Maintenance uniquement)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  DIRECTEUR - Odillon NANA               │  ← Sommet hiérarchie RH
│  directeur@chronodil.com                │     (Direction)
└───────────────┬─────────────────────────┘
                │ manage
                ↓
┌─────────────────────────────────────────┐
│  MANAGER - Anna                         │  ← Gestion d'équipe
│  anna@odillon.com                       │
└───────────────┬─────────────────────────┘
                │ manage
                ↓
┌─────────────────────────────────────────┐
│  EMPLOYEE - Déreck                      │  ← Employé standard
│  dereckdanel01@chronodil.com            │
└─────────────────────────────────────────┘
```

---

## 🔐 Qui peut assigner un manager ?

**Les rôles ADMIN, DIRECTEUR et HR** peuvent assigner ou modifier les managers via :
- Interface web: `/dashboard/settings/users`
- Scripts de maintenance (pour l'ADMIN technique)

### Permissions par rôle :

#### 👑 ADMIN (Accès complet)
- ✅ Peut créer tous les types de comptes (y compris ADMIN)
- ✅ Peut modifier tous les utilisateurs
- ✅ Peut assigner n'importe qui comme manager
- ✅ Peut supprimer des utilisateurs
- ✅ Voit tous les comptes (y compris ADMIN)

#### 🎯 DIRECTEUR (Gestion opérationnelle)
- ✅ Peut créer des comptes (EMPLOYEE, MANAGER, HR, DIRECTEUR)
- ❌ Ne peut PAS créer de comptes ADMIN
- ✅ Peut modifier les utilisateurs (sauf ADMIN)
- ❌ Ne peut PAS modifier les comptes ADMIN
- ✅ Peut assigner des managers (MANAGER, HR, DIRECTEUR)
- ❌ Ne peut PAS supprimer d'utilisateurs
- ❌ Ne voit PAS les comptes ADMIN (masqués)

#### 💼 HR (Gestion RH)
- ✅ Peut créer des comptes (EMPLOYEE, MANAGER, HR, DIRECTEUR)
- ❌ Ne peut PAS créer de comptes ADMIN
- ✅ Peut modifier les utilisateurs (sauf ADMIN)
- ❌ Ne peut PAS modifier les comptes ADMIN
- ✅ Peut assigner des managers
- ❌ Ne peut PAS supprimer d'utilisateurs
- ❌ Ne voit PAS les comptes ADMIN (masqués)

### Règles d'assignation :
1. Les **EMPLOYEE** DOIVENT avoir un manager (MANAGER, HR ou DIRECTEUR)
2. Les **MANAGER** PEUVENT avoir un manager (généralement DIRECTEUR)
3. Les **HR** PEUVENT avoir un manager (généralement DIRECTEUR)
4. Les **DIRECTEUR** n'ont généralement PAS de manager (sommet de la hiérarchie)
5. Les **ADMIN** ne sont PAS dans la hiérarchie RH

---

## 📋 Workflow de Validation des Feuilles de Temps HR

### Étapes de validation :

1. **EMPLOYEE soumet** → Statut: `PENDING`
   - Condition: Doit avoir un manager assigné
   - Notification envoyée au manager

2. **MANAGER valide** → Statut: `MANAGER_APPROVED`
   - Le manager de l'employé valide en premier
   - Notification envoyée au DIRECTEUR/HR

3. **DIRECTEUR/HR valide** → Statut: `APPROVED`
   - Validation finale
   - Notification envoyée à l'employé

### Permissions de validation :
- **MANAGER**: Peut valider les feuilles de ses employés directs
- **HR**: Peut valider toutes les feuilles ayant le statut `MANAGER_APPROVED`
- **DIRECTEUR**: Peut valider toutes les feuilles ayant le statut `MANAGER_APPROVED`
- **ADMIN**: Accès technique mais ne devrait pas intervenir dans le workflow RH

---

## 🚀 Création de Nouveaux Comptes

### Via l'interface (`/dashboard/settings/users`):

**Accès**: ADMIN, DIRECTEUR, HR

1. Se connecter avec un compte autorisé
2. Cliquer sur "Nouvel utilisateur"
3. Remplir les informations :
   - Nom complet
   - Email
   - Mot de passe
   - **Rôle** :
     - ADMIN peut créer : EMPLOYEE, MANAGER, HR, DIRECTEUR, ADMIN
     - DIRECTEUR/HR peuvent créer : EMPLOYEE, MANAGER, HR, DIRECTEUR
   - Département (optionnel)
   - **Manager** : Sélectionner parmi MANAGER, HR, DIRECTEUR

### Recommandations :
- ✅ EMPLOYEE → Manager: MANAGER
- ✅ MANAGER → Manager: DIRECTEUR
- ✅ HR → Manager: DIRECTEUR ou aucun
- ✅ DIRECTEUR → Manager: aucun (sommet)
- ⚠️ ADMIN → Manager: aucun (hors hiérarchie)

### Notes importantes :
- 🎯 **DIRECTEUR** : L'interface affiche "Gestion de l'équipe" au lieu de "Gestion des utilisateurs"
- 🔒 **DIRECTEUR/HR** : Ne voient pas et ne peuvent pas créer de comptes ADMIN
- 👑 **ADMIN** : Seul rôle pouvant créer d'autres comptes ADMIN

---

## 🎨 Badges de Rôle (Interface)

| Rôle | Badge | Couleur |
|------|-------|---------|
| ADMIN | Admin Technique | 🔴 Rouge |
| DIRECTEUR | Directeur | 🟠 Orange |
| HR | RH | 🟣 Violet |
| MANAGER | Manager | 🔵 Bleu |
| EMPLOYEE | Employé | 🟢 Vert |

---

## 📝 Notes Importantes

1. **Séparation des rôles**:
   - ADMIN = Technique/Maintenance
   - DIRECTEUR = Opérationnel/RH

2. **Visibilité**:
   - Le compte ADMIN ne devrait pas apparaître dans les listes de managers
   - Le DIRECTEUR est le rôle visible au sommet de la hiérarchie RH

3. **Sécurité**:
   - ADMIN, DIRECTEUR et HR peuvent créer/modifier des utilisateurs
   - Seul ADMIN peut supprimer des utilisateurs et créer des comptes ADMIN
   - Le compte admin@chronodil.com est protégé contre la suppression

4. **Workflow HR**:
   - Tous les EMPLOYEE doivent avoir un manager pour soumettre des feuilles de temps
   - Le workflow de validation est: EMPLOYEE → MANAGER → DIRECTEUR/HR

---

## 🔧 Scripts de Maintenance

### Vérifier la hiérarchie :
```bash
pnpm exec tsx scripts/check-user-manager.ts
```

### Créer un compte directeur :
```bash
pnpm exec tsx scripts/create-director-account.ts
```

### Assigner un manager à un utilisateur :
```bash
pnpm exec tsx scripts/assign-manager-to-dereck.ts
```

---

**Date de mise à jour**: 2025-10-13
**Version**: 1.1 - Ajout des permissions DIRECTEUR et HR pour la gestion d'équipe
