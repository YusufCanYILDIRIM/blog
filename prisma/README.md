# prisma/

| Dosya/Klasör | Amaç | Durum |
|---|---|---|
| `schema.prisma` | Datasource (PostgreSQL) + client generator + modeller | Hazır — `User`, `Post`, `Comment`, `Category`, `Tag`, `PostTag` (Sprint 2.2) |
| `migrations/` | `prisma migrate dev` ile üretilen migration geçmişi | `20260721082519_init_blog_schema` uygulandı |
| `seed.ts` | Geliştirme ortamı için idempotent (`upsert` bazlı) veri üretimi | Henüz yazılmadı |

## Model özeti (Sprint 2.2)

- **User** → Post (1-N), Comment (1-N). `email` unique, `role` (`USER`/`ADMIN`).
- **Post** → Comment (1-N), Category (N-1), Tag (N-N via `PostTag`). `slug` unique.
- **Comment** → User (N-1), Post (N-1).
- **Category** → Post (1-N). `name`/`slug` unique.
- **Tag** ↔ Post (N-N via `PostTag`). `name`/`slug` unique.
- **PostTag** — Post↔Tag için açık (explicit) join modeli; `(postId, tagId)` üzerinde unique kısıt.

Tüm modellerde UUID (`@db.Uuid`) primary key, `createdAt`/`updatedAt` audit alanları var; **soft
delete kullanılmıyor** (proje kararı — silme işlemleri kalıcı). Her ilişkide `onDelete` açıkça
belirtildi (bkz. `schema.prisma` yorumları).

## Kullanım

```bash
npm run prisma:generate   # @prisma/client'ı schema'dan üretir
npm run prisma:migrate    # Yeni migration oluşturur ve uygular (dev)
npm run prisma:studio     # Veritabanını tarayıcıda incelemek için Prisma Studio açar
```

Migration'lar elle düzenlenmez; production'a `prisma migrate deploy` ile uygulanır (bkz.
[docs/project-rules.md](../docs/project-rules.md) §8.2).
