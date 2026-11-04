import { z } from "zod";

/**
 * Ortam değişkeni şemaları ve saf doğrulama fonksiyonları.
 *
 * Bu modül `server-only` değildir; yalnızca şema ve fonksiyon tanımlar, değer
 * okumaz. Gerçek değerler sunucuda `lib/env.ts`, istemciye açık olanlar
 * `config/public-env.ts` üzerinden okunur. Ayrım sayesinde birim testleri
 * `process.env`'e dokunmadan çalışır.
 */

const POSTGRES_PROTOCOLS = ["postgres:", "postgresql:"] as const;

export const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string({ required_error: "zorunlu" })
    .url("geçerli bir URL olmalı")
    .refine(
      (value) => POSTGRES_PROTOCOLS.some((protocol) => value.startsWith(protocol)),
      "postgres:// veya postgresql:// ile başlamalı",
    ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string({ required_error: "zorunlu" }).url("geçerli bir URL olmalı"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

const DEV_APP_URL = "http://localhost:3000";

export class EnvValidationError extends Error {
  override readonly name = "EnvValidationError";
}

/**
 * Zod hatasını, değerleri İÇERMEYEN okunur bir mesaja çevirir. Mesaj loglara
 * düşebileceği için yalnızca değişken adı ve kural yazılır; secret içerebilecek
 * girdi değeri asla eklenmez.
 */
function toEnvError(scope: string, error: z.ZodError): EnvValidationError {
  const lines = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
  return new EnvValidationError(
    `Geçersiz ${scope} ortam değişkenleri:\n${lines.join("\n")}\n` +
      "Örnek değerler için .env.example dosyasına bakın.",
  );
}

export function parseServerEnv(input: Readonly<Record<string, string | undefined>>): ServerEnv {
  const result = serverEnvSchema.safeParse(input);
  if (!result.success) throw toEnvError("sunucu", result.error);
  return result.data;
}

/**
 * Public yapılandırma. Production'da `NEXT_PUBLIC_APP_URL` zorunludur
 * (canonical, sitemap ve OAuth dönüş adresleri buna dayanır). Geliştirme ve
 * testte tanımlı değilse yerel adres kullanılır.
 */
export function parsePublicEnv(input: {
  readonly NEXT_PUBLIC_APP_URL: string | undefined;
  readonly NODE_ENV: string | undefined;
}): PublicEnv {
  const isProduction = input.NODE_ENV === "production";
  const candidate = {
    NEXT_PUBLIC_APP_URL: input.NEXT_PUBLIC_APP_URL || (isProduction ? undefined : DEV_APP_URL),
  };
  const result = publicEnvSchema.safeParse(candidate);
  if (!result.success) throw toEnvError("public", result.error);
  return result.data;
}
