# prisma/

| Dosya/Klasör | Amaç | Durum |
|---|---|---|
| `schema.prisma` | Datasource (PostgreSQL) + client generator tanımı | Hazır, model yok |
| `migrations/` | `prisma migrate dev` ile üretilecek migration geçmişi | İlk model eklendiğinde oluşur |
| `seed.ts` | Geliştirme ortamı için idempotent (`upsert` bazlı) veri üretimi | Modeller eklendiğinde yazılacak |

## Neden model yok?

Bu sprint yalnızca proje iskeletini kurar (bkz. Sprint 2.1 kapsamı). Veritabanı modelleme
(`Post`, `User`, `Comment`, ...), ilişkiler, index ve migration üretimi; şema tasarımının
netleşeceği ayrı bir sprintte yapılacaktır.

## Kullanım (modeller eklendikten sonra)

```bash
npm run prisma:generate   # @prisma/client'ı schema'dan üretir
npm run prisma:migrate    # Yeni migration oluşturur ve uygular (dev)
npm run prisma:studio     # Veritabanını tarayıcıda incelemek için Prisma Studio açar
```

Migration'lar elle düzenlenmez; production'a `prisma migrate deploy` ile uygulanır (bkz.
[docs/project-rules.md](../docs/project-rules.md) §8.2).
