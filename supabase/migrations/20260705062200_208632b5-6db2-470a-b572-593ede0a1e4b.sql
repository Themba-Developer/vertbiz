CREATE OR REPLACE FUNCTION public.grant_admin_for_vertcorp_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'support@vertcorp.org' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_grant_vertcorp_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_vertcorp_admin ON auth.users;

CREATE TRIGGER on_auth_user_grant_vertcorp_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.grant_admin_for_vertcorp_domain();

CREATE TRIGGER on_auth_user_confirmed_grant_vertcorp_admin
AFTER UPDATE OF email_confirmed_at, email ON auth.users
FOR EACH ROW
WHEN (NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_vertcorp_domain();