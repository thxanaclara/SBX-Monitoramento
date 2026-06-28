import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

export const categoriesRouter = Router();
categoriesRouter.use(authenticate);

categoriesRouter.get("/", async (req, res) => {
  const categories = await prisma.productCategory.findMany({
    where: { organizationId: req.auth!.organizationId },
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

categoriesRouter.post("/", requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Informe o nome da categoria" });

  const category = await prisma.productCategory.create({
    data: { name: name.trim(), organizationId: req.auth!.organizationId },
  });
  res.status(201).json(category);
});
