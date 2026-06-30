import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-foreground">RegistrCo</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">CIPC Registration Services</div>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Start Registration
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row gap-3 justify-between">
          <div>© {new Date().getFullYear()} RegistrCo. Independent service provider — not affiliated with CIPC.</div>
          <div>Registered in South Africa</div>
        </div>
      </footer>
    </div>
  );
}
