import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { emptyRegistration, loadRegistration, clearRegistration, REGISTRATION_FEE, CIPC_PAYFAST_URL, type RegistrationDraft } from "@/lib/registration-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getService } from "@/lib/services";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: (s: Record<string, unknown>) => ({
    serviceId: typeof s.serviceId === "string" ? s.serviceId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Vert Corp Group" },
      { name: "description", content: "Securely pay for your service with PayFast." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/checkout" });
  const { user } = useAuth();
  const [data, setData] = useState<RegistrationDraft>(emptyRegistration());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loaded = loadRegistration();
    setData({ ...loaded, serviceId: search.serviceId || loaded.serviceId || "cipc" });
  }, [search.serviceId]);

  const primary = data.directors[0];
  const primaryName = data.proposedNames[0] || "Your company";
  const service = getService(data.serviceId || search.serviceId || "cipc") || getService("cipc");
  const paymentUrl = service?.payfastUrl || CIPC_PAYFAST_URL;
  const amount = service?.price || REGISTRATION_FEE;

  const handlePay = async () => {
    if (!user) return;

    const serviceId = service?.id || data.serviceId || search.serviceId || "cipc";
    const isCipc = serviceId === "cipc";
    const filesOk = isCipc
      ? data.directorIdFiles.length > 0
      : data.idCopies.length > 0 && data.proofOfAddress.length > 0;
    if (!filesOk) {
      toast.error("All required documents must be uploaded.");
      navigate({ to: "/register" });
      return;
    }

    setSubmitting(true);
    try {
      const paymentRef = "VCG-" + Date.now().toString(36).toUpperCase();

      const { data: app, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          service_id: serviceId,
          primary_director_name: `${primary.fullNames} ${primary.surname}`.trim(),
          primary_director_email: primary.email,
          directors: data.directors as any,
          proposed_names: isCipc ? data.proposedNames.filter((n) => n.trim()) : [],
          terms_accepted: true,
          payment_ref: paymentRef,
          submitted_at: new Date().toISOString(),
          status: "under_review",
        })
        .select()
        .single();
      if (appErr) throw appErr;

      const uploads: { file: File; kind: "id_copy" | "proof_of_address" | "director_id" }[] = isCipc
        ? data.directorIdFiles.map((f) => ({ file: f, kind: "director_id" as const }))
        : [
            ...data.idCopies.map((f) => ({ file: f, kind: "id_copy" as const })),
            ...data.proofOfAddress.map((f) => ({ file: f, kind: "proof_of_address" as const })),
          ];

      for (const u of uploads) {
        const safeName = u.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${app.id}/${u.kind}/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, u.file, {
          contentType: u.file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { error: docErr } = await supabase.from("application_documents").insert({
          application_id: app.id,
          kind: u.kind,
          storage_path: path,
          file_name: u.file.name,
          size_bytes: u.file.size,
          mime_type: u.file.type,
          uploaded_by: user.id,
        });
        if (docErr) throw docErr;
      }

      clearRegistration();
      toast.success("Application saved — redirecting to PayFast…");
      if (typeof window !== "undefined") {
        window.location.href = paymentUrl;
      } else {
        navigate({ to: "/success", search: { id: app.id } });
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/summary" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to summary
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete your payment with PayFast to process your application.</p>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <div className="text-sm text-muted-foreground">
              {service ? service.name : "Company Registration"}
            </div>
            <div className="text-lg font-semibold text-foreground mt-0.5">{primaryName}</div>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{service ? service.name : "Registration"} Fee</span>
              <span className="text-foreground font-medium">R{amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Total due</span>
              <span className="text-2xl font-bold text-foreground">R{amount.toFixed(2)}</span>
            </div>
          </div>
          <div className="px-6 pb-6">
            <button type="button" onClick={handlePay} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
              <Lock className="h-4 w-4" />
              {submitting ? "Processing..." : `Pay ${service?.priceLabel || `R${amount.toFixed(2)}`} with PayFast`}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Payments securely handled by PayFast.
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
