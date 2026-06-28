import { PrismaClient } from "@prisma/client";

// Instância única do client do Prisma, reaproveitada em toda a aplicação.
export const prisma = new PrismaClient();
