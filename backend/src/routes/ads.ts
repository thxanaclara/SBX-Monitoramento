import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { generateAdVariations } from "../services/adGenerator.js";

export const adsRouter = Router();
adsRouter.use(authenticate);

function serializeAd(ad: any) {
  return {
    id: ad.id,
    organization_id: ad.organizationId,
    product_id: ad.productId,
    created_by: ad.createdById,
    created_by_name: ad.createdBy?.fullName ?? null,
    title: ad.title,
    body: ad.body,
    image_url: ad.imageUrl,
    variation_label: ad.variationLabel,
    created_at: ad.createdAt,
  };
}

// Qualquer usuário autenticado (admin OU staff) pode gerar e ver anúncios —
// só o cadastro de produtos é restrito a admin.
adsRouter.get("/", async (req, res) => {
  const productId = req.query.product_id as string | undefined;
  const ads = await prisma.adGeneration.findMany({
    where: { organizationId: req.auth!.organizationId, ...(productId ? { productId } : {}) },
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(ads.map(serializeAd));
});

adsRouter.post("/generate", async (req, res) => {
  const { product_id } = req.body ?? {};
  if (!product_id) return res.status(400).json({ error: "product_id é obrigatório" });

  const product = await prisma.product.findFirst({
    where: { id: product_id, organizationId: req.auth!.organizationId },
  });
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const variations = await generateAdVariations(product.name, product.currentPrice);

  const created = await Promise.all(
    variations.map((v) =>
      prisma.adGeneration.create({
        data: {
          organizationId: req.auth!.organizationId,
          productId: product.id,
          createdById: req.auth!.userId,
          variationLabel: v.variation_label,
          title: v.title,
          body: v.body,
          imageUrl: v.imageUrl,
        },
        include: { createdBy: true },
      })
    )
  );

  res.status(201).json({ variations: created.map(serializeAd) });
});
