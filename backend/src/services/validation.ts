import { prisma } from "../lib/prisma.js";

/**
 * Regra de negócio do SBX Monitoramento — calculada pela média de vendas
 * diárias dos ÚLTIMOS 60 DIAS (2 meses):
 *   >= 20/dia  -> "validado"      (possivelmente validado — verde)
 *   10–19/dia  -> "em_validacao"  (em validação — amarelo)
 *   < 10/dia, ou sem histórico suficiente -> "nao_validado" (vermelho)
 *
 * Chamada sempre que uma venda diária de um produto é criada/atualizada.
 */
export async function recomputeValidationStatus(productId: string): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);

  const sales = await prisma.dailySale.findMany({
    where: { productId, date: { gte: cutoff } },
  });

  let status: "validado" | "em_validacao" | "nao_validado" = "nao_validado";

  if (sales.length > 0) {
    const avg = sales.reduce((sum, s) => sum + s.salesCount, 0) / sales.length;
    if (avg >= 20) status = "validado";
    else if (avg >= 10) status = "em_validacao";
  }

  await prisma.product.update({ where: { id: productId }, data: { validationStatus: status } });
}
