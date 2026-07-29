-- Storage API clients address buckets by storage.buckets.id, not by name.
-- The original migration used a random UUID for id, so .from('documents')
-- could not resolve the otherwise correctly named bucket.
UPDATE storage.buckets
SET id = 'documents'
WHERE name = 'documents'
  AND id <> 'documents';

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
