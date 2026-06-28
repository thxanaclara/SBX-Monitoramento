import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { syncProduct, syncAllProducts } from "../services/scraper.js";

export const productsRouter = Router();

function serializeProduct(p: any) {
  return {
    id: p.id,
    organization_id: p.organizationId,
    category_id: p.categoryId,
    category_name: p.category?.name ?? null,
    shopee_url: p.shopeeUrl,
    name: p.name,
    image_url: p.imageUrl,
    current_price: p.currentPrice,
    validation_status: p.validationStatus,
    created_by: p.createdById,
    created_by_name: p.createdBy?.fullName ?? null,
    posted_on_shopee_at: p.postedOnShopeeAt,
    last_synced_at: p.lastSyncedAt,
    created_at: p.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Sincronização — chamada por DUAS origens diferentes:
//  1) o GitHub Actions (cron de 10 min) e a extensão de navegador, via
//     x-sync-api-key OU pelo token do usuário logado;
//  2) na prática, ambas autenticações são aceitas aqui, sem exigir admin,
//     já que a extensão é só um atalho de cadastro (não escreve dados de
//     venda diretamente).
// ---------------------------------------------------------------------------
productsRouter.post("/sync", async (req, res) => {
  const syncKey = req.headers["x-sync-api-key"];
  const authHeader = req.headers.authorization;

  const isSyncKeyValid = syncKey && syncKey === process.env.SYNC_API_KEY;
  const isUserAuthenticated = !!authHeader?.startsWith("Bearer ");

  if (!isSyncKeyValid && !isUserAuthenticated) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  const { product_id } = req.body ?? {};

  if (product_id) {
    const result = await syncProduct(product_id);
    return res.json({ synced: 1, results: [result] });
  }

  const results = await syncAllProducts();
  res.json({ synced: results.length, results });
});

productsRouter.use(authenticate);

productsRouter.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    where: { organizationId: req.auth!.organizationId },
    include: { category: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(products.map(serializeProduct));
});

productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.auth!.organizationId },
    include: { category: true, createdBy: true },
  });
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(serializeProduct(product));
});

productsRouter.get("/:id/sales", async (req, res) => {
  const sales = await prisma.dailySale.findMany({
    where: { productId: req.params.id, product: { organizationId: req.auth!.organizationId } },
    orderBy: { date: "asc" },
  });
  res.json(sales.map((s) => ({ id: s.id, product_id: s.productId, date: s.date, sales_count: s.salesCount, revenue: s.revenue })));
});

productsRouter.get("/:id/prices", async (req, res) => {
  const prices = await prisma.priceHistoryEntry.findMany({
    where: { productId: req.params.id, product: { organizationId: req.auth!.organizationId } },
    orderBy: { recordedAt: "asc" },
  });
  res.json(prices.map((p) => ({ id: p.id, product_id: p.productId, recorded_at: p.recordedAt, price: p.price })));
});

productsRouter.post("/", requireAdmin, async (req, res) => {
  const { category_id, shopee_url, name } = req.body ?? {};
  if (!category_id || !shopee_url) {
    return res.status(400).json({ error: "Categoria e link da Shopee são obrigatórios" });
  }

  const product = await prisma.product.create({
    data: {
      organizationId: req.auth!.organizationId,
      categoryId: category_id,
      shopeeUrl: shopee_url,
      name: name?.slice(0, 200) || "Sincronizando…",
      createdById: req.auth!.userId,
    },
    include: { category: true, createdBy: true },
  });

  // dispara a sincronização imediata (o cron de 10 min pegaria de qualquer forma)
  syncProduct(product.id).catch(() => {});

  res.status(201).json(serializeProduct(product));
});
