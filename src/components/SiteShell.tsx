import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Handshake, Home, LayoutDashboard, LogIn, LogOut, Menu, PlusCircle, Settings, Shield, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, affiliateBusinessName, signOut } = useAuth();
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 sm:hidden">
              {user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <span className="block text-xs text-muted-foreground">
                      {affiliateBusinessName ? "Business account" : "Signed in as"}
                    </span>
                    <span className="block truncate font-medium">{affiliateBusinessName || user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/affiliate" className="cursor-pointer">
                      <Handshake className="h-4 w-4" />
                      Affiliate Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/#pricing" className="cursor-pointer">
                      <PlusCircle className="h-4 w-4" />
                      Choose a Service
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onSelect={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="cursor-pointer">
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#pricing" className="cursor-pointer">
                      <PlusCircle className="h-4 w-4" />
                      Choose a Service
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            {user && (
              <>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/affiliate" className="hover:text-foreground transition-colors">
                  Affiliate
                </Link>
                <Link to="/settings" className="hover:text-foreground transition-colors">
                  Settings
                </Link>
              </>
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
                  {affiliateBusinessName || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
                <a
                  href="/#pricing"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                  Start Registration
                </a>
              </div>
            ) : (
              <>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <a
                  href="/#pricing"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                  Start Registration
                </a>
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
