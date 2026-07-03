-- Add delivery columns to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS admin_delivered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS delivery_documents text[];

-- Create deliveries table
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

CREATE POLICY IF NOT EXISTS "Users see own deliveries, admins see all"
ON public.application_deliveries FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);

CREATE POLICY IF NOT EXISTS "Admins can insert deliveries"
ON public.application_deliveries FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
