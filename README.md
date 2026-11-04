# 📝 Modern Blog Platform

<p align="center">
  <strong>Next.js 15 App Router üzerine kurulu, modern, ölçeklenebilir ve production-ready monolitik blog platformu.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## 📖 Genel Bakış

Modern Blog Platform, **monolitik bir Next.js 15 App Router uygulaması** olarak tasarlanmıştır.
Sunucu bileşenleri (Server Components) ve Server Actions ile veri erişimi, iş mantığı ve UI aynı
uygulama içinde, katmanlar arası net bir sorumluluk ayrımıyla yönetilir — ayrı bir Express.js API
katmanına ihtiyaç duyulmaz.

> Bu mimari daha önce ayrık (decoupled) bir Next.js + Express.js yapısı olarak planlanmıştı.
> Sprint 2.1 ile birlikte, Auth.js v5 ve Server Actions'ın sunduğu doğrudan entegrasyon
> avantajları nedeniyle **monolitik Next.js mimarisine** geçilmiştir. Ayrıntılı gerekçe ve
> tüm geliştirme standartları için bkz. [docs/project-rules.md](docs/project-rules.md).

---

## 🏗 Mimari

```
                Browser
                   │
                   ▼
      Next.js 15 (App Router)
   ┌───────────────────────────┐
   │ Server Components / Pages │
   │ Server Actions (mutation) │
   │ Route Handlers (webhook)  │
   └───────────────────────────┘
                   │
              Prisma ORM
                   │
                   ▼
            PostgreSQL
```

---

## 📁 Proje Yapısı

```
blog/
├── app/                    # Next.js App Router — yalnızca routing, layout, sayfa kompozisyonu
│   ├── (auth)/              # Route group: login, register (planlanan)
│   ├── (dashboard)/         # Route group: giriş gerektiren sayfalar (planlanan)
│   ├── api/                  # Yalnızca dış entegrasyon/webhook route handler'ları
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── features/                # Feature-based iş modülleri (components, actions, services, repositories, schemas, hooks, types)
├── shared/                   # Feature-agnostic, tekrar kullanılabilir components/hooks/utils
├── components/ui/            # shadcn/ui CLI çıktısı (elle düzenlenmez)
│
├── lib/                      # Altyapı: Prisma client, env validasyonu, shadcn `cn()` yardımcısı
├── providers/                 # React context provider kompozisyonu (tema, vb.)
├── types/                      # Proje geneli paylaşılan tip tanımları
├── config/                     # Statik/ortam bazlı app konfigürasyonu (site metadata)
├── constants/                  # Değişmeyen kod sabitleri (route path'leri, vb.)
├── hooks/                       # Framework-agnostic jenerik React hook'ları
├── utils/                        # Sıfır bağımlılıklı jenerik yardımcı fonksiyonlar
│
├── prisma/                        # Veritabanı şeması ve migration'lar
├── docker/                         # Postgres/Redis local geliştirme konfigürasyonu
├── docs/                            # Proje kuralları ve mimari dokümantasyon
└── docker-compose.yml
```

Her klasörün tam sorumluluğu ve sınırları için bkz. [docs/project-rules.md §2](docs/project-rules.md#2-klasör-yapısı-kuralları).

---

## 🛠 Tech Stack

- **Next.js 15** (App Router, Server Actions)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **shadcn/ui**
- **Prisma ORM** + **PostgreSQL**
- **Auth.js v5** *(planlanan — bkz. yol haritası)*
- **Zod** (paylaşılan frontend/backend validasyonu)
- **React Hook Form**

---

## 🔒 Güvenlik

Uygulanacak güvenlik standartları (authentication sprintinde devreye girecek) için bkz.
[docs/project-rules.md §11](docs/project-rules.md#11-güvenlik-kuralları): Auth.js tabanlı
authentication, RBAC, Zod input validation, XSS/CSRF/SQL Injection koruması, rate limiting,
güvenli cookie/env/secret yönetimi.

---

## ⚙️ Başlarken

### Gereksinimler

- Node.js 22+
- Docker (PostgreSQL için)

### Kurulum

```bash
git clone <repo-url>
cd blog

npm install

cp .env.example .env
# .env dosyasındaki DATABASE_URL ve NEXT_PUBLIC_APP_URL değerlerini kontrol edin

docker compose up -d     # PostgreSQL ve Redis'i ayağa kaldırır

npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır.

### Kullanılabilir Script'ler

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Production build alır |
| `npm run start` | Production build'i çalıştırır |
| `npm run lint` | ESLint kontrolü |
| `npm run format` | Prettier ile formatlar |
| `npm run typecheck` | TypeScript tip kontrolü (`tsc --noEmit`) |
| `npm run prisma:generate` | Prisma Client üretir |
| `npm run prisma:migrate` | Migration oluşturur ve uygular (dev) |
| `npm run prisma:studio` | Prisma Studio'yu açar |

---

## 🗺 Yol Haritası

- [x] Proje planlaması
- [x] Proje iskeleti (Sprint 2.1 — Foundation)
- [ ] Veritabanı modelleme (Post, User, Comment, Category, Tag)
- [ ] Authentication (Auth.js v5)
- [ ] Blog CRUD
- [ ] Zengin metin editörü
- [ ] Görsel yükleme
- [ ] İç içe yorumlar
- [ ] Beğeniler ve bildirimler
- [ ] Kategoriler ve arama
- [ ] Admin paneli
- [ ] Test kapsamı
- [ ] CI/CD

---

## 📚 Dokümantasyon

- [docs/project-rules.md](docs/project-rules.md) — Bağlayıcı geliştirme standartları (mimari,
  naming convention, TypeScript/React/Next.js kuralları, güvenlik, test, Definition of
  Ready/Done ve daha fazlası)

---

## 🤝 Katkıda Bulunma

1. Depoyu fork'layın
2. Bir feature dalı oluşturun: `git checkout -b feature/kisa-aciklama`
3. Değişikliklerinizi commit'leyin: `git commit -m "feat: yeni özellik eklendi"`
4. Dalınızı push'layın: `git push origin feature/kisa-aciklama`
5. Pull Request açın

Her PR, [docs/project-rules.md §14](docs/project-rules.md#14-git-kuralları) standartlarına
uygun olmalıdır.

---

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır.
