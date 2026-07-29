-- Explicit admin-only APIs avoid silently treating an RLS/configuration error
-- as an empty affiliate list in the dashboard.
CREATE OR REPLACE FUNCTION public.get_admin_affiliates()
RETURNS SETOF public.affiliate_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN QUERY
  SELECT affiliate.*
  FROM public.affiliate_profiles affiliate
  ORDER BY affiliate.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_affiliates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_affiliates() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_affiliate(
  affiliate_user_id uuid,
  review_status text,
  review_reason text DEFAULT NULL
)
RETURNS public.affiliate_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  reviewed public.affiliate_profiles;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;
  IF review_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid affiliate review status.';
  END IF;

  UPDATE public.affiliate_profiles
  SET
    status = review_status,
    rejection_reason = CASE WHEN review_status = 'rejected' THEN review_reason ELSE NULL END,
    approved_at = CASE WHEN review_status = 'approved' THEN now() ELSE NULL END,
    approved_by = CASE WHEN review_status = 'approved' THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE user_id = affiliate_user_id
  RETURNING * INTO reviewed;

  IF reviewed IS NULL THEN
    RAISE EXCEPTION 'Affiliate application not found.';
  END IF;
  RETURN reviewed;
END;
$$;

REVOKE ALL ON FUNCTION public.review_affiliate(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_affiliate(uuid, text, text) TO authenticated;
