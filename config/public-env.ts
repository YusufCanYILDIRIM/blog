import { parsePublicEnv } from "@/lib/env.schema";

/**
 * İstemci paketine girebilen, doğrulanmış public yapılandırma.
 *
 * Next.js `NEXT_PUBLIC_*` değerlerini build sırasında koda gömer; bu yüzden
 * her değişken `process.env.NEXT_PUBLIC_...` biçiminde açıkça yazılır
 * (`process.env` nesnesinin tamamı istemciye aktarılamaz). Secret içeren hiçbir
 * değer buraya eklenmez.
 */
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});
