# Guide d'Accès - Gestion d'Équipe pour le DIRECTEUR

## ✅ Réponse : OUI, l'option est disponible !

Le DIRECTEUR peut maintenant **assigner des managers** via l'interface des Paramètres.

---

## 🎯 Où trouver l'option de gestion d'utilisateurs ?

### Chemin 1 : Via l'onglet Paramètres ⚙️ (RECOMMANDÉ)

```
Menu latéral
  └─> Paramètres ⚙️
      └─> Onglet "Utilisateurs"
          └─> Carte "Gestion de l'équipe"
              └─> Bouton "Gérer mon équipe"
                  └─> Page complète de gestion
```

**Étapes détaillées :**

1. **Connectez-vous** avec votre compte DIRECTEUR
   ```
   Email: directeur@chronodil.com
   Mot de passe: Directeur2024!
   ```

2. **Cliquez sur "Paramètres"** dans le menu latéral gauche (icône ⚙️)

3. **Sélectionnez l'onglet "Utilisateurs"**
   - Cet onglet est maintenant visible pour ADMIN, DIRECTEUR et HR

4. **Cliquez sur "Gérer mon équipe"**
   - Vous accédez à la page complète de gestion d'équipe

### Chemin 2 : Accès direct

URL directe : `/dashboard/settings/users`

---

## 📋 Interface visuelle

### Dans les Paramètres :

```
┌──────────────────────────────────────────────────────────────┐
│ Paramètres                                                    │
│ Configuration de l'application et gestion des référentiels   │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Onglets :                                                      │
│ [Jours fériés] [Départements] [Notifications] [Rappels]      │
│ [Utilisateurs] [Général]     ← NOUVEAU : Visible pour vous   │
│                                                                │
│ ┌───────────────────────────────────────────────────────┐    │
│ │  📊 Gestion de l'équipe                               │    │
│ │  ─────────────────────────────────────────────────    │    │
│ │                                                        │    │
│ │  Accédez à la gestion complète de votre équipe et     │    │
│ │  assignez des managers                                │    │
│ │                                                        │    │
│ │  💡 Gérez votre équipe : créez des utilisateurs,      │    │
│ │  assignez des managers et organisez votre structure   │    │
│ │                                                        │    │
│ │              [Gérer mon équipe] ← Cliquez ici         │    │
│ │                                                        │    │
│ └───────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Sur la page de gestion d'équipe :

```
┌──────────────────────────────────────────────────────────────┐
│ Gestion de l'équipe                                           │
│ Gérez votre équipe et assignez des managers                  │
│                                          [Nouvel utilisateur] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ 🔍 [Rechercher un utilisateur...]                            │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Utilisateur | Rôle | Département | Manager | Statistiques    │
│ ──────────────────────────────────────────────────────────   │
│                                                                │
│ 👤 Odillon NANA        🟠 Directeur       🏢 -                │
│    directeur@...       Manager: -         📊 0 saisies        │
│                        👥 Manage 1 employé(s)    [✏️] [🔑]   │
│                                                                │
│ 👤 Anna                🔵 Manager         🏢 -                │
│    anna@odillon.com    Manager: Odillon   📊 0 saisies        │
│                        👥 Manage 1 employé(s)    [✏️] [🔑]   │
│                                                                │
│ 👤 Déreck              🟢 Employé         🏢 -                │
│    dereckdanel01@...   Manager: Anna      📊 X saisies        │
│                        👥 0 subordonné(s)        [✏️] [🔑]   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎬 Comment assigner un manager ?

### Option A : Lors de la création d'un nouvel utilisateur

1. **Cliquez sur "Nouvel utilisateur"** (bouton rouge en haut à droite)

2. **Remplissez le formulaire :**
   ```
   ┌──────────────────────────────────────────┐
   │ Nouvel utilisateur                        │
   ├──────────────────────────────────────────┤
   │                                            │
   │ Nom complet *                              │
   │ [Jean Dupont                     ]         │
   │                                            │
   │ Email *                                    │
   │ [jean.dupont@chronodil.com       ]         │
   │                                            │
   │ Mot de passe *                             │
   │ [••••••••                        ]         │
   │                                            │
   │ Rôle *                                     │
   │ [Employé                         ▼]        │
   │                                            │
   │ Département                                │
   │ [Sélectionner...                 ▼]        │
   │                                            │
   │ Manager ← ICI pour assigner               │
   │ [Anna                            ▼]        │
   │   Options disponibles :                    │
   │   - Anna (MANAGER)                         │
   │   - Odillon NANA (DIRECTEUR)              │
   │                                            │
   │        [Annuler]  [Créer]                 │
   └──────────────────────────────────────────┘
   ```

3. **Cliquez sur "Créer"**

### Option B : Pour un utilisateur existant

1. **Trouvez l'utilisateur** dans la liste (utilisez la recherche si besoin)

2. **Cliquez sur l'icône ✏️** (Modifier) à côté de son nom

3. **Modifiez le champ "Manager" :**
   ```
   ┌──────────────────────────────────────────┐
   │ Modifier l'utilisateur                    │
   ├──────────────────────────────────────────┤
   │                                            │
   │ Nom complet                                │
   │ [Jean Dupont                     ]         │
   │                                            │
   │ Email                                      │
   │ [jean.dupont@chronodil.com       ]         │
   │                                            │
   │ Rôle                                       │
   │ [Employé                         ▼]        │
   │                                            │
   │ Département                                │
   │ [Développement                   ▼]        │
   │                                            │
   │ Manager ← Changez ici                     │
   │ [Sélectionner...                 ▼]        │
   │   Options :                                │
   │   - Aucun                                  │
   │   - Anna (MANAGER)                         │
   │   - Odillon NANA (DIRECTEUR)              │
   │                                            │
   │   [Annuler]  [Mettre à jour]              │
   └──────────────────────────────────────────┘
   ```

4. **Cliquez sur "Mettre à jour"**

---

## 🎯 Cas d'usage pratiques

### 1. Nouvel employé dans une équipe existante

**Scénario** : Thomas rejoint l'équipe d'Anna

**Actions :**
1. Paramètres → Utilisateurs → Gérer mon équipe
2. Cliquer "Nouvel utilisateur"
3. Remplir :
   - Nom : Thomas Martin
   - Email : thomas.martin@chronodil.com
   - Mot de passe : MotDePasse123!
   - Rôle : Employé
   - **Manager : Anna**
4. Créer

**Résultat** : Thomas peut se connecter et soumettre ses feuilles de temps à Anna

---

### 2. Création d'un nouveau manager avec son équipe

**Scénario** : Sophie devient manager d'une nouvelle équipe de 3 personnes

**Actions :**

**Étape 1 - Créer Sophie (Manager)**
1. Nouvel utilisateur
2. Nom : Sophie Leblanc
3. Email : sophie.leblanc@chronodil.com
4. Rôle : Manager
5. **Manager : Odillon NANA** (vous-même)
6. Créer

**Étape 2 - Créer les membres de l'équipe**
Pour chaque membre (Paul, Marie, Luc) :
1. Nouvel utilisateur
2. Remplir les informations
3. Rôle : Employé
4. **Manager : Sophie Leblanc**
5. Créer

**Résultat** : Hiérarchie créée
```
Vous (Directeur)
  └─> Sophie (Manager)
       ├─> Paul (Employé)
       ├─> Marie (Employé)
       └─> Luc (Employé)
```

---

### 3. Réorganisation : Transfert d'équipe

**Scénario** : L'équipe de Sophie passe sous la supervision de Marc

**Actions :**

Pour chaque membre de l'équipe de Sophie (Paul, Marie, Luc) :
1. Trouver l'utilisateur
2. Cliquer ✏️ (Modifier)
3. **Manager : Changer de "Sophie" à "Marc"**
4. Mettre à jour

**Résultat** :
```
Avant :
Vous → Sophie → Paul, Marie, Luc
Vous → Marc

Après :
Vous → Sophie
Vous → Marc → Paul, Marie, Luc
```

---

## 📊 Managers disponibles

### Qui peut être manager ?

Seuls les utilisateurs avec ces rôles peuvent être assignés comme managers :

| Rôle | Badge | Peut être manager ? |
|------|-------|---------------------|
| 🟠 DIRECTEUR | Directeur | ✅ Oui |
| 🟣 HR | RH | ✅ Oui |
| 🔵 MANAGER | Manager | ✅ Oui |
| 🟢 EMPLOYEE | Employé | ❌ Non |
| 🔴 ADMIN | Admin Technique | ❌ Non (invisible) |

**Note** : Les comptes ADMIN n'apparaissent pas dans votre liste car ils sont techniques et hors hiérarchie RH.

---

## ✅ Ce que vous POUVEZ faire

En tant que DIRECTEUR, vous avez les permissions suivantes :

| Action | Statut | Description |
|--------|--------|-------------|
| ✅ Voir tous les utilisateurs | Autorisé | Sauf ADMIN (masqués) |
| ✅ Créer des utilisateurs | Autorisé | EMPLOYEE, MANAGER, HR, DIRECTEUR |
| ✅ Modifier des utilisateurs | Autorisé | Tous sauf ADMIN |
| ✅ **Assigner des managers** | Autorisé | **Fonctionnalité principale** |
| ✅ Changer les managers | Autorisé | À tout moment |
| ✅ Réinitialiser mots de passe | Autorisé | Via icône 🔑 |
| ✅ Gérer les départements | Autorisé | Créer, modifier |

---

## ❌ Ce que vous NE POUVEZ PAS faire

Limitations du rôle DIRECTEUR (pour la sécurité) :

| Action | Statut | Raison |
|--------|--------|--------|
| ❌ Créer des comptes ADMIN | Interdit | Sécurité technique |
| ❌ Voir les comptes ADMIN | Impossible | Masqués intentionnellement |
| ❌ Modifier des comptes ADMIN | Interdit | Protection système |
| ❌ Supprimer des utilisateurs | Interdit | Éviter suppressions accidentelles |
| ❌ Assigner ADMIN comme manager | Impossible | ADMIN hors hiérarchie RH |

**Si vous avez besoin de ces actions** : Contactez l'administrateur technique (admin@chronodil.com)

---

## 🔍 Recherche et filtrage

### Barre de recherche

En haut de la page "Gestion de l'équipe", utilisez la barre de recherche pour trouver rapidement :

- **Par nom** : "Anna"
- **Par email** : "anna@odillon.com"
- **Par département** : "Développement"

### Informations visibles

Pour chaque utilisateur dans la liste :

```
👤 Nom de l'utilisateur          🎭 Badge de rôle
   email@example.com              🏢 Département
   Manager: Nom du manager        📊 X saisies, Y subordonné(s)
                                  [✏️ Modifier] [🔑 Mot de passe]
```

---

## 🚨 Problèmes courants

### Problème : "Vous n'avez pas de manager assigné"

**Symptôme** : Un employé ne peut pas soumettre sa feuille de temps

**Cause** : L'employé n'a pas de manager assigné

**Solution** :
1. Aller dans Gestion de l'équipe
2. Trouver l'employé concerné
3. Cliquer sur ✏️ (Modifier)
4. Assigner un manager dans le champ "Manager"
5. Mettre à jour

---

### Problème : "Je ne vois pas un utilisateur"

**Symptôme** : Un utilisateur manque dans la liste

**Causes possibles** :

1. **Si c'est un compte ADMIN** → C'est normal, ils sont masqués
2. **Si c'est un compte normal** → Utilisez la barre de recherche

**Solution** : Recherchez par nom ou email dans la barre de recherche

---

### Problème : "Je ne peux pas créer de compte ADMIN"

**Symptôme** : Option "ADMIN" absente du sélecteur de rôle

**Cause** : Seul un ADMIN peut créer d'autres ADMIN

**Solution** : C'est une restriction de sécurité. Contactez admin@chronodil.com si vous avez besoin d'un compte ADMIN.

---

## 📞 Support

### Besoin d'aide ?

- **Email support** : admin@chronodil.com
- **Documentation complète** :
  - [Guide Directeur - Gestion d'équipe](GUIDE_DIRECTEUR_GESTION_EQUIPE.md)
  - [Hiérarchie organisationnelle](HIERARCHIE_ORGANISATIONNELLE.md)

### Ressources disponibles

| Document | Description |
|----------|-------------|
| `GUIDE_DIRECTEUR_GESTION_EQUIPE.md` | Guide complet avec cas d'usage détaillés |
| `HIERARCHIE_ORGANISATIONNELLE.md` | Structure des rôles et permissions |
| `VALIDATION_PERMISSIONS.md` | Détails sur les permissions |

---

## 📝 Récapitulatif en 5 étapes

### Pour commencer à gérer votre équipe :

```
1. Paramètres ⚙️
   └─> Onglet "Utilisateurs"

2. Bouton "Gérer mon équipe"
   └─> Page de gestion complète

3. Créer des utilisateurs
   └─> "Nouvel utilisateur"
       └─> Remplir le formulaire
           └─> Assigner un manager ✅

4. Modifier des utilisateurs existants
   └─> Cliquer ✏️
       └─> Changer le manager si besoin

5. Vérifier la structure
   └─> Tous les EMPLOYEE ont un manager ✅
```

---

## ✨ Résumé

### En tant que DIRECTEUR, vous pouvez maintenant :

✅ Accéder facilement à la gestion d'équipe via **Paramètres → Utilisateurs**

✅ **Assigner des managers** lors de la création d'utilisateurs

✅ **Changer les managers** pour réorganiser vos équipes

✅ Créer une structure hiérarchique complète et fonctionnelle

✅ Gérer votre organisation de manière autonome

---

**Dernière mise à jour** : 2025-10-13
**Version** : 1.0
**Auteur** : Équipe Chronodil
