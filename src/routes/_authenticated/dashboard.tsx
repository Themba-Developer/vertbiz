import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge, type AppStatus } from "@/components/StatusBadge";
import { Download, FileText, PlusCircle } from "lucide-react";

type Row = {
  id: string;
  primary_director_name: string;
  proposed_names: string[];
  submitted_at: string | null;
  status: AppStatus;
  certificate_path: string | null;
  payment_ref: string | null;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Applications — Vert Corp Group" },
      { name: "description", content: "View the status of your CIPC company registration applications." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("id,primary_director_name,proposed_names,submitted_at,status,certificate_path,payment_ref")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as any) ?? []);
        setLoading(false);
        (data ?? []).forEach((r: any) => {
          if (r.certificate_path) {
            supabase.storage.from("documents").createSignedUrl(r.certificate_path, 3600).then(({ data: s }) => {
              if (s) setSignedUrls((u) => ({ ...u, [r.id]: s.signedUrl }));
            });
          }
        });
      });
  }, [user]);

  return (
    <SiteShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage your CIPC company registrations.</p>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition">
            <PlusCircle className="h-4 w-4" /> New Registration
          </Link>
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
            <h2 className="mt-4 font-semibold text-foreground">No applications yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Start your first company registration in just a few minutes.</p>
            <Link to="/register" className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition">
              Start Registration
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-foreground truncate">{r.proposed_names[0] || "(no name)"}</div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ref {r.payment_ref ?? "—"} · Submitted{" "}
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-ZA") : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {signedUrls[r.id] ? (
                    <a href={signedUrls[r.id]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-accent text-accent-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition">
                      <Download className="h-3.5 w-3.5" /> Certificate
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Certificate pending</span>
                  )}
                  <Link to="/success" search={{ id: r.id }} className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary transition">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
