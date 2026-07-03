-- Update admin domain to check for @vertcoep.org and @vertcorp.org
CREATE OR REPLACE FUNCTION public.grant_admin_for_vertcoep_domain()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (lower(split_part(NEW.email, '@', 2)) = 'vertcoep.org' 
          OR lower(split_part(NEW.email, '@', 2)) = 'vertcorp.org') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;

-- Create new triggers with updated function
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.grant_admin_for_vertcoep_domain();

CREATE TRIGGER on_auth_user_confirmed_grant_admin
AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_vertcoep_domain();

-- Add columns for enhanced registration
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS service_id text,
ADD COLUMN IF NOT EXISTS director_ids_path text[],
ADD COLUMN IF NOT EXISTS director_addresses_path text[];

-- Update application_documents kind check to include director_id
ALTER TABLE public.application_documents
DROP CONSTRAINT IF EXISTS application_documents_kind_check;

ALTER TABLE public.application_documents
ADD CONSTRAINT application_documents_kind_check CHECK (kind IN ('id_copy','proof_of_address','certificate','director_id'));
