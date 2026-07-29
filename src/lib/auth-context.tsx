import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  affiliateBusinessName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [affiliateBusinessName, setAffiliateBusinessName] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const syncSession = (s: Session | null) => {
      setSession(s);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      syncSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      syncSession(data.session);
      setSessionLoading(false);
    }).catch(() => {
      setSession(null);
      setSessionLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const user = session?.user;

    if (!user) {
      setIsAdmin(false);
      setAffiliateBusinessName(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    setIsAdmin(false);
    setAffiliateBusinessName(null);

    const loadRole = async () => {
      try {
        const [{ data, error }, { data: affiliate }] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle(),
          (supabase as any)
            .from("affiliate_profiles")
            .select("company_name,status")
            .eq("user_id", user.id)
            .eq("status", "approved")
            .maybeSingle(),
        ]);
        if (!active) return;
        setIsAdmin(!error && !!data);
        setAffiliateBusinessName(affiliate?.company_name || null);
      } catch {
        if (active) {
          setIsAdmin(false);
          setAffiliateBusinessName(null);
        }
      } finally {
        if (active) setRoleLoading(false);
      }
    };

    void loadRole();

    return () => {
      active = false;
    };
  }, [session?.user?.id, session?.user?.email]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        affiliateBusinessName,
        loading: sessionLoading || roleLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
