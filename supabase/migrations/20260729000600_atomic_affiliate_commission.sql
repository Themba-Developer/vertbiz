-- Atomically mark a verified PayFast payment complete and credit any approved
-- affiliate. Restrict execution to the service role used by the ITN function.
CREATE OR REPLACE FUNCTION public.confirm_payfast_payment(
  application_uuid uuid,
  payfast_id text,
  gross_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  paid_application public.applications;
BEGIN
  UPDATE public.applications
  SET
    status = 'under_review',
    payfast_payment_id = payfast_id,
    paid_at = now()
  WHERE id = application_uuid
    AND status = 'pending_payment'
    AND payment_amount = gross_amount
  RETURNING * INTO paid_application;

  IF paid_application IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id,
    application_id,
    payment_reference,
    gross_amount,
    commission_rate,
    commission_amount
  )
  SELECT
    affiliate.user_id,
    paid_application.id,
    paid_application.payment_ref,
    gross_amount,
    0.25,
    round(gross_amount * 0.25, 2)
  FROM public.affiliate_profiles affiliate
  WHERE affiliate.user_id = paid_application.user_id
    AND affiliate.status = 'approved'
  ON CONFLICT (application_id) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_payfast_payment(uuid, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_payfast_payment(uuid, text, numeric) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_payfast_payment(uuid, text, numeric) TO service_role;
