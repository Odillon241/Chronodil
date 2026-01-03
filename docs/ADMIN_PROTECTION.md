# Protection du Compte Administrateur Principal

## Informations de Connexion

```
Email:         admin@chronodil.com
Mot de passe:  Admin2025!
Rôle:          ADMIN
```

**⚠️ IMPORTANT:** Changez ce mot de passe après votre première connexion!

## Protections Mises en Place

### 1. Protection au Niveau Base de Données (PostgreSQL)

#### Trigger de Protection contre la Suppression
- **Fonction:** `prevent_admin_deletion()`
- **Trigger:** `protect_admin_delete`
- **Effet:** Empêche la suppression du compte admin@chronodil.com avec le rôle ADMIN
- **Message d'erreur:** "Le compte administrateur principal ne peut pas être supprimé"

#### Trigger de Protection contre les Modifications Non Autorisées
- **Fonction:** `prevent_admin_unauthorized_updates()`
- **Trigger:** `protect_admin_update`
- **Effet:** Empêche la modification de:
  - L'adresse email
  - Le rôle ADMIN
  - Le statut de vérification de l'email
- **Autorise:** La modification du nom, avatar, image et mot de passe

### 2. Protection au Niveau Interface (Frontend)

#### Page de Gestion des Utilisateurs
**Fichier:** `src/app/dashboard/settings/users/page.tsx`

**Restrictions:**
1. **Bouton Supprimer**
   - Désactivé visuellement pour le compte admin principal
   - Tooltip: "Compte protégé"

2. **Fonction de Suppression**
   - Vérifie l'email et le rôle avant suppression
   - Affiche un toast d'erreur si tentative de suppression

3. **Fonction de Modification**
   - Affiche un message informatif lors de l'édition
   - Toast: "Seul le mot de passe peut être modifié pour le compte administrateur principal"

4. **Formulaire d'Édition**
   - Champ Email: désactivé + message explicatif
   - Champ Rôle: désactivé + message explicatif
   - Champs Nom, Département, Manager: modifiables
   - Mot de passe: réinitialisable via le bouton dédié

### 3. Contrôle d'Accès

#### Accès à la Page de Gestion
- **Restriction:** Uniquement les utilisateurs avec le rôle ADMIN
- **Vérification:** Ligne 88-97 du fichier page.tsx
- **Redirection:** Vers /dashboard/settings si accès non autorisé

## Scripts Utilitaires

### Reset et Création de l'Admin

**Méthode Recommandée (Complète):**
```bash
# 1. Nettoyer la base et créer l'utilisateur admin
pnpm exec tsx scripts/create-admin-direct.ts

# 2. Générer et appliquer le hash Better Auth correct
node scripts/create-temp-and-copy.js

# 3. Vérifier que tout fonctionne
node scripts/check-admin-account.js
```

**⚠️ Important:** Better Auth utilise un format de hash propriétaire (hash:salt de 161 caractères), pas bcrypt standard. Le script `create-temp-and-copy.js` génère un hash via l'API Better Auth, garantissant une compatibilité totale.

**Note Technique:**
- Better Auth génère un hash au format: `hash:salt` (161 caractères)
- Ce n'est PAS un simple hash bcrypt ($2b$10$...)
- Le hash doit être généré via l'API Better Auth pour fonctionner

### Application des Protections
```bash
# Appliquer les triggers de protection
pnpm prisma migrate deploy
```

## État des Migrations

Migration appliquée: `20251012091443_protect_admin`

**Contenu:**
- Fonction `prevent_admin_deletion()`
- Fonction `prevent_admin_unauthorized_updates()`
- Triggers associés

## Résumé des Capacités

### ✅ Autorisé pour l'Admin Principal
- ✅ Connexion à l'application
- ✅ Modification du nom
- ✅ Modification de l'avatar/image
- ✅ Réinitialisation du mot de passe
- ✅ Accès complet à toutes les fonctionnalités ADMIN
- ✅ Gestion des autres utilisateurs

### ❌ Interdit pour l'Admin Principal
- ❌ Suppression du compte
- ❌ Modification de l'email
- ❌ Modification du rôle
- ❌ Modification du statut de vérification email

## Sécurité Additionnelle

### Recommandations
1. **Changez immédiatement** le mot de passe par défaut
2. **Utilisez** un gestionnaire de mots de passe
3. **Activez** l'authentification à deux facteurs (si disponible)
4. **Surveillez** les logs d'audit pour détecter toute activité suspecte
5. **Ne partagez jamais** les identifiants admin

### Maintenance
- Vérifiez régulièrement que les triggers sont toujours actifs:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname LIKE 'protect_admin%';
  ```

- Testez les protections après chaque migration importante

## Support

En cas de problème avec le compte administrateur:
1. Vérifiez que les migrations sont appliquées
2. Vérifiez que les triggers existent dans la base
3. Consultez les logs PostgreSQL pour les erreurs
4. Contactez l'équipe de développement si nécessaire

---

**Date de création:** 12 octobre 2025
**Dernière mise à jour:** 12 octobre 2025
**Version:** 1.0
