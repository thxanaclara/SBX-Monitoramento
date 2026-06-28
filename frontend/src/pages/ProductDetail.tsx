import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusSignal } from "@/components/StatusSignal";
import { api } from "@/lib/api";
import type { DailySale, PriceHistoryEntry, Product } from "@/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";

type Period = "7d" | "30d" | "60d" | "mes" | "ano" | "tudo";

const periodLabels: Record<Period, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "60d": "Últimos 60 dias",
  mes: "Mês atual",
  ano: "Ano atual",
  tudo: "Desde o início",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [prices, setPrices] = useState<PriceHistoryEntry[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getProduct(id), api.getProductSales(id), api.getProductPrices(id)])
      .then(([productData, salesData, priceData]) => {
        setProduct(productData);
        setSales(salesData);
        setPrices(priceData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const filteredSales = useMemo(() => filterByPeriod(sales, period), [sales, period]);

  const peak = useMemo(() => {
    if (filteredSales.length === 0) return null;
    return filteredSales.reduce((max, d) => (d.sales_count > max.sales_count ? d : max), filteredSales[0]);
  }, [filteredSales]);

  const chartData = filteredSales.map((d) => ({ date: formatDateBR(d.date), vendas: d.sales_count }));
  const priceChartData = prices.map((p) => ({ date: formatDateBR(p.recorded_at), preco: p.price }));

  if (loading) {
    return (
      <AppLayout title="Produto">
        <p className="text-sm text-muted">Carregando…</p>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout title="Produto não encontrado">
        <p className="text-sm text-muted">Esse produto não existe ou foi removido.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={product.name}>
      <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-white mb-4">
        <ArrowLeft size={14} /> Voltar para produtos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-xl">{product.name}</h2>
            <a href={product.shopee_url} target="_blank" rel="noreferrer" className="text-muted hover:text-accent">
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-xs text-muted mt-1">
            Postado na Shopee em {product.posted_on_shopee_at ? formatDateBR(product.posted_on_shopee_at) : "—"} · Cadastrado por{" "}
            {product.created_by_name ?? "—"}
          </p>
        </div>
        <StatusSignal status={product.validation_status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-xs text-muted uppercase tracking-wide">Preço atual</p>
            <p className="font-mono-data text-2xl font-semibold mt-2">
              {product.current_price ? formatCurrencyBRL(product.current_price) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted uppercase tracking-wide">Pico de vendas no período</p>
            <p className="font-mono-data text-2xl font-semibold mt-2 flex items-center gap-2">
              {peak ? `${peak.sales_count}/dia` : "—"}
              {peak && <TrendingUp size={16} className="text-signal-green" />}
            </p>
            {peak && <p className="text-xs text-muted mt-1">em {formatDateBR(peak.date)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted uppercase tracking-wide">Última sincronização</p>
            <p className="font-mono-data text-sm font-medium mt-2">
              {product.last_synced_at ? formatDateBR(product.last_synced_at) : "aguardando…"}
            </p>
            <p className="text-xs text-muted mt-1">Atualiza automaticamente a cada 10 minutos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-display font-bold text-sm">Vendas diárias</h3>
          <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-44">
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" />
                <XAxis dataKey="date" stroke="#8B92A3" fontSize={12} />
                <YAxis stroke="#8B92A3" fontSize={12} />
                <Tooltip contentStyle={{ background: "#1E222C", border: "1px solid #2A2F3A", fontSize: 12 }} />
                <Line type="monotone" dataKey="vendas" stroke="#4F7CFF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-display font-bold text-sm">Histórico e flutuação de preço desde a postagem</h3>
        </CardHeader>
        <CardContent>
          {priceChartData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={priceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" />
                <XAxis dataKey="date" stroke="#8B92A3" fontSize={12} />
                <YAxis stroke="#8B92A3" fontSize={12} />
                <Tooltip contentStyle={{ background: "#1E222C", border: "1px solid #2A2F3A", fontSize: 12 }} />
                <Line type="stepAfter" dataKey="preco" stroke="#F5C518" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function EmptyChartState() {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-muted border border-dashed border-border rounded">
      Ainda não há dados suficientes nesse período. A sincronização automática roda a cada 10 minutos.
    </div>
  );
}

function filterByPeriod(sales: DailySale[], period: Period): DailySale[] {
  if (period === "tudo" || sales.length === 0) return sales;
  const now = new Date();
  const cutoff = new Date();

  if (period === "7d") cutoff.setDate(now.getDate() - 7);
  if (period === "30d") cutoff.setDate(now.getDate() - 30);
  if (period === "60d") cutoff.setDate(now.getDate() - 60);
  if (period === "mes") return sales.filter((s) => sameMonth(new Date(s.date), now));
  if (period === "ano") return sales.filter((s) => new Date(s.date).getFullYear() === now.getFullYear());

  return sales.filter((s) => new Date(s.date) >= cutoff);
}

function sameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
