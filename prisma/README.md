# prisma/

| Dosya/Klasör | Amaç |
|---|---|
| `schema.prisma` | PostgreSQL datasource, `prisma-client` generator (çıktı: `prisma/generated/`, git'te yok) ve modeller |
| `migrations/` | Commit edilmiş migration geçmişi |
| `generated/` | `prisma generate` çıktısı; `npm install` sırasında `postinstall` ile üretilir |

Bağlantı adresi `prisma.config.ts` içinden (`DATABASE_URL`) okunur. Çalışma zamanında istemci
`lib/prisma.ts` üzerinden `@prisma/adapter-pg` sürücüsüyle bağlanır.

## Modeller

- **Kimlik (Better Auth):** `User` (`active` ile pasifleştirme), `Session`, `Account`
  (`providerId + accountId` benzersiz), `Verification`. Bkz.
  [ADR 0001](../docs/adr/0001-auth-better-auth.md).
- **Portfolyo:** `Profile` — `/kisiler/[slug]` için public kimlik; kullanıcı başına bir tane.
- **Blog:** `Post` (`status`: `DRAFT`/`PUBLISHED`/`ARCHIVED`), `Category`, `Tag`, `PostTag`.
- **Comment:** v1'de kullanılmıyor; mevcut veriyi korumak için tablo kaldırılmadı.

### Silme kuralları

- İçerik → kullanıcı ilişkileri `onDelete: Restrict`: içeriği olan kullanıcı silinemez,
  hesap `active = false` ile pasifleştirilir.
- Yalnızca `Session` ve `Account` kullanıcıyla birlikte silinir.
- Kategori silinirse yazı kategorisiz kalır (`SetNull`).

### Public görünürlük

Bir yazı yalnızca `status = PUBLISHED` ve `publishedAt <= now()` ise public kanallarda görünür.

## Komutlar

```bash
npm run prisma:generate   # İstemciyi şemadan üretir
npm run prisma:migrate    # (yalnızca geliştirme DB'si) yeni migration oluşturur ve uygular
npm run prisma:deploy     # Commit edilmiş migration'ları uygular (CI, test, staging, production)
npm run prisma:studio     # Prisma Studio
```

- Uygulanmış bir migration dosyası **değiştirilmez**; düzeltme yeni migration ile yapılır.
- Veri dönüştüren bir değişiklikte migration `--create-only` ile üretilir, SQL'i incelenir ve
  veri korunacak şekilde düzenlenir (örnek: `20261104120000_portfolio_auth_foundation`).
- Veri içeren bir veritabanında `migrate reset` veya `db push` kullanılmaz.
- Migration dosyaları LF satır sonuyla tutulur (`.gitattributes`); Prisma checksum'ı buna bağlıdır.
