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
- Prisma 7, PostgreSQL'de her migration'ı tek transaction içinde uygular: hata veren bir
  migration kısmi şema değişikliği bırakmaz (doğrulandı, bkz. aşağıdaki kurtarma bölümü).
- `migrate deploy`, daha yeni bir migration'ı uygulanmış bir veritabanına sonradan eklenen eski
  damgalı bir migration'ı da uygular. Bu yüzden araya eklenen migration'lar, şema zaten ileri
  gitmişse hiçbir şey yapmayacak şekilde koşullu yazılır.

## `users.bio` → `profiles.bio` geçişi ve kurtarma

Biyografi `users` tablosundan `profiles` tablosuna taşındı. Geçiş üç migration'dan oluşur:

| Migration | Ne yapar |
|---|---|
| `20261104115000_stash_user_bios` | Dolu `users.bio` değerlerini `legacy_user_bios` tablosuna kopyalar, `users.bio`'yu boşaltır. `users.bio` sütunu yoksa hiçbir şey yapmaz |
| `20261104120000_portfolio_auth_foundation` | Yeni şema. En baştaki koruma, `users.bio` hâlâ doluysa hiçbir şeyi değiştirmeden durur |
| `20261104130000_restore_user_bios` | Her biyografiyi aynı kullanıcının profiline yazar (profil yoksa `kisi-<userId>` slug'ıyla oluşturur; dolu bir profil biyografisini ezmez), sonra `legacy_user_bios`'u siler |

Normal durumda `npm run prisma:deploy` üçünü sırayla uygular; elle işlem gerekmez. Adımlar
tekrar çalıştırmaya dayanıklıdır: yarıda kesilen bir deploy aynı komutla sürdürülür, mükerrer
profil oluşmaz.

### Koruma devreye girmiş bir veritabanı

`115000` eklenmeden önceki sürümle deploy yapılmış ve biyografi doluysa:

```
Error: P3018 ... Migration name: 20261104120000_portfolio_auth_foundation
ERROR: users.bio dolu kayıt içeriyor; önce profiles tablosuna taşıyın.
```

Bu mesajdaki "profiles tablosuna taşıyın" talimatı **uygulanamaz**, çünkü `profiles` tablosu o
migration içinde oluşturulur. Tabloyu elle oluşturmak migration'ı `relation "profiles" already
exists` hatasıyla yeniden bozar. Bunun yerine şunları yapın:

1. Veritabanının yedeğini alın.
2. `DATABASE_URL` hedef veritabanını gösterecek şekilde çalıştırın:
   ```bash
   npm run prisma:recover-bio-guard
   ```
   Script yalnızca o migration için tek bir başarısız kayıt varsa **ve** şema hiç değişmemişse
   (`users.bio` ve `posts.published` duruyor; `post_status`, `profiles`, `sessions` yok)
   `prisma migrate resolve --rolled-back` çalıştırır. Aksi halde hiçbir şeyi değiştirmeden
   nedenini yazar ve sıfır olmayan kodla çıkar. Veriye dokunmaz.
3. `npm run prisma:deploy` komutunu çalıştırın. Biyografiler profillere taşınır.

Bu akış `tests/integration/bio-migration-recovery.test.ts` ile gerçek PostgreSQL ve gerçek
Prisma CLI üzerinde test edilir.
