import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { comparePassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { authenticate } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }

  const token = signToken({ userId: user.id, organizationId: user.organizationId, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  });
});

authRouter.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });
});
