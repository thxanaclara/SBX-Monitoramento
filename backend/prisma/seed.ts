// Seed de desenvolvimento — cria uma organização de teste e os dois usuários
// pedidos, para você conseguir acessar e navegar pelo sistema por dentro.
//
// Em produção, os usuários reais são criados:
//  - automaticamente, via webhook da plataforma de pagamento (POST /api/webhooks/subscription)
//  - manualmente pelo admin, na tela "Usuários" (POST /api/users)
//
// Execute com: npm run seed

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

async function main() {
  const organization = await prisma.organization.create({
    data: { name: "SBX Monitoramento (conta de teste)", plan: "pro", subscriptionStatus: "active" },
  });

  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "Ana",
      email: "ana@sbxmonitoramento.com.br",
      role: "admin",
      passwordHash: await hashPassword("Asbx0666!"),
    },
  });

  await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: "Vitor",
      email: "vitor@sbxmonitoramento.com.br",
      role: "staff",
      passwordHash: await hashPassword("staff"),
    },
  });

  const category = await prisma.productCategory.create({
    data: { organizationId: organization.id, name: "Casa e cozinha" },
  });

  const today = startOfDay(new Date());
  const postedAt = new Date();
  postedAt.setDate(postedAt.getDate() - 70);

  const product = await prisma.product.create({
    data: {
      organizationId: organization.id,
      categoryId: category.id,
      shopeeUrl: "https://shopee.com.br/exemplo-organizador-de-cabos-i.123456789",
      name: "Organizador de cabos magnético (exemplo)",
      currentPrice: 34.9,
      createdById: admin.id,
      postedOnShopeeAt: postedAt,
      lastSyncedAt: new Date(),
    },
  });

  // ~70 dias de histórico de vendas, só para os gráficos virem populados
  for (let i = 0; i < 70; i++) {
    const date = startOfDay(new Date(today));
    date.setDate(date.getDate() - (69 - i));
    const baseline = 8 + Math.floor(Math.random() * 14);
    const boost = i > 35 ? 12 : 0;
    await prisma.dailySale.create({
      data: { productId: product.id, date, salesCount: baseline + boost },
    });
  }

  await prisma.priceHistoryEntry.createMany({
    data: [
      { productId: product.id, recordedAt: new Date(Date.now() - 70 * 86400000), price: 29.9 },
      { productId: product.id, recordedAt: new Date(Date.now() - 40 * 86400000), price: 32.9 },
      { productId: product.id, recordedAt: new Date(Date.now() - 10 * 86400000), price: 34.9 },
    ],
  });

  // recalcula o status de validação com base no histórico recém-criado
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const recentSales = await prisma.dailySale.findMany({ where: { productId: product.id, date: { gte: cutoff } } });
  const avg = recentSales.reduce((sum, s) => sum + s.salesCount, 0) / recentSales.length;
  const status = avg >= 20 ? "validado" : avg >= 10 ? "em_validacao" : "nao_validado";
  await prisma.product.update({ where: { id: product.id }, data: { validationStatus: status } });

  console.log("Seed concluído.");
  console.log("Admin: ana@sbxmonitoramento.com.br / Asbx0666!");
  console.log("Staff: vitor@sbxmonitoramento.com.br / staff");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
