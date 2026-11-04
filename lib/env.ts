import { z } from "zod";

/**
 * Ortam değişkenleri, uygulama başlarken burada doğrulanır. Eksik/hatalı bir
 * değişken, uygulamayı build/start aşamasında durdurur — runtime'da sessiz
 * hata vermez (bkz. proje kuralları §11.8).
 *
 * NOT: Yalnızca bu sprintte gerçekten kullanılan değişkenler doğrulanır.
 * Auth.js, Cloudinary, Resend gibi entegrasyonlara ait değişkenler, o
 * entegrasyonlar yazılırken bu şemaya eklenecektir.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
