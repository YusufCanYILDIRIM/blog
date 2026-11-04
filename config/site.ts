import { publicEnv } from "@/config/public-env";

/**
 * Uygulama genelinde kullanılan statik site metadata'sı. `app/layout.tsx`
 * içindeki `metadata` burayı referans alır.
 *
 * Kişi adları ve bağlantılar gerçek içerik geldiğinde (Aşama 2) veritabanındaki
 * profillerden okunacak; burada uydurma değer tutulmaz.
 */
export const siteConfig = {
  name: "Portfolyo ve Blog",
  description: "İki geliştiricinin projeleri, portfolyoları ve blog yazıları.",
  url: publicEnv.NEXT_PUBLIC_APP_URL,
} as const;

export type SiteConfig = typeof siteConfig;
