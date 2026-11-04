import { defineConfig } from "prisma/config";

/**
 * Prisma CLI yapılandırması (Prisma 7).
 *
 * `.env` dosyası Node'un yerleşik `process.loadEnvFile` API'siyle yüklenir;
 * dosya yoksa (CI, production) ortam değişkenleri doğrudan kullanılır.
 * `DATABASE_URL` yalnızca veritabanına bağlanan komutlarda (migrate, studio)
 * gereklidir; `prisma generate` adres olmadan da çalışır.
 */
try {
  process.loadEnvFile();
} catch {
  // .env yok — ortam değişkenleri dışarıdan sağlanıyor.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
