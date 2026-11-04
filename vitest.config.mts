import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Birim testleri: veritabanı veya ağ gerektirmez. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "tests/integration/**"],
  },
});
