/**
 * Uygulama genelinde kullanılan statik site metadata'sı.
 * Ortam bazlı tek değişken (APP_URL) dışında hardcoded string barındırmaz;
 * `app/layout.tsx` içindeki `generateMetadata`/`metadata` burayı referans alır.
 */
export const siteConfig = {
  name: "Modern Blog Platform",
  description:
    "Next.js, Prisma ve PostgreSQL üzerine kurulu modern, ölçeklenebilir blog platformu.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    github: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
