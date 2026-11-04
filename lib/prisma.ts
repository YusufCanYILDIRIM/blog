import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";
import { env } from "@/lib/env";

/**
 * Prisma 7 istemcisi, PostgreSQL'e `@prisma/adapter-pg` (node-postgres) sürücüsü
 * üzerinden bağlanır.
 *
 * Next.js dev modunda her hot-reload'da yeni bir istemci (ve yeni bir bağlantı
 * havuzu) oluşmasını önlemek için örnek `globalThis` üzerinde saklanır.
 * `server-only` importu, bu modülün yanlışlıkla bir Client Component paketine
 * girmesini build aşamasında engeller.
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
