GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_deliveries TO authenticated;
GRANT ALL ON public.application_deliveries TO service_role;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;