-- Migration manuelle: Ajouter le rôle DIRECTEUR
-- Étape 1: Ajouter la valeur DIRECTEUR à l'enum Role

-- PostgreSQL ne permet pas de modifier directement un enum utilisé
-- On doit créer un nouvel enum, migrer les données, puis remplacer l'ancien

BEGIN;

-- Créer un nouveau type enum avec DIRECTEUR
CREATE TYPE "Role_new" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR', 'DIRECTEUR', 'ADMIN');

-- Modifier la colonne pour utiliser le nouveau type
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING ("role"::text::"Role_new");

-- Supprimer l'ancien type
DROP TYPE "Role";

-- Renommer le nouveau type
ALTER TYPE "Role_new" RENAME TO "Role";

COMMIT;

-- Vérification
SELECT DISTINCT role FROM "User";
