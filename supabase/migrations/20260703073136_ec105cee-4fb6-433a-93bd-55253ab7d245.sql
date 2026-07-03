CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users manage own applications" ON public.applications;
CREATE POLICY "Users manage own applications"
ON public.applications
FOR ALL
TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'))
WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Docs visible to owner or admin" ON public.application_documents;
CREATE POLICY "Docs visible to owner or admin"
ON public.application_documents
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Docs insertable by owner or admin" ON public.application_documents;
CREATE POLICY "Docs insertable by owner or admin"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Docs deletable by owner or admin" ON public.application_documents;
CREATE POLICY "Docs deletable by owner or admin"
ON public.application_documents
FOR DELETE
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users read own docs, admins read all" ON storage.objects;
CREATE POLICY "Users read own docs, admins read all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Users write own docs, admins write all" ON storage.objects;
CREATE POLICY "Users write own docs, admins write all"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Admins update all docs" ON storage.objects;
CREATE POLICY "Admins update all docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users delete own docs, admins delete all" ON storage.objects;
CREATE POLICY "Users delete own docs, admins delete all"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'))
);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;