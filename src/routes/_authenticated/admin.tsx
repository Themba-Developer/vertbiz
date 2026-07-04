import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Shield, Search, Loader2, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { getService } from "@/lib/services";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Vert Corp Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type ApplicationWithDocs = {
  id: string;
  user_id: string;
  service_id: string;
  primary_director_name: string;
  primary_director_email: string;
  proposed_names: string[];
  status: string;
  submitted_at: string | null;
  payment_ref: string | null;
  admin_delivered: boolean;
  created_at: string;
  documents: {
    id: string;
    kind: string;
    file_name: string;
    storage_path: string;
    size_bytes: number;
  }[];
  deliveries: number;
};

function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/" });
      return;
    }
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (appsError) throw appsError;

      const enriched = await Promise.all(
        (apps as any[]).map(async (app) => {
          const [{ data: docs }, { count }] = await Promise.all([
            supabase
              .from("application_documents")
              .select("id, kind, file_name, storage_path, size_bytes")
              .eq("application_id", app.id),
            supabase
              .from("application_deliveries")
              .select("id", { count: "exact", head: true })
              .eq("application_id", app.id),
          ]);
          return { ...app, documents: docs || [], deliveries: count || 0 };
        })
      );
      setApplications(enriched as ApplicationWithDocs[]);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const downloadAllDocuments = async (app: ApplicationWithDocs) => {
    setDownloadingId(app.id);
    try {
      for (const doc of app.documents) {
        const { data, error } = await supabase.storage.from("documents").download(doc.storage_path);
        if (error) throw error;
        const url = URL.createObjectURL(data);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 250));
      }
      toast.success("Documents downloaded");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to download");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAdminUpload = (appId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg";
    input.onchange = async (e: any) => {
      const files = e.target.files as FileList;
      if (!files.length) return;
      setUploadingId(appId);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        if (!currentUser) throw new Error("Not authenticated");
        const app = applications.find((a) => a.id === appId);
        if (!app) throw new Error("Application not found");

        for (const file of Array.from(files)) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${app.user_id}/${appId}/delivered/${crypto.randomUUID()}-${safeName}`;
          const { error: upErr } = await supabase.storage
            .from("documents")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) throw upErr;
          const { error: delErr } = await supabase.from("application_deliveries").insert({
            application_id: appId,
            delivered_by: currentUser.id,
            file_path: path,
            file_name: file.name,
            size_bytes: file.size,
            mime_type: file.type,
          });
          if (delErr) throw delErr;
        }

        const { error: updateErr } = await supabase
          .from("applications")
          .update({
            admin_delivered: true,
            delivered_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", appId);
        if (updateErr) throw updateErr;

        toast.success("Completed documents uploaded to customer");
        await loadApplications();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingId(null);
      }
    };
    input.click();
  };

  const filtered = applications.filter((app) => {
    const s = query.toLowerCase();
    return (
      app.primary_director_name.toLowerCase().includes(s) ||
      app.primary_director_email.toLowerCase().includes(s) ||
      (app.service_id || "").toLowerCase().includes(s) ||
      (app.proposed_names || []).some((n) => (n || "").toLowerCase().includes(s)) ||
      (app.payment_ref ?? "").toLowerCase().includes(s)
    );
  });

  if (authLoading || !isAdmin) {
    return (
      <SiteShell>
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      </SiteShell>
    );
  }

  const statusBadge = (status: string, delivered: boolean) => {
    if (delivered || status === "completed")
      return "bg-green-100 text-green-800 border-green-200";
    if (status === "under_review") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-amber-100 text-amber-900 border-amber-200";
  };

  return (
    <SiteShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, service, company name, or payment ref..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={loadApplications}
            className="px-4 py-2 rounded-md border border-border bg-card hover:bg-secondary text-foreground text-sm font-medium transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No applications found</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto bg-card">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Director</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Service</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Proposed / Ref</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Submitted</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Docs</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-secondary/30 transition">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{app.primary_director_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{app.primary_director_email}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {getService(app.service_id)?.name || app.service_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="max-w-[200px] truncate">
                        {(app.proposed_names && app.proposed_names[0]) || "—"}
                      </div>
                      <div className="text-xs opacity-70">{app.payment_ref || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusBadge(
                          app.status,
                          app.admin_delivered
                        )}`}
                      >
                        {app.admin_delivered
                          ? "Completed"
                          : app.status.replace(/_/g, " ").charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(app.submitted_at || app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {app.documents.length} in
                      {app.deliveries > 0 && (
                        <span className="ml-1 text-green-700">
                          / {app.deliveries} out
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm space-y-2 min-w-[180px]">
                      <button
                        onClick={() => downloadAllDocuments(app)}
                        disabled={downloadingId === app.id || app.documents.length === 0}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition disabled:opacity-60"
                      >
                        <Download className="h-3 w-3" />
                        {downloadingId === app.id ? "Downloading…" : "Download Attachments"}
                      </button>
                      <button
                        onClick={() => handleAdminUpload(app.id)}
                        disabled={uploadingId === app.id}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition disabled:opacity-60"
                      >
                        {app.admin_delivered ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        {uploadingId === app.id
                          ? "Uploading…"
                          : app.admin_delivered
                          ? "Upload More"
                          : "Upload Completed Document"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filtered.length} of {applications.length} applications
        </div>
      </div>
    </SiteShell>
  );
}
