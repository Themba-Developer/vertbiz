import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Fingerprint, Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/SiteShell";
import { PasswordField } from "@/components/PasswordField";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const BIOMETRIC_SERVER = "vertbiz.online";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Account Settings — Vert Corp Group" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSaved, setBiometricSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("email,phone,physical_address")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setEmail(data.email || user.email || "");
        setPhone(data.phone || "");
        setAddress(data.physical_address || "");
      }
      if (Capacitor.isNativePlatform()) {
        try {
          const [available, saved] = await Promise.all([
            NativeBiometric.isAvailable({ useFallback: true }),
            NativeBiometric.isCredentialsSaved({ server: BIOMETRIC_SERVER }),
          ]);
          setBiometricAvailable(available.isAvailable);
          setBiometricSaved(saved.isSaved);
        } catch {
          setBiometricAvailable(false);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email?.toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: normalizedEmail });
        if (error) throw error;
      }
      const { error } = await (supabase as any).from("profiles").upsert({
        user_id: user.id,
        email: normalizedEmail,
        phone: phone.trim(),
        physical_address: address.trim(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(
        normalizedEmail !== user.email?.toLowerCase()
          ? "Profile saved. Confirm the email sent to your new address."
          : "Profile updated.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER }).catch(() => undefined);
      setBiometricSaved(false);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated. Sign in once with your new password to re-enable biometrics.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const disableBiometrics = async () => {
    await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
    setBiometricSaved(false);
    toast.success("Biometric sign-in disabled on this device.");
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="py-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your contact details and account security.</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Contact details</h2>
          <div>
            <label className="text-sm font-medium">Email address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Physical address</label>
            <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60">
            <Save className="h-4 w-4" /> Save details
          </button>
        </form>

        <form onSubmit={updatePassword} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Update password</h2>
          <div>
            <label className="text-sm font-medium">New password</label>
            <PasswordField required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <PasswordField required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button disabled={saving} className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            Update password
          </button>
        </form>

        {Capacitor.isNativePlatform() && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Fingerprint className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <h2 className="font-semibold text-lg">Biometric sign-in</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {biometricAvailable
                    ? biometricSaved
                      ? "Biometric sign-in is enabled on this device."
                      : "On your next password sign-in, select the biometric option to enable it."
                    : "Biometric or secure device authentication is not available on this phone."}
                </p>
                {biometricSaved && (
                  <button type="button" onClick={disableBiometrics}
                    className="mt-4 rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive">
                    Disable biometrics
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
