# shared/utils/

Birden fazla feature tarafından kullanılan saf (side-effect'siz) yardımcı fonksiyonlar
(örn. `slugify`, `formatDate`).

| Konum | Kapsam |
|---|---|
| `lib/utils.ts` | Yalnızca shadcn `cn()` yardımcısı |
| `shared/utils/` | Paylaşılan saf yardımcılar |
| `features/*/` | Tek bir feature'a özel yardımcılar |

> Kökteki ayrı `utils/` klasörü kaldırıldı; paylaşılan yardımcılar burada tutulur.
