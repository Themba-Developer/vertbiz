import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    setIsAdmin(false);

    const loadRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!active) return;
        setIsAdmin(!error && !!data);
      } catch {
        if (active) setIsAdmin(false);
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
      value={{ session, user: session?.user ?? null, isAdmin, loading: sessionLoading || roleLoading, signOut }}
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
