import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Entegrasyon testleri: migration'ları uygulanmış, İZOLE bir PostgreSQL test
 * veritabanı gerektirir (`TEST_DATABASE_URL`, veritabanı adı `_test` ile biter).
 * Testler tabloları temizlediği için tek iş parçacığında, sırayla çalışır.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
