-- Add service_id and delivery tracking to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS service_id text NOT NULL DEFAULT 'cipc',
  ADD COLUMN IF NOT EXISTS admin_delivered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Ensure kind check allows all document kinds we use
ALTER TABLE public.application_documents
  DROP CONSTRAINT IF EXISTS application_documents_kind_check;
ALTER TABLE public.application_documents
  ADD CONSTRAINT application_documents_kind_check
  CHECK (kind IN ('id_copy','proof_of_address','certificate','director_id','completed_document'));

-- Deliveries table for finalized admin uploads back to the user
CREATE TABLE IF NOT EXISTS public.application_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  delivered_by uuid NOT NULL REFERENCES auth.users(id),
  file_path text NOT NULL,
  file_name text NOT NULL,
  size_bytes integer,
  mime_type text,
  delivered_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_deliveries TO authenticated;
GRANT ALL ON public.application_deliveries TO service_role;
ALTER TABLE public.application_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own deliveries, admins see all" ON public.application_deliveries;
CREATE POLICY "Users see own deliveries, admins see all"
ON public.application_deliveries FOR SELECT TO authenticated USING (
  private.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can insert deliveries" ON public.application_deliveries;
CREATE POLICY "Admins can insert deliveries"
ON public.application_deliveries FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins can delete deliveries" ON public.application_deliveries;
CREATE POLICY "Admins can delete deliveries"
ON public.application_deliveries FOR DELETE TO authenticated
USING (private.has_role(auth.uid(),'admin'));