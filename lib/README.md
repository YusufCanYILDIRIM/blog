# lib/

Altyapısal singleton'lar ve 3. parti entegrasyon konfigürasyonları. Bu klasördeki dosyalar
iş mantığı içermez; yalnızca bir kütüphaneyi/servisi uygulamanın geri kalanına kullanıma
hazır şekilde sunar.

| Dosya | Amaç |
|---|---|
| `prisma.ts` | `PrismaClient` singleton'ı (hot-reload'da bağlantı sızıntısını önler) |
| `env.ts` | Zod ile doğrulanmış, tip güvenli ortam değişkenleri |
| `utils.ts` | shadcn/ui'nin `cn()` class-merge yardımcısı (sabit konvansiyon, taşınmaz) |

> `auth.ts` (Auth.js v5 konfigürasyonu) bu sprint kapsamında **eklenmemiştir**; ayrı bir
> authentication sprintinde bu klasöre eklenecektir.
