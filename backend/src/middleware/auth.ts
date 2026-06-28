import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../lib/jwt.js";

// Estende o Request do Express com os dados do usuário autenticado
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.auth = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "admin") {
    return res.status(403).json({ error: "Apenas administradores podem fazer isso" });
  }
  next();
}

// Usado pela rota de sincronização chamada pelo GitHub Actions / cron externo,
// que não tem um usuário logado — autentica por uma chave de API fixa.
export function authenticateSyncKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-sync-api-key"];
  if (!key || key !== process.env.SYNC_API_KEY) {
    return res.status(401).json({ error: "Chave de sincronização inválida" });
  }
  next();
}
