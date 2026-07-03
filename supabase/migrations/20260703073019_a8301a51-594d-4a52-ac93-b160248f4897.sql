DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_grant_vertcorp_admin'
  ) THEN
    CREATE TRIGGER on_auth_user_grant_vertcorp_admin
    AFTER INSERT OR UPDATE OF email_confirmed_at, email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.grant_admin_for_vertcorp_domain();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users read own docs, admins read all'
  ) THEN
    CREATE POLICY "Users read own docs, admins read all"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'documents'
      AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users write own docs, admins write all'
  ) THEN
    CREATE POLICY "Users write own docs, admins write all"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'documents'
      AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins update all docs'
  ) THEN
    CREATE POLICY "Admins update all docs"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'))
    WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users delete own docs, admins delete all'
  ) THEN
    CREATE POLICY "Users delete own docs, admins delete all"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'documents'
      AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
    );
  END IF;
END $$;