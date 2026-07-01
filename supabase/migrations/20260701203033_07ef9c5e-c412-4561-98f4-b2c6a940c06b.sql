
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grant_admin_for_vertcorp_domain() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
