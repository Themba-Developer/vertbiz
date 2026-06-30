import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import {
  emptyRegistration,
  loadRegistration,
  saveRegistration,
  REGISTRATION_FEE,
  type RegistrationData,
} from "@/lib/registration-store";

// Placeholder PayFast URL for the MVP
const PAYFAST_URL = "https://payfast.co.za/eng/process?merchant_id=placeholder&amount=112.50&item_name=CIPC+Registration";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — RegistrCo" },
      { name: "description", content: "Securely pay for your CIPC company registration." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RegistrationData>(emptyRegistration());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setData(loadRegistration());
  }, []);

  const handlePay = () => {
    setSubmitting(true);
    // Simulated PayFast handoff: in production, redirect to PAYFAST_URL.
    const updated: RegistrationData = {
      ...data,
      paymentRef: "RC-" + Date.now().toString(36).toUpperCase(),
      submittedAt: new Date().toISOString(),
    };
    saveRegistration(updated);
    // For MVP, simulate a short redirect delay then go to success.
    // (In real integration: window.location.href = PAYFAST_URL;)
    setTimeout(() => {
      navigate({ to: "/success" });
    }, 900);
  };

  const primaryName = data.proposedNames[0] || "Your company";

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          to="/summary"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to summary
        </Link>

        <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete your payment to lodge your application with CIPC.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <div className="text-sm text-muted-foreground">Registering</div>
            <div className="text-lg font-semibold text-foreground mt-0.5">
              {primaryName}
            </div>
          </div>

          <div className="px-6 py-5 space-y-3">
            <Line label="CIPC Registration Fee & Service Fee" value={`R${REGISTRATION_FEE.toFixed(2)}`} />
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Total due</span>
              <span className="text-2xl font-bold text-foreground">
                R{REGISTRATION_FEE.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={handlePay}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-6 py-3.5 text-base font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {submitting ? "Redirecting to PayFast..." : "Proceed to Secure Payment"}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Payments handled by PayFast — your card details never touch our servers.
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground text-center break-all">
              Redirects to: <span className="opacity-70">{PAYFAST_URL}</span>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
