import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Check, Clock, FileCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { SERVICES } from "@/lib/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vert Corp Group — CIPC Registration & Business Compliance in SA" },
      { name: "description", content: "Register your South African company, get CSD, SARS PIN, B-BBEE, business plans and more. Trusted compliance services from Vert Corp Group." },
      { property: "og:title", content: "Vert Corp Group — CIPC Registration & Business Compliance" },
      { property: "og:description", content: "CIPC registration from R749.99. CSD, SARS Tax PIN, B-BBEE, business plans and more — all in one place." },
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
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 70%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            CIPC-compliant • Trusted by South African founders
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto">
            Register, comply, and grow — all in one place.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            From CIPC company registration to CSD, SARS Tax PINs, B-BBEE, business plans and feasibility studies — Vert Corp Group handles it end-to-end.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 text-base font-semibold hover:opacity-90 transition shadow-elegant"
            >
              Register a Company — R749.99
            </Link>
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground px-6 py-3 text-base font-medium hover:bg-secondary transition"
            >
              See all services
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            {[
              { icon: Clock, title: "Fast turnaround", desc: "Most services in 2–5 business days" },
              { icon: FileCheck, title: "Government-compliant", desc: "CIPC, SARS, NT-CSD & BEE ready" },
              { icon: ShieldCheck, title: "Secure & confidential", desc: "Encrypted document handling" },
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

      {/* Services */}
      <section id="services" className="py-20 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Our services</h2>
            <p className="mt-3 text-muted-foreground">
              Transparent flat fees. Secure PayFast checkout. No hidden extras.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className={`relative rounded-2xl border bg-card shadow-card overflow-hidden flex flex-col ${
                  s.primary ? "border-accent ring-1 ring-accent/40" : "border-border"
                }`}
              >
                {s.primary && (
                  <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wide bg-accent text-accent-foreground px-2 py-1 rounded-full font-semibold">
                    Most popular
                  </div>
                )}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Vert Corp Service
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground leading-snug">{s.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-foreground">{s.priceLabel}</span>
                    <span className="text-xs text-muted-foreground">once-off</span>
                  </div>
                </div>
                <ul className="px-5 py-3 space-y-2 flex-1">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-0.5 h-4 w-4 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="px-5 pb-5 pt-2">
                  {s.hasIntakeForm ? (
                    <Link
                      to="/register"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
                    >
                      Start Registration <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <a
                      href={s.payfastUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
                    >
                      Buy Now <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Payments are processed securely by PayFast. Final approvals subject to the relevant authority (CIPC, SARS, NT-CSD).
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-foreground text-center">How it works</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: 1, t: "Pick a service", d: "Choose the compliance product you need." },
              { n: 2, t: "Submit your details", d: "Complete the short online intake." },
              { n: 3, t: "Pay securely", d: "Instant PayFast checkout in ZAR." },
              { n: 4, t: "We handle the rest", d: "Documents delivered digitally to you." },
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
