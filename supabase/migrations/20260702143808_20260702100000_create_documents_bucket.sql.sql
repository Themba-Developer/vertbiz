-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  gen_random_uuid(),
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
) ON CONFLICT (name) DO NOTHING;

-- Grant permissions to authenticated users for the bucket
-- Policies follow the pattern in the original migration:
-- Path convention: <user_id>/<application_id>/<kind>/<filename>

-- Drop old policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users read own docs, admins read all" ON storage.objects;
DROP POLICY IF EXISTS "Users write own docs, admins write all" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own docs, admins delete all" ON storage.objects;
DROP POLICY IF EXISTS "Admins update all docs" ON storage.objects;

-- Create the storage policies
CREATE POLICY "Users read own docs, admins read all"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin')
  )
);

CREATE POLICY "Users write own docs, admins write all"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin')
  )
);

CREATE POLICY "Users delete own docs, admins delete all"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin')
  )
);

CREATE POLICY "Admins update all docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(),'admin'));