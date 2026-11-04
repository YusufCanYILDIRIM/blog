# ADR 0001 — Kimlik doğrulama: Better Auth

- **Durum:** Kabul edildi (4 Kasım 2026)
- **Kapsam:** Aşama 1'de karar ve veri modeli. Çalışan giriş akışı Aşama 3'te kurulacak.

## Bağlam

Sitede yalnızca iki yazar oturum açar. Ziyaretçi hesabı ve açık kayıt yoktur.
Gereksinimler:

1. Next.js 16 ve Prisma 7 ile uyum
2. GitHub ile giriş; izin listesi değişmeyen sağlayıcı kimliğine göre çalışır
3. Veritabanı oturumu; pasifleştirilen hesap yazma yetkisini kaybeder
4. İzin dışı kimlik, kullanıcı veya oturum kaydı oluşmadan reddedilir
5. Aktif bakım ve makul karmaşıklık

## Değerlendirme

| Ölçüt | Auth.js (`next-auth` v5) | Better Auth 1.7 |
|---|---|---|
| Sürüm uyumu | `5.0.0-beta.32` (peer: `next ^16`). `@auth/prisma-adapter` peer aralığı `>=6`; Prisma 7'nin özel generator çıktısıyla uyumu ayrıca denenmeli | Peer aralığı `next ^16`, `prisma ^7`, `@prisma/client ^7`'yi açıkça kapsıyor |
| GitHub + değişmez kimlik | `signIn` callback'inde `account.providerAccountId` | `user.validateUserInfo` içinde `source.oauth.profile.id` |
| Kayıt öncesi red | `signIn` callback'i `false` döner, adapter yazmadan önce durur | `validateUserInfo` yeni kullanıcıda (`create-user`) veritabanına yazmadan önce, transaction içinde çalışır. Geri dönen kullanıcıda (`sign-in`) da oturumdan önce her girişte çalışır. Callback hata fırlatırsa red uygulanır (fail closed). Kaynak: `better-auth/dist/oauth2/link-account.mjs`, `utils/validate-user-info.mjs` |
| DB oturumu | Adapter + `strategy: "database"` | Varsayılan olarak DB oturumu |
| E-posta ile hesap birleşmesi | Varsayılan kapalı | Varsayılan **açık**; `accountLinking.enabled: false` ile kapatılmalı |
| Bakım | Eylül 2025'ten beri Better Auth ekibinin yönetiminde, güvenlik yaması modunda. v5 hiç stabil sürüme ulaşmadı; ekip yeni projeleri Better Auth'a yönlendiriyor | Aktif geliştiriliyor (npm'de son güncelleme Kasım 2026) |

Karar yalnızca "beta" etiketine dayanmıyor. Teknik olarak Auth.js'in `signIn` callback'i de gereksinimi karşılıyor.
Belirleyici olanlar şunlar:

- Projenin yeni olması
- Auth.js'in güvenlik yaması moduna geçmesi
- Better Auth'un hedef sürümlerle açık uyumu
- Allowlist'in her girişte yeniden değerlendirilmesi

## Karar

**Better Auth 1.7.17** kullanılır. `next-auth` bağımlılığı kaldırıldı.

### Aşama 3'te uygulanacak yapılandırma

```ts
betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  advanced: { database: { generateId: "uuid" } }, // şemadaki @db.Uuid id'ler
  socialProviders: { github: { clientId, clientSecret } },
  account: { accountLinking: { enabled: false } }, // e-posta ile otomatik birleşme yok
  user: {
    // Hem yeni kullanıcıda hem her girişte çalışır.
    validateUserInfo: ({ source }) => {
      const id = source.oauth?.providerId === "github" ? String(source.oauth.profile?.id ?? "") : "";
      if (!AUTHOR_GITHUB_IDS.has(id)) return { error: "not_allowed", errorDescription: "Bu hesap yetkili değil" };
    },
  },
  // + oturum oluşturma ve oturum okuma noktalarında User.active kontrolü
});
```

- **Doğrulanmayan noktalar (Aşama 3'te test edilmeli):**
  - `validateUserInfo`'nun parametre tipleri
  - `profile.id` alanının GitHub sağlayıcısında sayısal kimlik olarak geldiği
- **İzin listesi:** `AUTHOR_GITHUB_IDS` ortam değişkeninde, virgülle ayrılmış sayısal GitHub kullanıcı kimlikleri olarak tutulur.
  - Kimlik `https://api.github.com/users/<kullanıcı-adı>` yanıtındaki `id` alanıdır.
  - Kullanıcı adı değişse de bu değer değişmez.
  - İkinci yazarın kimliği **henüz alınmadı**; uydurulmaz, kurulumda kendisi sağlar.
- **Pasif hesap:** Her mutasyon kontrolü (`requireAuthor`) `User.active` değerini veritabanından okur. Oturum çerezi tek başına yetki kaynağı değildir.
- **Gerekmeyenler:**
  - `Account.password` alanı Better Auth şeması gereği vardır, boş kalır.
  - Parola ve e-posta doğrulama akışı yoktur.

## Veri modeli sonuçları

- Tablolar: `users`, `sessions`, `accounts`, `verifications`. Alanlar, better-auth 1.7 `getAuthTables` tanımıyla eşleşir.
- `accounts (providerId, accountId)` benzersizdir: bir GitHub hesabı yalnızca bir kullanıcıya bağlanır.
- `users.passwordHash` ve `users.role` kaldırıldı (OAuth-only; iki yazar eşit yetkilidir, sahiplik kaynak bazında kontrol edilir).
- İçerik ilişkileri (`profiles`, `posts`, `comments` → `users`) `ON DELETE RESTRICT` kullanır. Yalnızca `sessions` ve `accounts` cascade ile silinir.

## Kaynaklar

- [Auth.js is now part of Better Auth](https://www.better-auth.com/blog/authjs-joins-better-auth) · [nextauthjs/next-auth#13252](https://github.com/nextauthjs/next-auth/discussions/13252)
- [Better Auth güvenlik güncellemesi, Temmuz 2026](https://better-auth.com/blog/security-update-july-2026)
- [Better Auth — OAuth (`validateUserInfo`)](https://www.better-auth.com/docs/concepts/oauth) · [Users & Accounts (account linking)](https://www.better-auth.com/docs/concepts/users-accounts)
