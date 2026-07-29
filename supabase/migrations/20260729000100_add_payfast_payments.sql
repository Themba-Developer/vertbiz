ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS payment_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS payfast_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS applications_payment_ref_unique_idx
  ON public.applications(payment_ref)
  WHERE payment_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS applications_payfast_payment_id_unique_idx
  ON public.applications(payfast_payment_id)
  WHERE payfast_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_application_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.payment_amount := NULL;
      NEW.payfast_payment_id := NULL;
      NEW.paid_at := NULL;
      NEW.status := 'pending_payment';
    ELSE
      NEW.payment_amount := OLD.payment_amount;
      NEW.payfast_payment_id := OLD.payfast_payment_id;
      NEW.paid_at := OLD.paid_at;
      IF OLD.status = 'pending_payment' AND NEW.status <> 'pending_payment' THEN
        NEW.status := OLD.status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_application_payment_fields ON public.applications;
CREATE TRIGGER protect_application_payment_fields
BEFORE INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.protect_application_payment_fields();
