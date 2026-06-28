import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { profile, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-base text-muted">Carregando…</div>;
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
