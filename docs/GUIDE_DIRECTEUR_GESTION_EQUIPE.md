# Guide du Directeur - Gestion d'Équipe

## 🎯 Vue d'ensemble

En tant que **DIRECTEUR**, vous avez accès à des fonctionnalités de gestion d'équipe qui vous permettent de :
- ✅ Créer de nouveaux utilisateurs
- ✅ **Assigner des managers** à vos employés
- ✅ Modifier les informations des utilisateurs
- ✅ Organiser votre structure hiérarchique
- ✅ Gérer les départements

Ce guide vous explique comment utiliser ces fonctionnalités.

---

## 📍 Comment accéder à la gestion d'équipe ?

### Méthode 1 : Via les Paramètres (Recommandé)

1. **Cliquez sur "Paramètres"** dans le menu latéral (icône ⚙️)
2. **Sélectionnez l'onglet "Utilisateurs"**
3. Vous verrez une carte avec le titre **"Gestion de l'équipe"**
4. Cliquez sur le bouton **"Gérer mon équipe"**

### Méthode 2 : Accès direct

Allez directement à : `/dashboard/settings/users`

---

## 👥 Créer un nouvel utilisateur

### Étapes :

1. **Accédez à la page** "Gestion de l'équipe"
2. **Cliquez sur** "Nouvel utilisateur" (bouton rouge en haut à droite)
3. **Remplissez le formulaire** :

   | Champ | Description | Obligatoire |
   |-------|-------------|-------------|
   | **Nom complet** | Nom et prénom de l'employé | ✅ Oui |
   | **Email** | Adresse email professionnelle | ✅ Oui |
   | **Mot de passe** | Mot de passe initial (min. 6 caractères) | ✅ Oui |
   | **Rôle** | EMPLOYEE, MANAGER, HR, ou DIRECTEUR | ✅ Oui |
   | **Département** | Département de rattachement | ❌ Optionnel |
   | **Manager** | Manager direct de l'utilisateur | ❌ Optionnel* |

   *\*Obligatoire pour les EMPLOYEE qui doivent soumettre des feuilles de temps*

4. **Cliquez sur "Créer"**

### 💡 Conseils :

- **Pour un EMPLOYEE** : Assignez toujours un manager (généralement un MANAGER)
- **Pour un MANAGER** : Assignez-vous comme manager (vous-même, le DIRECTEUR)
- **Pour un HR** : Peut ne pas avoir de manager ou vous-même
- **Pour un autre DIRECTEUR** : Généralement sans manager

---

## 🎯 Assigner ou changer un manager

### Pour un nouvel utilisateur :
Lors de la création, sélectionnez le manager dans le champ "Manager"

### Pour un utilisateur existant :

1. **Trouvez l'utilisateur** dans la liste
2. **Cliquez sur l'icône de modification** (✏️) à côté de son nom
3. **Modifiez le champ "Manager"**
4. **Sélectionnez le nouveau manager** dans la liste déroulante
5. **Cliquez sur "Mettre à jour"**

### Managers disponibles :
- Seuls les utilisateurs avec les rôles **MANAGER**, **HR**, ou **DIRECTEUR** peuvent être managers
- Les comptes **ADMIN** (techniques) ne sont pas disponibles comme managers

---

## 📊 Organiser votre structure hiérarchique

### Exemple de structure recommandée :

```
VOUS (Directeur) - Odillon NANA
    ├─> MANAGER - Chef de Département 1
    │       ├─> EMPLOYEE - Équipier 1
    │       ├─> EMPLOYEE - Équipier 2
    │       └─> EMPLOYEE - Équipier 3
    │
    ├─> MANAGER - Chef de Département 2
    │       ├─> EMPLOYEE - Équipier 4
    │       └─> EMPLOYEE - Équipier 5
    │
    └─> HR - Responsable RH
            └─> EMPLOYEE - Assistant RH
```

### Étapes pour créer cette structure :

1. **Créez les MANAGER** avec vous-même comme manager
2. **Créez les EMPLOYEE** en leur assignant leur MANAGER respectif
3. **Créez les HR** avec vous-même ou sans manager
4. **Ajustez si nécessaire** en modifiant les utilisateurs

---

## 🔍 Rechercher et filtrer

### Barre de recherche :
En haut de la page, utilisez la barre de recherche pour trouver rapidement un utilisateur par :
- Nom
- Email
- Département

### Informations visibles :
Pour chaque utilisateur, vous voyez :
- **Avatar et nom**
- **Rôle** (avec badge coloré)
- **Département**
- **Manager assigné**
- **Statistiques** (nombre de saisies, de subordonnés)

---

## 🎨 Comprendre les badges de rôle

| Badge | Rôle | Couleur | Description |
|-------|------|---------|-------------|
| 🟠 Directeur | DIRECTEUR | Orange | Direction de l'entreprise |
| 🟣 RH | HR | Violet | Ressources Humaines |
| 🔵 Manager | MANAGER | Bleu | Gestion d'équipe |
| 🟢 Employé | EMPLOYEE | Vert | Employé standard |

**Note** : Vous ne verrez PAS les comptes ADMIN (🔴 Admin Technique) car ils sont techniques et masqués.

---

## 🚫 Limitations du rôle DIRECTEUR

### Ce que vous NE POUVEZ PAS faire :

❌ **Créer des comptes ADMIN**
- Seul un ADMIN technique peut créer d'autres ADMIN

❌ **Modifier des comptes ADMIN**
- Les comptes ADMIN sont protégés et invisibles

❌ **Supprimer des utilisateurs**
- Seul un ADMIN peut supprimer des comptes (pour éviter les suppressions accidentelles)

❌ **Voir ou sélectionner des ADMIN comme managers**
- Les ADMIN sont hors de la hiérarchie RH

### Ce que vous POUVEZ faire :

✅ **Créer tous les rôles opérationnels**
- EMPLOYEE, MANAGER, HR, DIRECTEUR

✅ **Modifier tous les utilisateurs** (sauf ADMIN)
- Nom, email, rôle, département, manager

✅ **Assigner et réassigner des managers**
- Changer la structure hiérarchique à tout moment

✅ **Gérer l'organisation complète**
- Structure, départements, hiérarchie

---

## 🔄 Cas d'usage courants

### 1. Nouvel employé rejoint l'équipe

**Scénario** : Thomas rejoint le Département Développement sous la supervision de Sophie (Manager)

**Actions** :
1. Créer un utilisateur "Thomas"
2. Rôle : EMPLOYEE
3. Département : Développement
4. Manager : Sophie
5. Créer le compte

**Résultat** : Thomas peut maintenant se connecter et soumettre ses feuilles de temps. Sophie recevra les notifications de validation.

---

### 2. Promotion d'un employé en Manager

**Scénario** : Marie, actuellement EMPLOYEE, devient Manager d'une nouvelle équipe

**Actions** :
1. Modifier Marie
2. Changer rôle : MANAGER
3. Manager : Odillon NANA (vous-même)
4. Sauvegarder
5. Pour chaque membre de son équipe :
   - Modifier l'utilisateur
   - Manager : Marie
   - Sauvegarder

**Résultat** : Marie peut maintenant valider les feuilles de temps de son équipe.

---

### 3. Réorganisation d'équipe

**Scénario** : L'équipe de Sophie est transférée sous la supervision de Marc

**Actions** :
1. Pour chaque membre de l'équipe de Sophie :
   - Modifier l'utilisateur
   - Manager : Marc
   - Sauvegarder
2. Modifier Sophie si elle change aussi de manager
   - Manager : Marc ou Odillon NANA

**Résultat** : Marc reçoit maintenant les demandes de validation de toute l'équipe.

---

### 4. Créer un nouveau département avec son manager

**Scénario** : Ouverture d'un département Marketing avec Julie comme Manager

**Actions** :
1. **Créer le département** (onglet Départements dans Paramètres)
   - Nom : Marketing
   - Code : MKT
   - Sauvegarder

2. **Créer Julie** (Manager)
   - Nom : Julie Dupont
   - Email : julie@chronodil.com
   - Rôle : MANAGER
   - Département : Marketing
   - Manager : Odillon NANA
   - Créer

3. **Créer les membres de l'équipe**
   - Pour chaque employé :
     - Rôle : EMPLOYEE
     - Département : Marketing
     - Manager : Julie
     - Créer

**Résultat** : Le nouveau département Marketing est opérationnel avec sa hiérarchie.

---

## 🔐 Sécurité et bonnes pratiques

### Mots de passe :
- ✅ Utilisez des mots de passe forts (min. 8 caractères avec chiffres et symboles)
- ✅ Informez l'utilisateur de changer son mot de passe lors de la première connexion
- ✅ Gardez une trace des mots de passe initiaux de manière sécurisée

### Attribution de managers :
- ✅ Tous les EMPLOYEE doivent avoir un manager (obligatoire pour les feuilles de temps)
- ✅ Les MANAGER doivent avoir un manager (généralement le DIRECTEUR)
- ✅ Vérifiez régulièrement que la structure est à jour

### Rôles :
- ✅ N'attribuez le rôle MANAGER qu'aux personnes qui gèrent réellement une équipe
- ✅ N'attribuez le rôle DIRECTEUR qu'aux cadres dirigeants
- ✅ Utilisez HR uniquement pour le personnel RH

---

## 🆘 Problèmes courants et solutions

### Problème : "Vous n'avez pas de manager assigné"

**Cause** : Un EMPLOYEE tente de soumettre une feuille de temps sans manager

**Solution** :
1. Allez dans Gestion de l'équipe
2. Trouvez l'employé concerné
3. Cliquez sur Modifier (✏️)
4. Assignez un manager
5. Sauvegardez

---

### Problème : "Je ne vois pas tous les utilisateurs"

**Cause** : Les comptes ADMIN sont masqués pour les DIRECTEUR

**Solution** : C'est normal ! Les comptes ADMIN (techniques) ne doivent pas apparaître dans votre gestion d'équipe. Vous voyez uniquement les utilisateurs opérationnels.

---

### Problème : "Je ne peux pas créer de compte ADMIN"

**Cause** : Seul un ADMIN peut créer d'autres ADMIN

**Solution** : C'est une restriction de sécurité. Si vous avez besoin d'un compte ADMIN, contactez l'administrateur technique.

---

### Problème : "Je ne peux pas supprimer un utilisateur"

**Cause** : Les DIRECTEUR ne peuvent pas supprimer d'utilisateurs

**Solution** : Contactez l'administrateur ADMIN pour supprimer un compte. C'est une sécurité pour éviter les suppressions accidentelles.

---

## 📞 Besoin d'aide ?

### Contacts :
- **Support technique** : admin@chronodil.com
- **Documentation complète** : `/docs/HIERARCHIE_ORGANISATIONNELLE.md`

### Ressources :
- Guide de la hiérarchie : `docs/HIERARCHIE_ORGANISATIONNELLE.md`
- Validation des permissions : `docs/VALIDATION_PERMISSIONS.md`

---

## 🎓 Résumé des étapes clés

### Pour commencer :

1. ✅ Accédez à **Paramètres** → **Utilisateurs** → **"Gérer mon équipe"**
2. ✅ Créez vos **MANAGER** avec vous-même comme manager
3. ✅ Créez vos **EMPLOYEE** en leur assignant leur manager
4. ✅ Vérifiez que tous les EMPLOYEE ont un manager
5. ✅ Testez en demandant à un employé de soumettre une feuille de temps

### En continu :

- 🔄 Mettez à jour les managers lors des changements organisationnels
- 👀 Vérifiez régulièrement la structure hiérarchique
- 📊 Assurez-vous que tous les nouveaux employés ont un manager

---

**Dernière mise à jour** : 2025-10-13
**Version** : 1.0
