import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, generateTempPassword } from "../lib/password.js";

export const webhooksRouter = Router();

interface ParsedSubscription {
  customerName: string;
  customerEmail: string;
  planName: string;
}

// TODO: adapte este parser ao payload real da plataforma de pagamento que
// você escolher (Stripe, Kiwify, Hotmart etc.) — o formato muda de uma para
// a outra. O restante da rota (criação de organização + admin) não muda.
function parsePayload(body: any): ParsedSubscription {
  return {
    customerName: body.customer?.name ?? body.buyer?.name ?? "Cliente SBX",
    customerEmail: body.customer?.email ?? body.buyer?.email,
    planName: body.plan?.name ?? "pro",
  };
}

webhooksRouter.post("/subscription", async (req, res) => {
  const receivedSecret = req.headers["x-webhook-secret"];
  if (process.env.PAYMENT_WEBHOOK_SECRET && receivedSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Assinatura inválida" });
  }

  const { customerName, customerEmail, planName } = parsePayload(req.body);
  if (!customerEmail) {
    return res.status(400).json({ error: "E-mail do cliente não encontrado no payload" });
  }

  const existing = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (existing) {
    return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
  }

  const organization = await prisma.organization.create({
    data: { name: customerName, plan: planName, subscriptionStatus: "active" },
  });

  const tempPassword = generateTempPassword();
  await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: customerName,
      email: customerEmail,
      role: "admin",
      passwordHash: await hashPassword(tempPassword),
    },
  });

  // TODO: enviar e-mail de boas-vindas com a senha temporária.

  res.json({ ok: true, organization_id: organization.id, temp_password: tempPassword });
});
