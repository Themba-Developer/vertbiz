import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, User as UserIcon, Shield } from "lucide-react";

export function SiteShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/Logo_Official_1.png" alt="Vert Corp Group" className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <div className="font-semibold text-foreground">Vert Corp Group</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">CIPC Registration Services</div>
            </div>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="sm:hidden inline-flex items-center gap-1 rounded-md border border-primary/30 px-3 py-1.5 text-xs text-primary font-medium">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            {user && (
              <Link to="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium">
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-border">
                <span className="hidden md:inline text-xs text-muted-foreground max-w-[160px] truncate">
                  <UserIcon className="h-3 w-3 inline mr-1" />
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                  Start Registration
                </Link>
              </div>
            ) : (
              <>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                  Start Registration
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row gap-3 justify-between">
          <div>© {new Date().getFullYear()} Vert Corp Group. Independent service provider — not affiliated with CIPC.</div>
          <div>Registered in South Africa</div>
        </div>
      </footer>
    </div>
  );
}
