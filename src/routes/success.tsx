import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Download, FileText, Mail } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import {
  emptyRegistration,
  loadRegistration,
  type RegistrationData,
} from "@/lib/registration-store";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Application Received — RegistrCo" },
      { name: "description", content: "Your CIPC company registration application has been received and is under review." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const [data, setData] = useState<RegistrationData>(emptyRegistration());

  useEffect(() => {
    setData(loadRegistration());
  }, []);

  const primaryName = data.proposedNames[0] || "Your company";
  const submitted = data.submittedAt
    ? new Date(data.submittedAt).toLocaleString("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-bold text-foreground">
            Payment received — application submitted
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Thank you. We've received your registration for{" "}
            <strong className="text-foreground">{primaryName}</strong> and lodged it
            for review.
          </p>
        </div>

        {/* Status card */}
        <div className="mt-10 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Reference</div>
              <div className="font-mono text-sm text-foreground">
                {data.paymentRef ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Submitted</div>
              <div className="text-sm text-foreground">{submitted}</div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="text-sm text-muted-foreground mb-2">Application status</div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  Documents Received & Under Review
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimated turnaround: 2–3 business days
                </div>
              </div>
            </div>

            {/* Progress */}
            <ol className="mt-6 space-y-3">
              <Stage status="done" title="Application submitted" desc="Documents and payment received." />
              <Stage status="active" title="Under review" desc="Our team is preparing your CIPC lodgement." />
              <Stage status="pending" title="CIPC processing" desc="Name reservation and registration with CIPC." />
              <Stage status="pending" title="Documents ready" desc="Final certificates delivered to you." />
            </ol>
          </div>
        </div>

        {/* Document placeholder */}
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Your CIPC documents</div>
              <div className="text-sm text-muted-foreground">
                Once processed, you'll be able to download your registration certificate (COR14.3), MOI, and name reservation here.
              </div>
            </div>
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
            >
              <Download className="h-4 w-4" /> Not yet available
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface/60 p-5 flex items-start gap-3">
          <Mail className="h-5 w-5 text-accent mt-0.5" />
          <div className="text-sm text-foreground">
            We'll send status updates to{" "}
            <strong>{data.directors[0]?.email || "your email"}</strong>. You can
            close this page — your reference is saved.
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}

function Stage({
  status,
  title,
  desc,
}: {
  status: "done" | "active" | "pending";
  title: string;
  desc: string;
}) {
  const dotCls =
    status === "done"
      ? "bg-success border-success"
      : status === "active"
        ? "bg-accent border-accent animate-pulse"
        : "bg-card border-border";
  return (
    <li className="flex items-start gap-3">
      <div className={`mt-1 h-3 w-3 rounded-full border ${dotCls}`} />
      <div>
        <div
          className={
            status === "pending"
              ? "text-sm text-muted-foreground"
              : "text-sm font-medium text-foreground"
          }
        >
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}
