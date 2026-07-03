import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { emptyRegistration, loadRegistration, saveRegistration, REGISTRATION_FEE, type RegistrationDraft } from "@/lib/registration-store";

export const Route = createFileRoute("/_authenticated/summary")({
  head: () => ({
    meta: [
      { title: "Review Your Application — Vert Corp Group" },
      { name: "description", content: "Review your CIPC company registration details before payment." },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RegistrationDraft>(emptyRegistration());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setData(loadRegistration()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) saveRegistration(data); }, [data, hydrated]);

  const toggleTerms = () => setData((d) => ({ ...d, termsAccepted: !d.termsAccepted }));

  const hasFiles = data.idCopies.length > 0 && data.proofOfAddress.length > 0;

  return (
    <SiteShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Review your application</h1>
            <p className="text-muted-foreground text-sm mt-1">Check everything carefully — these details will be submitted to CIPC.</p>
          </div>
          <Link to="/register" className="hidden sm:inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary transition">
            <ArrowLeft className="h-4 w-4" /> Edit
          </Link>
        </div>

        {!hasFiles && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm">
            Your uploaded files are not available in this browser session. Please <Link to="/register" className="underline font-semibold">go back and re-upload</Link> your documents before continuing to payment.
          </div>
        )}

        <div className="grid gap-6">
          <Section title="Directors">
            <div className="grid gap-4">
              {data.directors.map((d, i) => (
                <div key={d.id} className="rounded-lg border border-border p-4">
                  <div className="font-semibold text-foreground mb-2">Director {i + 1}: {d.fullNames} {d.surname}</div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <Row k="ID Number" v={d.idNumber} />
                    <Row k="Email" v={d.email} />
                    <Row k="Phone" v={d.phone} />
                    <Row k="Address" v={d.address} />
                  </dl>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Proposed company names">
            <ol className="space-y-2 text-sm">
              {data.proposedNames.map((n, i) => (
                <li key={i} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground w-6">#{i + 1}</span>
                  <span className="text-foreground">{n || <span className="text-muted-foreground italic">Not provided</span>}</span>
                  {i === 0 && <span className="ml-auto text-[10px] uppercase tracking-wide bg-accent/15 text-accent-foreground px-2 py-0.5 rounded">Preferred</span>}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Uploaded documents">
            <div className="grid gap-4 sm:grid-cols-2">
              <DocList title="Certified ID copies" files={data.idCopies} />
              <DocList title="Proof of address" files={data.proofOfAddress} />
            </div>
          </Section>

          <Section title="Fee summary">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">CIPC Registration Fee & Service Fee</span>
              <span className="font-semibold text-foreground">R{REGISTRATION_FEE.toFixed(2)}</span>
            </div>
          </Section>

          <div className="rounded-xl border border-border bg-card p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={data.termsAccepted} onChange={toggleTerms} className="mt-1 h-4 w-4 rounded border-input accent-[var(--color-accent)]" />
              <span className="text-sm text-foreground">
                I understand that proposed company names are subject to CIPC availability and approval, and that processing typically takes <strong>2–3 business days</strong>. I accept the terms and conditions of this service.
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition">
              <ArrowLeft className="h-4 w-4" /> Back to edit
            </Link>
            <button type="button" disabled={!data.termsAccepted || !hasFiles} onClick={() => navigate({ to: "/checkout" })} className="inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <CheckCircle2 className="h-4 w-4" /> Confirm & Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (<div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0">{k}</dt><dd className="text-foreground break-words">{v || "—"}</dd></div>);
}
function DocList({ title, files }: { title: string; files: File[] }) {
  return (
    <div>
      <div className="text-sm font-medium text-foreground mb-2">{title}</div>
      {files.length === 0 ? (<div className="text-sm text-muted-foreground">No files uploaded.</div>) : (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm rounded-md border border-border px-3 py-2">
              <FileText className="h-4 w-4 text-accent shrink-0" />
              <span className="truncate text-foreground">{f.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
