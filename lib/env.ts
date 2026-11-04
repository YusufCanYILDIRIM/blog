import "server-only";

import { parseServerEnv } from "@/lib/env.schema";

/**
 * Doğrulanmış sunucu ortam değişkenleri. Yalnızca sunucuda import edilebilir;
 * bir Client Component bu modülü içeri alırsa build hata verir. Eksik veya
 * hatalı değişken, modül ilk yüklendiğinde değer sızdırmayan bir hatayla
 * uygulamayı durdurur.
 *
 * İstemcinin görebileceği değerler için `config/public-env.ts` kullanılır.
 * Yeni bir entegrasyon (Better Auth, medya deposu) bağlandığında değişkenleri
 * `lib/env.schema.ts` içindeki şemaya eklenir.
 */
export const env = parseServerEnv(process.env);
