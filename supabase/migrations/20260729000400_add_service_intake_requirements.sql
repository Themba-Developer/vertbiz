ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS intake_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.application_documents
  DROP CONSTRAINT IF EXISTS application_documents_kind_check;

ALTER TABLE public.application_documents
  ADD CONSTRAINT application_documents_kind_check
  CHECK (kind ~ '^[a-z0-9_]{2,64}$');
