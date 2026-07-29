import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Banknote, Building2, Clock3, Loader2, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { documentContentType, isSupportedDocument } from "@/lib/document-files";

type Affiliate = {
  user_id: string;
  company_name: string;
  company_registration_number: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code: string;
  account_type: string;
  cipc_document_path: string;
  bank_proof_path: string;
  id_document_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
};

type AffiliateForm = Omit<Affiliate, "user_id" | "status" | "rejection_reason" | "cipc_document_path" | "bank_proof_path" | "id_document_path">;

const EMPTY_FORM: AffiliateForm = {
  company_name: "",
  company_registration_number: "",
  bank_name: "",
  account_holder: "",
  account_number: "",
  branch_code: "",
  account_type: "Business cheque/current",
};

const DOCUMENTS = [
  { id: "cipc", label: "CIPC COR14.3 registration certificate" },
  { id: "bank", label: "Proof of banking details" },
  { id: "identity", label: "ID copy of the authorised user" },
] as const;

export const Route = createFileRoute("/_authenticated/affiliate")({
  head: () => ({ meta: [{ title: "Affiliate Business Account — Vert Corp Group" }] }),
  component: AffiliatePage,
});

function AffiliatePage() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [form, setForm] = useState<AffiliateForm>(EMPTY_FORM);
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [balance, setBalance] = useState({ available_balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadAffiliate = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
    const record = data as Affiliate | null;
    setAffiliate(record);
    if (record) {
      setForm({
        company_name: record.company_name,
        company_registration_number: record.company_registration_number,
        bank_name: record.bank_name,
        account_holder: record.account_holder,
        account_number: record.account_number,
        branch_code: record.branch_code,
        account_type: record.account_type,
      });
    }
    if (record?.status === "approved") {
      const [{ data: balanceData }, { data: commissionData }, { data: withdrawalData }] = await Promise.all([
        (supabase as any).from("affiliate_balances").select("*").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("affiliate_commissions").select("*").eq("affiliate_id", user.id).order("created_at", { ascending: false }),
        (supabase as any).from("withdrawal_requests").select("*").eq("affiliate_id", user.id).order("requested_at", { ascending: false }),
      ]);
      if (balanceData) {
        setBalance({
          available_balance: Number(balanceData.available_balance),
          total_earned: Number(balanceData.total_earned),
          total_withdrawn: Number(balanceData.total_withdrawn),
        });
      }
      setCommissions(commissionData || []);
      setWithdrawals(withdrawalData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAffiliate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const uploadDocument = async (kind: string, file: File) => {
    if (!user) throw new Error("You must be signed in.");
    if (!isSupportedDocument(file)) {
      throw new Error("Documents must be PDF, PNG or JPG.");
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("Each document must be under 5MB.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/affiliate/${kind}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, {
      contentType: documentContentType(file),
      upsert: false,
    });
    if (error) throw error;
    return path;
  };

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!affiliate && DOCUMENTS.some((document) => !files[document.id])) {
      toast.error("Upload all three required documents.");
      return;
    }
    setBusy(true);
    try {
      const paths = {
        cipc_document_path: affiliate?.cipc_document_path || "",
        bank_proof_path: affiliate?.bank_proof_path || "",
        id_document_path: affiliate?.id_document_path || "",
      };
      if (files.cipc) paths.cipc_document_path = await uploadDocument("cipc", files.cipc);
      if (files.bank) paths.bank_proof_path = await uploadDocument("bank", files.bank);
      if (files.identity) paths.id_document_path = await uploadDocument("identity", files.identity);

      const { error } = await (supabase as any).from("affiliate_profiles").upsert({
        user_id: user.id,
        ...form,
        ...paths,
        status: "pending",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Affiliate application submitted for admin approval.");
      setFiles({});
      await loadAffiliate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Affiliate application could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  const requestWithdrawal = async () => {
    if (balance.available_balance <= 0) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc("request_affiliate_withdrawal");
      if (error) throw error;
      toast.success("Withdrawal requested. Your funds will be paid within 24 hours.");
      await loadAffiliate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal could not be requested.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <SiteShell><div className="py-24"><Loader2 className="h-7 w-7 animate-spin mx-auto" /></div></SiteShell>;
  }

  if (affiliate?.status === "approved") {
    return (
      <SiteShell>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-7 w-7 text-green-600" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-green-700">Approved business affiliate</div>
              <h1 className="text-3xl font-bold">{affiliate.company_name}</h1>
              <p className="text-sm text-muted-foreground">{affiliate.company_registration_number}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <BalanceCard label="Available balance" value={balance.available_balance} icon={Wallet} primary />
            <BalanceCard label="Total earned" value={balance.total_earned} icon={Banknote} />
            <BalanceCard label="Withdrawals" value={balance.total_withdrawn} icon={Clock3} />
          </div>
          <button type="button" onClick={requestWithdrawal} disabled={busy || balance.available_balance <= 0}
            className="w-full sm:w-auto rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground disabled:opacity-50">
            {busy ? "Submitting…" : "Withdraw available balance"}
          </button>
          <p className="text-xs text-muted-foreground">Approved withdrawals are paid to your registered bank account within 24 hours.</p>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg">Commission history</h2>
            <p className="text-sm text-muted-foreground">You earn 25% of each successfully paid service from this business account.</p>
            <div className="mt-4 divide-y divide-border">
              {commissions.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No paid commissions yet.</p> :
                commissions.map((commission) => (
                  <div key={commission.id} className="py-3 flex justify-between gap-4 text-sm">
                    <div><div className="font-medium">{commission.payment_reference}</div><div className="text-muted-foreground">{new Date(commission.created_at).toLocaleDateString("en-ZA")}</div></div>
                    <div className="font-semibold text-green-700">+R{Number(commission.commission_amount).toFixed(2)}</div>
                  </div>
                ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg">Withdrawal history</h2>
            <div className="mt-3 divide-y divide-border">
              {withdrawals.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No withdrawals yet.</p> :
                withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="py-3 flex justify-between gap-4 text-sm">
                    <div><div className="capitalize font-medium">{withdrawal.status}</div><div className="text-muted-foreground">{new Date(withdrawal.requested_at).toLocaleDateString("en-ZA")}</div></div>
                    <div className="font-semibold">R{Number(withdrawal.amount).toFixed(2)}</div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Affiliate application</h1>
            <p className="text-sm text-muted-foreground">Apply for a Vert Corp Group business affiliate account.</p>
          </div>
        </div>

        {affiliate?.status === "pending" && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <div className="font-semibold">Awaiting admin approval</div>
            <p className="text-sm mt-1">Your application is being reviewed. Affiliate earnings activate only after approval.</p>
          </div>
        )}
        {affiliate?.status === "rejected" && (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
            <div className="font-semibold">Changes required</div>
            <p className="text-sm mt-1">{affiliate.rejection_reason || "Please review your information and submit again."}</p>
          </div>
        )}

        {(!affiliate || affiliate.status === "rejected") && (
          <form onSubmit={submitApplication} className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
            <Field label="Company name" value={form.company_name} onChange={(value) => setForm({ ...form, company_name: value })} />
            <Field label="Company registration number" value={form.company_registration_number} onChange={(value) => setForm({ ...form, company_registration_number: value })} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Bank name" value={form.bank_name} onChange={(value) => setForm({ ...form, bank_name: value })} />
              <Field label="Account holder" value={form.account_holder} onChange={(value) => setForm({ ...form, account_holder: value })} />
              <Field label="Account number" value={form.account_number} onChange={(value) => setForm({ ...form, account_number: value })} />
              <Field label="Branch code" value={form.branch_code} onChange={(value) => setForm({ ...form, branch_code: value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Account type</label>
              <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
                <option>Business cheque/current</option><option>Business savings</option>
              </select>
            </div>
            <div className="space-y-3 pt-2">
              <h2 className="font-semibold">Required verification documents</h2>
              {DOCUMENTS.map((document) => (
                <label key={document.id} className="block rounded-xl border border-border p-4">
                  <span className="flex items-center gap-2 text-sm font-medium"><Upload className="h-4 w-4" /> {document.label}</span>
                  <input type="file" required={!affiliate} accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) => setFiles({ ...files, [document.id]: event.target.files?.[0] })}
                    className="mt-3 block w-full text-sm text-muted-foreground" />
                  {affiliate && <span className="mt-2 block text-xs text-muted-foreground">Leave empty to keep the document already submitted.</span>}
                </label>
              ))}
            </div>
            <button disabled={busy} className="w-full rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground disabled:opacity-60">
              {busy ? "Submitting…" : "Submit for approval"}
            </button>
          </form>
        )}
      </div>
    </SiteShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="text-sm font-medium">{label}</label><input required value={value} onChange={(e) => onChange(e.target.value)}
    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>;
}

function BalanceCard({ label, value, icon: Icon, primary = false }: { label: string; value: number; icon: typeof Wallet; primary?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${primary ? "border-green-300 bg-green-50" : "border-border bg-card"}`}>
    <Icon className={`h-5 w-5 ${primary ? "text-green-700" : "text-accent"}`} />
    <div className="mt-3 text-sm text-muted-foreground">{label}</div>
    <div className="text-2xl font-bold">R{value.toFixed(2)}</div>
  </div>;
}
