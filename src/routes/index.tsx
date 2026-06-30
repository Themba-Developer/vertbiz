import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Check, Clock, FileCheck, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RegistrCo — Register Your South African Company in Minutes" },
      { name: "description", content: "Fast, transparent CIPC company registration in South Africa. Name reservation and registration certificate included for R112.50." },
      { property: "og:title", content: "RegistrCo — CIPC Company Registration in South Africa" },
      { property: "og:description", content: "Register your Pty (Ltd) with CIPC in minutes. Flat fee of R112.50, fully online." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            CIPC-compliant • Trusted by South African founders
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto">
            Register your South African company in minutes.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple, all-inclusive CIPC company registration service. Submit your details and documents online — we handle the paperwork.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 text-base font-semibold hover:opacity-90 transition shadow-elegant"
            >
              Start Registration
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground px-6 py-3 text-base font-medium hover:bg-secondary transition"
            >
              See pricing
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            {[
              { icon: Clock, title: "2–3 business days", desc: "Standard CIPC turnaround" },
              { icon: FileCheck, title: "All documents included", desc: "Name reservation + COR14.3" },
              { icon: ShieldCheck, title: "Secure & compliant", desc: "Encrypted document handling" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-4">
                <f.icon className="h-5 w-5 text-accent" />
                <div className="mt-3 font-semibold text-foreground">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">
              One flat fee. No subscriptions, no surprises.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="bg-primary text-primary-foreground px-6 py-5">
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <Building2 className="h-4 w-4" />
                  Company Registration
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">R112.50</span>
                  <span className="text-sm opacity-80">once-off</span>
                </div>
                <div className="mt-1 text-xs opacity-80">All fees included — no extras</div>
              </div>
              <ul className="px-6 py-6 space-y-3">
                {[
                  "CIPC name reservation",
                  "Registration certificate (COR14.3)",
                  "MOI lodgement (COR15.1A)",
                  "Income tax registration with SARS",
                  "Digital delivery of all documents",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-success" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="px-6 pb-6">
                <Link
                  to="/register"
                  className="block text-center rounded-md bg-accent text-accent-foreground px-5 py-3 font-semibold hover:opacity-90 transition"
                >
                  Start Registration
                </Link>
                <p className="mt-3 text-[11px] text-muted-foreground text-center">
                  Final approval subject to CIPC name availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-foreground text-center">How it works</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: 1, t: "Enter director details", d: "Tell us who's behind the company." },
              { n: 2, t: "Choose 4 names", d: "We submit them to CIPC in order of preference." },
              { n: 3, t: "Upload documents", d: "Certified IDs and proof of address." },
              { n: 4, t: "Pay & relax", d: "We handle CIPC lodgement and updates." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-card p-5">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {s.n}
                </div>
                <div className="mt-3 font-semibold text-foreground">{s.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
