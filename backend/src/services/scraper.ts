// Busca os dados públicos de um produto na Shopee (nome, preço, imagem) e
// registra a venda do dia + a variação de preço, se houver.
//
// ───────────────────────────────────────────────────────────────────────────
// ATENÇÃO — leia antes de colocar em produção:
// A Shopee não oferece uma API pública para esses dados, e a maior parte do
// conteúdo da página é renderizada via JavaScript, então um simples
// `fetch + parse de HTML` (como está abaixo) provavelmente NÃO vai funcionar
// sozinho. Você vai precisar de uma das opções abaixo — a função foi escrita
// para que seja fácil trocar só esta parte, sem alterar o resto do sistema:
//   a) um serviço de scraping com renderização (ex.: ScraperAPI, Bright
//      Data, Apify) que devolva o HTML/JSON já renderizado;
//   b) um endpoint interno da Shopee usado pelo app/site (sujeito a mudar
//      sem aviso e a bloqueios por IP/rate limit);
//   c) inserção manual de fallback quando a sincronização falhar.
// Trate bloqueios e mudanças de layout como esperados, não como exceção.
// ───────────────────────────────────────────────────────────────────────────

import { prisma } from "../lib/prisma.js";
import { recomputeValidationStatus } from "./validation.js";

interface ShopeeProductData {
  name: string;
  imageUrl: string | null;
  price: number;
  todaySales: number;
  postedOnShopeeAt: Date | null;
}

async function fetchShopeeProductData(shopeeUrl: string): Promise<ShopeeProductData | null> {
  // TODO: substituir pela integração real (ver aviso no topo do arquivo).
  // Mantido aqui como ponto único de integração: o resto do fluxo de
  // sincronização não precisa mudar quando você plugar a extração real.
  try {
    const res = await fetch(shopeeUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SBXMonitoramento/1.0)" },
    });
    if (!res.ok) return null;

    // Placeholder: aqui entraria o parser real do HTML/JSON retornado.
    return null;
  } catch {
    return null;
  }
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function syncProduct(productId: string): Promise<{ id: string; ok: boolean }> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { id: productId, ok: false };

  const data = await fetchShopeeProductData(product.shopeeUrl);

  if (!data) {
    // Falha na sincronização: não derruba o produto, só não atualiza agora.
    await prisma.product.update({ where: { id: productId }, data: { lastSyncedAt: new Date() } });
    return { id: productId, ok: false };
  }

  const today = startOfDay(new Date());

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
      currentPrice: data.price,
      postedOnShopeeAt: data.postedOnShopeeAt,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.dailySale.upsert({
    where: { productId_date: { productId, date: today } },
    update: { salesCount: data.todaySales },
    create: { productId, date: today, salesCount: data.todaySales },
  });

  if (product.currentPrice === null || product.currentPrice !== data.price) {
    await prisma.priceHistoryEntry.create({ data: { productId, price: data.price } });
  }

  await recomputeValidationStatus(productId);

  return { id: productId, ok: true };
}

export async function syncAllProducts(organizationId?: string) {
  const products = await prisma.product.findMany({
    where: organizationId ? { organizationId } : undefined,
    select: { id: true },
  });
  return Promise.all(products.map((p) => syncProduct(p.id)));
}
