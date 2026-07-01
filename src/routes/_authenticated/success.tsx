import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Download, FileText, Mail } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";

type App = {
  id: string;
  primary_director_email: string;
  proposed_names: string[];
  payment_ref: string | null;
  submitted_at: string | null;
  status: "pending_payment" | "under_review" | "completed";
  certificate_path: string | null;
};

export const Route = createFileRoute("/_authenticated/success")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => ({
    meta: [
      { title: "Application Received — Vert Corp Group" },
      { name: "description", content: "Your CIPC company registration application has been received." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = useSearch({ from: "/_authenticated/success" });
  const { user } = useAuth();
  const [app, setApp] = useState<App | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    supabase.from("applications").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setApp(data as any);
      if (data?.certificate_path) {
        supabase.storage.from("documents").createSignedUrl(data.certificate_path, 3600).then(({ data: s }) => {
          if (s) setCertUrl(s.signedUrl);
        });
      }
    });
  }, [id, user]);

  const primaryName = app?.proposed_names?.[0] || "Your company";
  const submitted = app?.submitted_at ? new Date(app.submitted_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-bold text-foreground">Payment received — application submitted</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Thank you. We've received your registration for <strong className="text-foreground">{primaryName}</strong> and lodged it for review.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Reference</div>
              <div className="font-mono text-sm text-foreground">{app?.payment_ref ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Submitted</div>
              <div className="text-sm text-foreground">{submitted}</div>
            </div>
            {app && <StatusBadge status={app.status} />}
          </div>

          <div className="px-6 py-6">
            <div className="text-sm text-muted-foreground mb-2">Application status</div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {app?.status === "completed" ? "Registration complete" : "Documents received & under review"}
                </div>
                <div className="text-xs text-muted-foreground">Estimated turnaround: 2–3 business days</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Your CIPC certificate</div>
              <div className="text-sm text-muted-foreground">
                {certUrl ? "Your official CIPC certificate is ready." : "Once processed, your registration certificate will be available here for download."}
              </div>
            </div>
            {certUrl ? (
              <a href={certUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition">
                <Download className="h-4 w-4" /> Download
              </a>
            ) : (
              <button disabled className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground cursor-not-allowed">
                <Download className="h-4 w-4" /> Not yet available
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface/60 p-5 flex items-start gap-3">
          <Mail className="h-5 w-5 text-accent mt-0.5" />
          <div className="text-sm text-foreground">
            We'll send status updates to <strong>{app?.primary_director_email || "your email"}</strong>.
          </div>
        </div>

        <div className="mt-8 text-center flex justify-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition">
            Go to Dashboard
          </Link>
          <Link to="/" className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition">
            Back to home
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
