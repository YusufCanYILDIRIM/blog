# features/

Projenin kalbi. Her iş özelliği (posts, comments, categories, users, ...) kendi izole
modülü olarak burada yaşar. Bkz. [docs/project-rules.md](../docs/project-rules.md) §2 için
tam gerekçe ve katman sorumlulukları.

## Bir feature modülünün standart iç yapısı

```
features/{feature-adi}/
├── components/     # Bu özelliğe özel UI (başka feature'da kullanılmaz)
├── actions/         # "use server" Server Actions — ince giriş noktaları
├── services/        # Saf iş mantığı (use-case'ler) — framework importu yok
├── repositories/     # Prisma erişiminin kapsüllendiği tek yer
├── schemas/          # Zod şemaları (bu feature'a özel)
├── hooks/            # Bu feature'a özel client hook'lar
└── types/            # Bu feature'a özel tip tanımları
```

## Kural

Bir feature modülü, başka bir feature modülünün `components/`, `services/` veya
`repositories/` katmanına doğrudan import ile bağımlı olmaz. İki feature'ın ortak ihtiyacı
varsa, o ihtiyaç `shared/` altına taşınır.

> **Bu sprint kapsamında henüz bir feature oluşturulmamıştır** (örn. `features/posts/`).
> İlk feature, veritabanı modellemesi ve iş mantığı netleştiğinde ayrı bir sprintte eklenecektir.
