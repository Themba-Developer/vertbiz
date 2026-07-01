import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { emptyRegistration, loadRegistration, clearRegistration, REGISTRATION_FEE, type RegistrationDraft } from "@/lib/registration-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Vert Corp Group" },
      { name: "description", content: "Securely pay for your CIPC company registration." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<RegistrationDraft>(emptyRegistration());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setData(loadRegistration()); }, []);

  const primary = data.directors[0];
  const primaryName = data.proposedNames[0] || "Your company";

  const handlePay = async () => {
    if (!user) return;
    if (data.idCopies.length === 0 || data.proofOfAddress.length === 0) {
      toast.error("Please re-upload your documents on the registration page.");
      navigate({ to: "/register" });
      return;
    }
    setSubmitting(true);
    try {
      const paymentRef = "VCG-" + Date.now().toString(36).toUpperCase();

      // 1. Insert application
      const { data: app, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          primary_director_name: `${primary.fullNames} ${primary.surname}`.trim(),
          primary_director_email: primary.email,
          directors: data.directors as any,
          proposed_names: data.proposedNames.filter((n) => n.trim()),
          terms_accepted: true,
          payment_ref: paymentRef,
          submitted_at: new Date().toISOString(),
          status: "under_review",
        })
        .select()
        .single();
      if (appErr) throw appErr;

      // 2. Upload files and create document rows
      const uploads: { file: File; kind: "id_copy" | "proof_of_address" }[] = [
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
      toast.success("Application submitted successfully");
      navigate({ to: "/success", search: { id: app.id } });
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
        <p className="text-muted-foreground text-sm mt-1">Complete your payment to lodge your application with CIPC.</p>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <div className="text-sm text-muted-foreground">Registering</div>
            <div className="text-lg font-semibold text-foreground mt-0.5">{primaryName}</div>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">CIPC Registration Fee & Service Fee</span>
              <span className="text-foreground font-medium">R{REGISTRATION_FEE.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Total due</span>
              <span className="text-2xl font-bold text-foreground">R{REGISTRATION_FEE.toFixed(2)}</span>
            </div>
          </div>
          <div className="px-6 pb-6">
            <button type="button" onClick={handlePay} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-6 py-3.5 text-base font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed">
              <Lock className="h-4 w-4" />
              {submitting ? "Processing..." : "Proceed to Secure Payment"}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Payments handled by PayFast (integration pending) — simulated for MVP.
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
