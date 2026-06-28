import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusSignal } from "@/components/StatusSignal";
import { api } from "@/lib/api";
import type { Product } from "@/types";

interface Counts {
  total: number;
  validado: number;
  em_validacao: number;
  nao_validado: number;
}

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts>({ total: 0, validado: 0, em_validacao: 0, nao_validado: 0 });
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts()
      .then((all: Product[]) => {
        setRecent(all.slice(0, 6));
        const next: Counts = { total: 0, validado: 0, em_validacao: 0, nao_validado: 0 };
        all.forEach((p) => {
          next.total += 1;
          next[p.validation_status] += 1;
        });
        setCounts(next);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Visão geral">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Produtos monitorados" value={counts.total} />
        <KpiCard label="Possivelmente validados" value={counts.validado} accent="text-signal-green" />
        <KpiCard label="Em validação" value={counts.em_validacao} accent="text-signal-yellow" />
        <KpiCard label="Não validados" value={counts.nao_validado} accent="text-signal-red" />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display font-bold text-sm">Produtos adicionados recentemente</h2>
          <Link to="/produtos" className="text-xs text-accent hover:underline">
            Ver todos
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted">Carregando…</p>}
          {!loading && recent.length === 0 && (
            <p className="text-sm text-muted">
              Nenhum produto cadastrado ainda. Vá em "Produtos monitorados" para adicionar o primeiro.
            </p>
          )}
          {recent.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-border/60 last:border-0 pb-3 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted font-mono-data">{p.category_name}</p>
              </div>
              <StatusSignal status={p.validation_status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        <p className={`font-mono-data text-3xl font-semibold mt-2 ${accent ?? "text-white"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
