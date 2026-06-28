import { useEffect, useState } from "react";
import { Copy, Sparkles, Check, ImageOff } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { api, apiImageUrl } from "@/lib/api";
import type { AdGeneration, Product } from "@/types";
import { formatDateBR } from "@/lib/utils";

export default function AdGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [generations, setGenerations] = useState<AdGeneration[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (!productId) {
      setGenerations([]);
      return;
    }
    api.getAds(productId).then(setGenerations);
  }, [productId]);

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleGenerate() {
    if (!productId) {
      setError("Selecione um produto monitorado primeiro.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const { variations } = await api.generateAd(productId);
      setGenerations((prev) => [...variations, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar novas versões agora.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(ad: AdGeneration) {
    navigator.clipboard.writeText(`${ad.title}\n\n${ad.body}`);
    setCopiedId(ad.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <AppLayout title="Gerador de anúncios">
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-display font-bold text-sm">Gerar novas versões a partir de um produto monitorado</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Selecione o produto de referência…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles size={14} /> {generating ? "Gerando…" : "Gerar novas versões"}
            </Button>
          </div>
          {error && <p className="text-sm text-signal-red mt-3">{error}</p>}
          {selectedProduct && (
            <p className="text-xs text-muted mt-3">
              Base: <span className="text-white">{selectedProduct.name}</span> — as variações reaproveitam nome, categoria e
              proposta de valor do anúncio original da Shopee, com textos (e imagem, se configurada) diferentes.
            </p>
          )}
        </CardContent>
      </Card>

      {productId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generations.length === 0 && (
            <p className="text-sm text-muted md:col-span-2">Nenhuma versão gerada ainda para este produto.</p>
          )}
          {generations.map((ad) => (
            <Card key={ad.id}>
              <CardHeader>
                <div>
                  <p className="text-xs text-accent font-medium uppercase tracking-wide">{ad.variation_label}</p>
                  <h3 className="font-display font-bold text-sm mt-0.5">{ad.title}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(ad)}>
                  {copiedId === ad.id ? <Check size={14} className="text-signal-green" /> : <Copy size={14} />}
                  {copiedId === ad.id ? "Copiado" : "Copiar"}
                </Button>
              </CardHeader>
              <CardContent>
                {ad.image_url ? (
                  <img
                    src={apiImageUrl(ad.image_url) ?? undefined}
                    alt={ad.title}
                    className="w-full rounded mb-3 border border-border"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted border border-dashed border-border rounded h-32 mb-3 justify-center">
                    <ImageOff size={14} /> Geração de imagem desativada ou indisponível
                  </div>
                )}
                <p className="text-sm text-muted whitespace-pre-line">{ad.body}</p>
                <p className="text-xs text-muted mt-3 font-mono-data">
                  Gerado por {ad.created_by_name ?? "—"} em {formatDateBR(ad.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
