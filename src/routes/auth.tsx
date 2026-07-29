import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { SiteShell } from "@/components/SiteShell";
import { z } from "zod";
import { Capacitor } from "@capacitor/core";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: s.mode === "signup" || s.mode === "forgot" || s.mode === "reset" ? s.mode : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Vert Corp Group" },
      { name: "description", content: "Sign in or create an account to register your company with Vert Corp Group." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const authRedirect = Capacitor.isNativePlatform() ? "vertbiz://auth" : `${siteUrl}/auth`;
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (confirmationSent || mode === "reset") return;
    if (!loading && user) {
      const redirect = search.redirect?.startsWith("/") ? search.redirect : "/dashboard";
      if (redirect.includes("?") || redirect.includes("#")) {
        window.location.assign(redirect);
      } else {
        navigate({ to: redirect });
      }
    }
  }, [user, loading, navigate, search.redirect, confirmationSent, mode]);

  const validate = () => {
    const schema = z.object({
      email: z.string().trim().email("Enter a valid email").max(255),
      password: z.string().min(8, "Password must be at least 8 characters").max(128),
    });
    const r = schema.safeParse({ email, password });
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authRedirect,
          },
        });
        if (signupError) throw signupError;

        toast.success("Confirmation email sent.");
        setConfirmationSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirect,
      },
    });
    if (error) {
      toast.error(error.message || "Google sign-in failed");
      setBusy(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Enter a valid email").max(255).safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${authRedirect}?mode=reset`,
      });
      if (error) throw error;
      toast.success("If an account exists, a password reset email has been sent.");
      setMode("signin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password reset email could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Your password has been updated.");
      setPassword("");
      setConfirmPassword("");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img src="/Logo_Official_1.png" alt="Vert Corp Group" className="h-16 w-16 object-contain" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {confirmationSent
                ? "Check your email"
                : mode === "forgot"
                ? "Reset your password"
                : mode === "reset"
                ? "Choose a new password"
                : mode === "signup"
                ? "Create your account"
                : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              {confirmationSent
                ? `We sent an account confirmation link to ${email}.`
                : mode === "forgot"
                ? "Enter your account email and we'll send a secure reset link."
                : mode === "reset"
                ? "Enter and confirm your new account password."
                : mode === "signup"
                ? "Sign up to submit and track your registrations."
                : "Sign in to continue your company registration."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-card p-6">
            {confirmationSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Open the email from VertBiz and select the confirmation link to activate your account.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationSent(false);
                    setMode("signin");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
              </div>
            ) : mode === "forgot" ? (
              <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@example.com"
                  />
                </div>
                <button type="submit" disabled={busy} className="w-full rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
                  {busy ? "Sending..." : "Send reset link"}
                </button>
                <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-muted-foreground hover:text-foreground">
                  Back to sign in
                </button>
              </form>
            ) : mode === "reset" ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Repeat your new password"
                  />
                </div>
                <button type="submit" disabled={busy} className="w-full rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
                  {busy ? "Updating..." : "Update password"}
                </button>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition disabled:opacity-60"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.2-7.86z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                  >
                    {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
                  </button>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="w-full text-sm text-primary hover:underline"
                    >
                      Forgot your password?
                    </button>
                  )}
                </form>

                <div className="mt-5 text-center text-sm text-muted-foreground">
                  {mode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      New here?{" "}
                      <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                        Create an account
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
