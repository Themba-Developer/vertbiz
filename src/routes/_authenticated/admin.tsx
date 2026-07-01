import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge, type AppStatus } from "@/components/StatusBadge";
import { toast } from "sonner";
import { X, FileText, Upload, Download, Shield, Search, Loader2 } from "lucide-react";

type AdminApp = {
  id: string;
  user_id: string;
  primary_director_name: string;
  primary_director_email: string;
  directors: Array<{ id: string; fullNames: string; surname: string; idNumber: string; email: string; phone: string; address: string }>;
  proposed_names: string[];
  submitted_at: string | null;
  status: AppStatus;
  certificate_path: string | null;
  payment_ref: string | null;
  admin_notes: string | null;
};

type Doc = {
  id: string;
  kind: "id_copy" | "proof_of_address" | "certificate";
  storage_path: string;
  file_name: string;
  size_bytes: number;
  mime_type: string;
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Vert Corp Group" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminApp | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/" });
    }
  }, [isAdmin, authLoading, navigate]);

  const load = () => {
    setLoading(true);
    supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setApps((data as any) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading || !isAdmin) {
    return (
      <SiteShell>
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      </SiteShell>
    );
  }

  const filtered = apps.filter(
    (a) =>
      !query ||
      a.primary_director_name.toLowerCase().includes(query.toLowerCase()) ||
      a.primary_director_email.toLowerCase().includes(query.toLowerCase()) ||
      a.proposed_names.some((n) => n.toLowerCase().includes(query.toLowerCase())) ||
      (a.payment_ref ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SiteShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage all customer applications. Signed in as {user?.email}</p>
          </div>
          <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground">Refresh</button>
        </div>

        <div className="mb-4 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, company name, or reference..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Primary Director</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Email</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Proposed Names</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No applications yet.</td></tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} onClick={() => setSelected(a)} className="border-t border-border hover:bg-secondary/40 cursor-pointer transition">
                      <td className="px-4 py-3 font-medium text-foreground">{a.primary_director_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.primary_director_email}</td>
                      <td className="px-4 py-3 text-foreground">
                        <div className="max-w-xs truncate">{a.proposed_names.join(", ")}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-ZA") : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <DetailDrawer app={selected} onClose={() => setSelected(null)} onSaved={() => { load(); setSelected(null); }} />
      )}
    </SiteShell>
  );
}

function DetailDrawer({ app, onClose, onSaved }: { app: AdminApp; onClose: () => void; onSaved: () => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<AppStatus>(app.status);
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    supabase.from("application_documents").select("*").eq("application_id", app.id).then(({ data }) => {
      const list = (data as any as Doc[]) ?? [];
      setDocs(list);
      list.forEach((d) => {
        supabase.storage.from("documents").createSignedUrl(d.storage_path, 3600).then(({ data: s }) => {
          if (s) setSignedUrls((u) => ({ ...u, [d.id]: s.signedUrl }));
        });
      });
    });
  }, [app.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let certificate_path = app.certificate_path;
      let finalStatus = status;

      if (certFile) {
        if (certFile.type !== "application/pdf") throw new Error("Certificate must be a PDF");
        if (certFile.size > 10 * 1024 * 1024) throw new Error("Certificate must be under 10MB");
        const safeName = certFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Store under owner's path so their signed URLs continue to work
        const path = `${app.user_id}/${app.id}/certificate/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, certFile, {
          contentType: "application/pdf",
          upsert: false,
        });
        if (upErr) throw upErr;
        await supabase.from("application_documents").insert({
          application_id: app.id,
          kind: "certificate",
          storage_path: path,
          file_name: certFile.name,
          size_bytes: certFile.size,
          mime_type: "application/pdf",
          uploaded_by: user.id,
        });
        certificate_path = path;
        finalStatus = "completed";
      }

      const { error } = await supabase
        .from("applications")
        .update({ status: finalStatus, certificate_path, admin_notes: notes || null })
        .eq("id", app.id);
      if (error) throw error;
      toast.success("Application updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const docsByKind = (k: Doc["kind"]) => docs.filter((d) => d.kind === k);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="ml-auto relative bg-background w-full max-w-2xl h-full overflow-y-auto shadow-2xl border-l border-border">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs text-muted-foreground">{app.payment_ref}</div>
            <h2 className="font-semibold text-foreground">{app.proposed_names[0] || "Application"}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Proposed Names</div>
            <ol className="space-y-1 text-sm">
              {app.proposed_names.map((n, i) => (
                <li key={i}><span className="text-muted-foreground w-6 inline-block">#{i + 1}</span>{n}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">Directors ({app.directors.length})</div>
            <div className="space-y-3">
              {app.directors.map((d, i) => (
                <div key={d.id ?? i} className="rounded-md border border-border p-3 text-sm">
                  <div className="font-semibold text-foreground">{d.fullNames} {d.surname}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    <div>ID: <span className="text-foreground">{d.idNumber}</span></div>
                    <div>Phone: <span className="text-foreground">{d.phone}</span></div>
                    <div className="col-span-2">Email: <span className="text-foreground">{d.email}</span></div>
                    <div className="col-span-2">Address: <span className="text-foreground">{d.address}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">Uploaded Documents</div>
            <DocSection title="Certified ID Copies" docs={docsByKind("id_copy")} urls={signedUrls} />
            <DocSection title="Proof of Address" docs={docsByKind("proof_of_address")} urls={signedUrls} />
            {docsByKind("certificate").length > 0 && (
              <DocSection title="CIPC Certificates" docs={docsByKind("certificate")} urls={signedUrls} />
            )}
          </div>

          <div className="rounded-xl border border-border p-4 space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Manage Application</div>

            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as AppStatus)} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
                <option value="pending_payment">Pending Payment</option>
                <option value="under_review">Under CIPC Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Admin notes (internal)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Upload Final CIPC Certificate (PDF)</label>
              <label htmlFor="cert-upload" className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 cursor-pointer hover:bg-secondary transition">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div className="text-xs text-foreground">{certFile ? certFile.name : "Click to select PDF (uploading marks status as Completed)"}</div>
                <input id="cert-upload" type="file" accept="application/pdf" className="sr-only" onChange={(e) => setCertFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DocSection({ title, docs, urls }: { title: string; docs: Doc[]; urls: Record<string, string> }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="text-xs text-muted-foreground mb-1.5">{title}</div>
      {docs.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">None uploaded</div>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-accent" />
              <span className="truncate flex-1 text-foreground">{d.file_name}</span>
              <span className="text-xs text-muted-foreground">{(d.size_bytes / 1024).toFixed(0)} KB</span>
              {urls[d.id] && (
                <a href={urls[d.id]} target="_blank" rel="noreferrer" className="text-accent hover:opacity-80" title="Download">
                  <Download className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
