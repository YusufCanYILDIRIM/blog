import { PrismaClient } from "@prisma/client";

/**
 * Next.js dev modunda her hot-reload'da yeni bir `PrismaClient` örneği
 * oluşturulmasını (ve bağlantı havuzunun tükenmesini) önlemek için
 * global singleton pattern'i kullanılır.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
