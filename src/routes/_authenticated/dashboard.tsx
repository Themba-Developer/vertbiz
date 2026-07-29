import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge, type AppStatus } from "@/components/StatusBadge";
import { CreditCard, Download, FileText, PlusCircle, PartyPopper, Trash2 } from "lucide-react";
import { getService } from "@/lib/services";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Row = {
  id: string;
  service_id: string;
  primary_director_name: string;
  proposed_names: string[];
  submitted_at: string | null;
  status: AppStatus;
  admin_delivered: boolean;
  delivered_at: string | null;
  payment_ref: string | null;
};

type Delivery = {
  id: string;
  application_id: string;
  file_path: string;
  file_name: string;
  delivered_at: string;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Applications — Vert Corp Group" },
      { name: "description", content: "Track your service applications with Vert Corp Group." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select(
          "id,service_id,primary_director_name,proposed_names,submitted_at,status,admin_delivered,delivered_at,payment_ref"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const rowsData = (apps as any as Row[]) ?? [];
      setRows(rowsData);

      if (rowsData.length) {
        const ids = rowsData.map((r) => r.id);
        const { data: delivs } = await supabase
          .from("application_deliveries")
          .select("id, application_id, file_path, file_name, delivered_at")
          .in("application_id", ids);
        const grouped: Record<string, Delivery[]> = {};
        ((delivs as any as Delivery[]) ?? []).forEach((d) => {
          (grouped[d.application_id] ||= []).push(d);
        });
        setDeliveries(grouped);
      }
      setLoading(false);
    })();
  }, [user]);

  const downloadDelivery = async (d: Delivery) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(d.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  const cancelApplication = async (applicationId: string) => {
    setCancellingId(applicationId);
    try {
      const { data: documents, error: documentsError } = await supabase
        .from("application_documents")
        .select("storage_path")
        .eq("application_id", applicationId);
      if (documentsError) throw documentsError;

      const storagePaths = (documents ?? []).map((document) => document.storage_path);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from("documents").remove(storagePaths);
        if (storageError) throw storageError;
      }

      const { error: deleteError } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationId)
        .eq("user_id", user!.id)
        .eq("status", "pending_payment");
      if (deleteError) throw deleteError;

      setRows((current) => current.filter((row) => row.id !== applicationId));
      setDeliveries((current) => {
        const next = { ...current };
        delete next[applicationId];
        return next;
      });
      toast.success("Application cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel the application.");
    } finally {
      setCancellingId(null);
    }
  };

  const anyCompleted = rows.some((r) => r.admin_delivered);

  return (
    <SiteShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and download your completed services.</p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            <PlusCircle className="h-4 w-4" /> New Application
          </Link>
        </div>

        {anyCompleted && (
          <div className="mb-6 rounded-xl border border-green-300 bg-green-50 text-green-900 p-5 flex items-start gap-3">
            <PartyPopper className="h-6 w-6 shrink-0 text-green-700" />
            <div>
              <div className="font-semibold">Your service/company registration is complete!</div>
              <div className="text-sm opacity-90">Download your files below.</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
            <h2 className="mt-4 font-semibold text-foreground">No applications yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Start your first application in just a few minutes.</p>
            <Link
              to="/register"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              Start Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((r) => {
              const service = getService(r.service_id);
              const files = deliveries[r.id] ?? [];
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-foreground truncate">
                          {service?.name || r.service_id}
                        </div>
                        <StatusBadge status={r.admin_delivered ? ("completed" as AppStatus) : r.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.proposed_names?.[0] ? `${r.proposed_names[0]} · ` : ""}
                        Ref {r.payment_ref ?? "—"} · Submitted{" "}
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-ZA") : "—"}
                      </div>
                    </div>
                    {r.status === "pending_payment" && !r.admin_delivered && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/checkout"
                          search={{ serviceId: r.service_id, applicationId: r.id }}
                          className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-3 py-2 text-sm font-semibold hover:opacity-90 transition"
                        >
                          <CreditCard className="h-4 w-4" />
                          Continue to payment
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={cancellingId === r.id}
                              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {cancellingId === r.id ? "Cancelling..." : "Cancel"}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel this application?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the pending application and its uploaded documents. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep application</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelApplication(r.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancel application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  {r.admin_delivered && files.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="text-sm font-medium text-foreground mb-2">Completed files</div>
                      <ul className="space-y-2">
                        {files.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-center gap-3 rounded-md border border-border bg-surface/50 px-3 py-2"
                          >
                            <FileText className="h-4 w-4 text-accent shrink-0" />
                            <span className="text-sm text-foreground truncate flex-1">{f.file_name}</span>
                            <button
                              onClick={() => downloadDelivery(f)}
                              className="inline-flex items-center gap-1 rounded-md bg-accent text-accent-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.admin_delivered && files.length === 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Completed — files preparing shortly.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
