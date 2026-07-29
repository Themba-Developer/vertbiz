-- Customer profiles, affiliate approval, commissions and withdrawal workflow.

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text NOT NULL DEFAULT '',
  physical_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Users read own profile, admins read all"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_registration_number text NOT NULL,
  bank_name text NOT NULL,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  branch_code text NOT NULL,
  account_type text NOT NULL,
  cipc_document_path text NOT NULL,
  bank_proof_path text NOT NULL,
  id_document_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.affiliate_profiles TO authenticated;
GRANT ALL ON public.affiliate_profiles TO service_role;

CREATE POLICY "Affiliates read own profile, admins read all"
ON public.affiliate_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users submit own affiliate application"
ON public.affiliate_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users update pending affiliate application"
ON public.affiliate_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins manage affiliate applications"
ON public.affiliate_profiles FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(user_id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  payment_reference text NOT NULL,
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 0),
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.25 CHECK (commission_rate = 0.25),
  commission_amount numeric(12,2) NOT NULL CHECK (commission_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id)
);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;

CREATE POLICY "Affiliates read own commissions, admins read all"
ON public.affiliate_commissions FOR SELECT TO authenticated
USING (auth.uid() = affiliate_id OR private.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(user_id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'rejected')),
  company_name text NOT NULL,
  company_registration_number text NOT NULL,
  bank_name text NOT NULL,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  branch_code text NOT NULL,
  account_type text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  admin_notes text
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;

CREATE POLICY "Affiliates read own withdrawals, admins read all"
ON public.withdrawal_requests FOR SELECT TO authenticated
USING (auth.uid() = affiliate_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update withdrawals"
ON public.withdrawal_requests FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

CREATE POLICY "Admins read notifications"
ON public.admin_notifications FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update notifications"
ON public.admin_notifications FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.request_affiliate_withdrawal()
RETURNS public.withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  affiliate public.affiliate_profiles;
  available numeric(12,2);
  withdrawal public.withdrawal_requests;
BEGIN
  SELECT * INTO affiliate
  FROM public.affiliate_profiles
  WHERE user_id = auth.uid() AND status = 'approved'
  FOR UPDATE;

  IF affiliate IS NULL THEN
    RAISE EXCEPTION 'An approved affiliate account is required.';
  END IF;

  SELECT
    COALESCE((SELECT SUM(commission_amount) FROM public.affiliate_commissions WHERE affiliate_id = auth.uid()), 0)
    - COALESCE((SELECT SUM(amount) FROM public.withdrawal_requests WHERE affiliate_id = auth.uid() AND status IN ('requested', 'processing', 'paid')), 0)
  INTO available;

  IF available <= 0 THEN
    RAISE EXCEPTION 'No available balance to withdraw.';
  END IF;

  INSERT INTO public.withdrawal_requests (
    affiliate_id, amount, company_name, company_registration_number,
    bank_name, account_holder, account_number, branch_code, account_type
  ) VALUES (
    auth.uid(), available, affiliate.company_name, affiliate.company_registration_number,
    affiliate.bank_name, affiliate.account_holder, affiliate.account_number,
    affiliate.branch_code, affiliate.account_type
  )
  RETURNING * INTO withdrawal;

  INSERT INTO public.admin_notifications (type, title, message, data)
  VALUES (
    'affiliate_withdrawal',
    'Affiliate withdrawal requested',
    affiliate.company_name || ' requested a withdrawal of R' || to_char(available, 'FM999999990.00'),
    jsonb_build_object(
      'withdrawal_id', withdrawal.id,
      'affiliate_id', affiliate.user_id,
      'company_name', affiliate.company_name,
      'company_registration_number', affiliate.company_registration_number,
      'bank_name', affiliate.bank_name,
      'account_holder', affiliate.account_holder,
      'account_number', affiliate.account_number,
      'branch_code', affiliate.branch_code,
      'account_type', affiliate.account_type,
      'amount', available
    )
  );

  RETURN withdrawal;
END;
$$;

REVOKE ALL ON FUNCTION public.request_affiliate_withdrawal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_affiliate_withdrawal() TO authenticated;

CREATE OR REPLACE VIEW public.affiliate_balances
WITH (security_invoker = true)
AS
SELECT
  affiliate.user_id,
  COALESCE(commissions.total, 0)::numeric(12,2) AS total_earned,
  COALESCE(withdrawals.total, 0)::numeric(12,2) AS total_withdrawn,
  (COALESCE(commissions.total, 0) - COALESCE(withdrawals.total, 0))::numeric(12,2) AS available_balance
FROM public.affiliate_profiles affiliate
LEFT JOIN (
  SELECT affiliate_id, SUM(commission_amount) AS total
  FROM public.affiliate_commissions GROUP BY affiliate_id
) commissions ON commissions.affiliate_id = affiliate.user_id
LEFT JOIN (
  SELECT affiliate_id, SUM(amount) AS total
  FROM public.withdrawal_requests
  WHERE status IN ('requested', 'processing', 'paid')
  GROUP BY affiliate_id
) withdrawals ON withdrawals.affiliate_id = affiliate.user_id;

GRANT SELECT ON public.affiliate_balances TO authenticated;

CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_idx
ON public.affiliate_commissions(affiliate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS withdrawal_requests_affiliate_idx
ON public.withdrawal_requests(affiliate_id, requested_at DESC);
