-- Migration: add_position_to_user
-- Description: Ajoute le champ position (poste) au modèle User

-- Ajouter la colonne position à la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;

-- Commentaire pour indiquer l'usage de ce champ
COMMENT ON COLUMN "User"."position" IS 'Poste/fonction de l''utilisateur dans l''entreprise';
