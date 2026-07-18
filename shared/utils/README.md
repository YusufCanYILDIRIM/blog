# shared/utils/

Birden fazla feature tarafından paylaşılan, saf (side-effect'siz) yardımcı fonksiyonlar:
`formatCurrency`, `slugify`, `truncateText` gibi — hafif bir uygulama/domain bağlamı taşıyabilir
ama hiçbir feature'a özel değildir.

## Diğer `utils` konumlarıyla farkı

| Konum | Kapsam |
|---|---|
| `lib/utils.ts` | Yalnızca shadcn/ui'nin `cn()` sınıf-birleştirme yardımcısı — sabit bir konvansiyon, dokunulmaz |
| `utils/` (kök) | Sıfır bağımlılıklı, tamamen jenerik saf fonksiyonlar (herhangi bir TS projesinde işe yarar) |
| `shared/utils/` | Bu uygulamaya özgü ama birden fazla feature'da tekrar kullanılan yardımcılar |
| `features/{feature}/*` içi yerel yardımcılar | Yalnızca o feature'a özel, başka yerde kullanılmayan yardımcılar |

> Şu an burada gerçek bir fonksiyon yoktur; ilk cross-feature ihtiyaç doğduğunda eklenecektir.
