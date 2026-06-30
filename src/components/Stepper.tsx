import { Check } from "lucide-react";

export type Step = { id: number; label: string };

export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex items-center w-full gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <li key={s.id} className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div
                className={[
                  "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors",
                  done
                    ? "bg-success text-success-foreground border-success"
                    : active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border",
                ].join(" ")}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <div
                className={[
                  "text-xs sm:text-sm font-medium truncate",
                  active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-border ml-1" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
