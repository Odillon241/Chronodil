# Résolution du bug des Paramètres Généraux

## Problème initial

Lors de la modification des paramètres généraux dans l'interface `/dashboard/settings?tab=general`, l'erreur suivante apparaissait :

```
Invalid prisma.user.update() invocation
The column `«` does not exist in the current database.
```

## Diagnostic

### Étape 1 : Investigation des colonnes
Le caractère bizarre `«` (guillemet français) laissait penser à un problème d'encodage. Après vérification, les colonnes des paramètres généraux (darkModeEnabled, accentColor, etc.) **n'existaient pas** dans la base de données.

### Étape 2 : Ajout des colonnes manquantes
Les colonnes suivantes ont été ajoutées manuellement via SQL :

**Apparence :**
- `darkModeEnabled` (Boolean, défaut: true)
- `accentColor` (String, défaut: "rusty-red")
- `viewDensity` (String, défaut: "normal")  
- `fontSize` (Integer, défaut: 16)

**Localisation :**
- `language` (String, défaut: "fr")
- `dateFormat` (String, défaut: "DD/MM/YYYY")
- `hourFormat` (String, défaut: "24")
- `timezone` (String, défaut: "Africa/Libreville")

**Accessibilité :**
- `highContrast` (Boolean, défaut: false)
- `screenReaderMode` (Boolean, défaut: false)
- `reduceMotion` (Boolean, défaut: false)

### Étape 3 : Découverte du vrai problème
Après l'ajout des colonnes, l'erreur persistait. Des tests ont révélé :
- ✅ Les requêtes **SELECT** fonctionnaient parfaitement
- ❌ Les requêtes **UPDATE** échouaient systématiquement

Un test avec `$executeRaw` a révélé le message d'erreur complet :
```
l'enregistrement « new » n'a pas de champs « emailverified »
```

## Cause racine

Un **trigger PostgreSQL** sur la table `User` référençait des colonnes avec une **mauvaise casse** :
- `emailverified` au lieu de `emailVerified`
- Probablement d'autres colonnes en minuscules

Ce trigger a été créé lors de migrations précédentes et n'était pas compatible avec le schéma Prisma actuel utilisant le camelCase.

Le caractère `«` dans l'erreur était en fait le **début du message d'erreur en français** du trigger PostgreSQL, mal interprété par Prisma.

## Solution appliquée

1. **Suppression des triggers obsolètes** sur la table `User`
2. **Ajout des colonnes manquantes** avec les valeurs par défaut
3. **Régénération du client Prisma** avec `pnpm prisma generate`
4. **Nettoyage du cache Next.js** (dossier `.next`)
5. **Redémarrage du serveur** de développement

## Vérification

Après la correction, tous les tests passent :
- ✅ UPDATE SQL brut fonctionnel
- ✅ UPDATE Prisma simple fonctionnel  
- ✅ UPDATE Prisma avec select fonctionnel
- ✅ Interface de paramètres généraux opérationnelle

## Leçons apprises

1. **Prudence avec les triggers** : Éviter les triggers qui référencent des colonnes spécifiques, surtout lors de l'utilisation d'un ORM comme Prisma.

2. **Synchronisation schéma/base** : Toujours créer une migration Prisma lorsque le schéma est modifié, plutôt que d'ajouter des colonnes manuellement.

3. **Messages d'erreur trompeurs** : Un caractère bizarre dans une erreur peut cacher un problème plus profond (ici, un trigger PostgreSQL).

## Prévention

Pour éviter ce type de problème à l'avenir :

1. Utiliser uniquement `pnpm prisma migrate dev` pour les changements de schéma
2. Éviter les triggers manuels sur les tables gérées par Prisma
3. Documenter tous les ajouts de triggers ou contraintes
4. Tester systématiquement les opérations CRUD après une modification de schéma

## Date de résolution

20 octobre 2025

