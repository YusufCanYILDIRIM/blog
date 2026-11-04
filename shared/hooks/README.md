# shared/hooks/

Birden fazla feature tarafından kullanılan client hook'ları (örn. `useDebounce`,
`useMediaQuery`). Tek bir feature'a ait hook o feature'ın `hooks/` klasöründe kalır.

shadcn CLI'nin ürettiği hook'lar da buraya yazılır (`components.json` → `aliases.hooks`).

> Kökteki ayrı `hooks/` klasörü kaldırıldı; tüm paylaşılan hook'lar burada tutulur.
