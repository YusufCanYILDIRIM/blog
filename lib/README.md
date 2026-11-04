# lib/

Altyapısal singleton'lar ve 3. parti entegrasyon kurulumu. İş mantığı içermez.

| Dosya | Amaç | Sınır |
|---|---|---|
| `prisma.ts` | Prisma 7 istemcisi (`@prisma/adapter-pg`), hot-reload'a karşı singleton | `server-only` |
| `env.ts` | Doğrulanmış sunucu ortam değişkenleri | `server-only` |
| `env.schema.ts` | Env şemaları ve saf doğrulama fonksiyonları (değer okumaz, test edilebilir) | — |
| `utils.ts` | shadcn `cn()` yardımcısı | — |

İstemcinin görebileceği yapılandırma `config/public-env.ts` içindedir. Better Auth
yapılandırması (`auth.ts`) Aşama 3'te eklenecek.
