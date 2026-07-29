-- Grant admin access to every account using the official Vert Corp domain.
-- The role is assigned at account creation; email access is still enforced by
-- the configured Supabase authentication/verification flow.
CREATE OR REPLACE FUNCTION public.grant_admin_for_vertcorp_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(split_part(NEW.email, '@', 2)) = 'vertcorp.org' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_vertcorp_domain();

-- Backfill matching users that already exist when this migration is applied.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(split_part(email, '@', 2)) = 'vertcorp.org'
ON CONFLICT (user_id, role) DO NOTHING;

DROP FUNCTION IF EXISTS public.grant_admin_for_vertcoep_domain();
