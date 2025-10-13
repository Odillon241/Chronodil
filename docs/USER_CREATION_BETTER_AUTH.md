# Création d'Utilisateurs avec Better Auth

## Modifications Apportées

### 1. Fonction `createUser` (user.actions.ts)

**Problème Initial:**
- Créait uniquement l'utilisateur dans la table `User`
- Ne créait PAS de compte d'authentification
- Le mot de passe n'était pas hashé
- L'utilisateur ne pouvait pas se connecter

**Solution:**
- Utilise l'API Better Auth pour créer le compte (`/api/auth/sign-up/email`)
- Better Auth génère automatiquement le hash correct (format: `hash:salt` de 161 caractères)
- Le compte est créé dans la table `Account` avec le bon format
- Ensuite, mise à jour de l'utilisateur avec le rôle, département, et manager

**Flux de Création:**
```
1. Vérification que l'email n'existe pas
2. Appel API Better Auth → Création User + Account avec hash correct
3. Récupération de l'utilisateur créé
4. Mise à jour avec rôle, département, manager
5. Marquer email comme vérifié (créé par admin)
```

### 2. Fonction `resetUserPassword` (user.actions.ts)

**Problème Initial:**
- Ne faisait rien avec le mot de passe
- Commentaire: "vous devriez hasher le mot de passe"
- Le mot de passe n'était jamais changé

**Solution:**
- Crée un utilisateur temporaire via l'API Better Auth avec le nouveau mot de passe
- Récupère le hash Better Auth généré
- Applique ce hash au compte de l'utilisateur cible
- Nettoie l'utilisateur temporaire

**Flux de Réinitialisation:**
```
1. Vérifier que l'utilisateur existe
2. Créer utilisateur temporaire avec nouveau mot de passe via API
3. Extraire le hash du compte temporaire
4. Appliquer le hash au compte de l'utilisateur cible
5. Nettoyer l'utilisateur temporaire
```

## Pourquoi Cette Approche?

### Format de Hash Better Auth
Better Auth utilise un format propriétaire:
- **Format:** `hash:salt` (161 caractères)
- **PAS un bcrypt standard** ($2b$10$... de 60 caractères)
- Le hash doit être généré via l'API Better Auth pour être valide

### Avantages
1. ✅ **Compatibilité totale** avec Better Auth
2. ✅ **Sécurité maximale** - Hash généré par le système officiel
3. ✅ **Pas de duplication** de la logique de hashage
4. ✅ **Maintenance facilitée** - Si Better Auth change son algo, ça continue de fonctionner

## Test de Création d'Utilisateur

### Via l'Interface Admin

1. **Connectez-vous en tant qu'admin**
   - Email: admin@chronodil.com
   - Mot de passe: Admin2025!

2. **Accédez à la gestion des utilisateurs**
   - Dashboard → Settings → Utilisateurs

3. **Créer un nouvel utilisateur**
   - Cliquez sur "Nouvel utilisateur"
   - Remplissez le formulaire:
     - Nom: Test User
     - Email: test.user@chronodil.com
     - Mot de passe: Test123!
     - Rôle: EMPLOYEE
     - Département: (optionnel)
     - Manager: (optionnel)
   - Cliquez sur "Créer"

4. **Vérifier la création**
   - L'utilisateur apparaît dans la liste
   - Déconnectez-vous
   - Connectez-vous avec le nouvel utilisateur (test.user@chronodil.com / Test123!)
   - ✅ La connexion devrait fonctionner!

## Test de Réinitialisation de Mot de Passe

1. **Connectez-vous en tant qu'admin**

2. **Sélectionnez un utilisateur**
   - Cliquez sur l'icône "Clé" (réinitialiser mot de passe)

3. **Définir un nouveau mot de passe**
   - Entrez: NewPassword123!
   - Confirmez

4. **Tester le nouveau mot de passe**
   - Déconnectez-vous
   - Connectez-vous avec l'utilisateur et le nouveau mot de passe
   - ✅ La connexion devrait fonctionner!

## Dépannage

### L'utilisateur est créé mais ne peut pas se connecter

**Vérifier:**
1. Le compte d'authentification existe dans la table `Account`
   ```bash
   node scripts/check-admin-account.js
   ```

2. Le hash a bien 161 caractères (format Better Auth)

3. Le serveur dev est bien démarré sur le port correct

### Erreur lors de la création

**Causes possibles:**
- Le serveur dev n'est pas démarré
- L'email existe déjà
- Le mot de passe est trop court (min 6 caractères)
- Problème de connexion à l'API Better Auth

**Solution:**
- Vérifier les logs du serveur
- Vérifier que le port 3000 est accessible
- Vérifier la variable d'environnement `BETTER_AUTH_URL`

## Notes Techniques

### Variables d'Environnement
```env
BETTER_AUTH_URL="http://localhost:3000"
```

### Format du Hash Better Auth
```
Exemple: 52683713c3ca4a0848f9dcd5a7edb546:8a24bf99f0cfd787555124e7640...
         └─────────── hash ────────────┘ └────────── salt ──────────┘
         Total: 161 caractères
```

### Sécurité
- ✅ Les mots de passe ne sont JAMAIS stockés en clair
- ✅ Hashage via Better Auth (sécurisé)
- ✅ Salt unique par utilisateur
- ✅ Les utilisateurs temporaires sont immédiatement nettoyés

---

**Date:** 12 octobre 2025
**Version:** 1.0
**Compatibilité:** Better Auth + Prisma
