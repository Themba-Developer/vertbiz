export type AppStatus = "pending_payment" | "under_review" | "completed";

const CONFIG: Record<AppStatus, { label: string; cls: string }> = {
  pending_payment: {
    label: "Pending Payment",
    cls: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  under_review: {
    label: "Under CIPC Review",
    cls: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}
