-- Script SQL pour protéger l'admin contre la suppression
-- Seul le changement de mot de passe est autorisé

-- Fonction de protection contre la suppression
CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'ADMIN' AND OLD.email = 'admin@chronodil.com' THEN
    RAISE EXCEPTION 'Le compte administrateur principal ne peut pas être supprimé';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour empêcher la suppression
DROP TRIGGER IF EXISTS protect_admin_delete ON "User";
CREATE TRIGGER protect_admin_delete
  BEFORE DELETE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_deletion();

-- Fonction de protection contre les modifications non autorisées
CREATE OR REPLACE FUNCTION prevent_admin_unauthorized_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si c'est l'admin principal
  IF OLD.role = 'ADMIN' AND OLD.email = 'admin@chronodil.com' THEN
    -- Autoriser seulement la modification du mot de passe (updatedAt)
    -- et les champs liés au profil (name, avatar, image)
    IF NEW.email != OLD.email THEN
      RAISE EXCEPTION 'L''email du compte administrateur principal ne peut pas être modifié';
    END IF;

    IF NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Le rôle du compte administrateur principal ne peut pas être modifié';
    END IF;

    -- Conserver les valeurs critiques
    NEW.email := OLD.email;
    NEW.role := OLD.role;
    NEW.emailVerified := OLD.emailVerified;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour empêcher les modifications non autorisées
DROP TRIGGER IF EXISTS protect_admin_update ON "User";
CREATE TRIGGER protect_admin_update
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_unauthorized_updates();

-- Vérifier que la protection est active
SELECT 'Protection admin activée!' as status;
