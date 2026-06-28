import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { hashPassword, generateTempPassword } from "../lib/password.js";

export const usersRouter = Router();
usersRouter.use(authenticate, requireAdmin);

function serializeUser(u: any) {
  return { id: u.id, full_name: u.fullName, email: u.email, role: u.role, created_at: u.createdAt };
}

usersRouter.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { organizationId: req.auth!.organizationId },
    orderBy: { createdAt: "desc" },
  });
  res.json(users.map(serializeUser));
});

// Cadastra um novo admin ou staff, sempre na MESMA organização de quem está
// cadastrando — nunca cria usuário fora da própria conta.
usersRouter.post("/", async (req, res) => {
  const { full_name, email, role } = req.body ?? {};
  if (!full_name || !email || !["admin", "staff"].includes(role)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Já existe um usuário com esse e-mail" });

  const tempPassword = generateTempPassword();
  const user = await prisma.user.create({
    data: {
      organizationId: req.auth!.organizationId,
      fullName: full_name,
      email,
      role,
      passwordHash: await hashPassword(tempPassword),
    },
  });

  // TODO: enviar e-mail de boas-vindas com a senha temporária (ex.: via
  // Resend, SendGrid ou outro provedor de e-mail transacional).

  res.status(201).json({ ...serializeUser(user), temp_password: tempPassword });
});
