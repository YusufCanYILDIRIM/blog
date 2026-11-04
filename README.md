# Portfolyo ve Blog

İki geliştiricinin kişisel portfolyolarını, projelerini ve blog yazılarını tek sitede sunan
**Next.js 16** uygulaması. İçerik, iki yazarın GitHub hesabıyla girdiği bir panelden yönetilecek.

> **Durum:** Aşama 1 — monolit temel. Çalışan sayfalar, giriş akışı ve panel **henüz yok**.
> Ayrıntılar için [Yol haritası](#yol-haritası).

## Mimari

```
Tarayıcı
   │
   ▼
Next.js 16 (App Router)
   ├─ Server Components  → public sayfalar (doğrudan servis katmanını çağırır)
   ├─ Server Actions     → panel mutasyonları
   └─ Route Handlers     → yalnızca auth callback / dış entegrasyon
   │
   ▼
Prisma 7 (@prisma/adapter-pg) → PostgreSQL
```

Tek uygulama, tek veritabanı. Ayrı bir Express API, Redis veya kuyruk yok.

| Konu | Karar |
|---|---|
| Kimlik doğrulama | Better Auth + GitHub OAuth; yalnızca iki izinli hesap ([ADR 0001](docs/adr/0001-auth-better-auth.md)) |
| Arayüz | shadcn **base-nova** + `@base-ui/react`, Tailwind CSS v4, Geist |
| URL'ler | Türkçe: `/kisiler/[slug]`, `/projeler`, `/blog`, `/iletisim`, `/giris`, `/panel` |
| Silme | Hesaplar pasifleştirilir; içerik zincirleme silinmez |

## Teknolojiler

Next.js 16.4 · React 19.3 · TypeScript 5.9 (strict) · Prisma 7.10 · PostgreSQL 16 ·
Better Auth 1.7 · Tailwind CSS 4 · Zod · Vitest 5

## Klasör yapısı

```
app/            Routing, layout, sayfa kompozisyonu (iş mantığı yok)
features/       Özellik modülleri: components, actions, services, repositories, schemas
shared/         Birden fazla feature'ın kullandığı components / hooks / utils
components/ui/  shadcn base-nova bileşenleri (CLI çıktısı, elle düzenlenmez)
config/         Site metadata ve public (istemciye açık) yapılandırma
lib/            Prisma istemcisi, sunucu env doğrulaması (server-only), cn()
prisma/         Şema, migration'lar, üretilen istemci (git'te yok)
tests/          Entegrasyon testleri (gerçek PostgreSQL)
docs/           Proje kuralları ve mimari kararlar (ADR)
```

## Kurulum

Gereksinimler: Node.js 22.12+ (`.nvmrc`), Docker.

```bash
npm ci                      # bağımlılıklar + prisma generate (postinstall)
cp .env.example .env        # değerleri gözden geçirin
docker compose up -d        # PostgreSQL (yalnızca 127.0.0.1)
npm run prisma:deploy       # migration'ları uygular
npm run dev                 # http://localhost:3000
```

Redis varsayılan olarak başlatılmaz; ihtiyaç olursa `docker compose --profile redis up -d`.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` / `build` / `start` | Geliştirme sunucusu / production build / çalıştırma |
| `npm run lint` | ESLint |
| `npm run format:check` / `format` | Prettier kontrolü / düzeltme |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm test` | Birim testleri (Vitest) |
| `npm run test:integration` | Gerçek PostgreSQL'e karşı testler. `TEST_DATABASE_URL` gerekir; veritabanı adı `_test` ile bitmeli, testler tabloları temizler |
| `npm run prisma:migrate` | Yeni migration üretir (yalnızca geliştirme DB'si) |
| `npm run prisma:deploy` | Commit edilmiş migration'ları uygular |

## Git akışı

- `main`: yayın dalı. Doğrudan commit yapılmaz.
- `develop`: entegrasyon dalı. Tüm çalışma dalları buradan açılır ve PR ile buraya döner.
- Dal adları: `feat/...`, `fix/...`, `chore/...`, `docs/...`, `test/...`.
- PR'lar CI (lint, format, typecheck, birim + entegrasyon testleri, migration, build) geçmeden birleştirilmez.
- Commit'ler [Conventional Commits](https://www.conventionalcommits.org/) biçimindedir.

## Yol haritası

- [x] **Aşama 1** — Monolit temel: Next.js 16 + Prisma 7, base-nova tasarım sistemi, auth kararı, veri modeli, env ayrımı, test altyapısı, CI
- [ ] **Aşama 2** — Public portfolyo ve blog sayfaları (örnek veriyle), `Project` modeli
- [ ] **Aşama 3** — GitHub ile giriş (iki hesap), `/panel`, Markdown editör, görsel yükleme
- [ ] **Aşama 4** — SEO (metadata, sitemap, RSS), güvenlik ve uçtan uca testler
- [ ] **Aşama 5** — Staging, yedek/geri yükleme, `develop` birleşmeleri

## Belgeler

- [docs/project-rules.md](docs/project-rules.md) — bağlayıcı geliştirme kuralları
- [docs/adr/](docs/adr/) — mimari kararlar

## Lisans

Henüz belirlenmedi. `LICENSE` dosyası boş; lisans türü ve hak sahipleri proje sahiplerince
kararlaştırılacak.
