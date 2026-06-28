import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { Profile } from "@/types";

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const me = await api.me();
      setProfile({
        id: me.id,
        organization_id: me.organizationId,
        full_name: me.fullName,
        email: me.email,
        role: me.role,
        created_at: me.createdAt,
      });
    } catch {
      setToken(null);
      setProfile(null);
    }
  }

  useEffect(() => {
    (async () => {
      if (getToken()) await loadProfile();
      setLoading(false);
    })();
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      setProfile({
        id: user.id,
        organization_id: user.organizationId,
        full_name: user.fullName,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
      });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Erro ao entrar" };
    }
  }

  function signOut() {
    setToken(null);
    setProfile(null);
  }

  const value: AuthContextValue = {
    profile,
    loading,
    isAdmin: profile?.role === "admin",
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de um AuthProvider");
  return ctx;
}
