import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function Login() {
  const { profile, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (profile) {
    const redirectTo = (location.state as { from?: string })?.from ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Radar size={28} className="text-accent" />
          <span className="font-display font-extrabold text-xl tracking-tight">SBX Monitoramento</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded border border-border bg-surface p-6">
          <div>
            <h1 className="font-display font-bold text-lg">Entrar na conta</h1>
            <p className="text-sm text-muted mt-1">Acompanhe o desempenho dos produtos monitorados na Shopee.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>

          <p className="text-xs text-muted text-center pt-1">
            Novos acessos são liberados automaticamente após a confirmação da assinatura.
          </p>
        </form>
      </div>
    </div>
  );
}
