# providers/

React context provider'larının bileşim (composition) noktası. `app/layout.tsx`, tek tek
provider import etmek yerine yalnızca [`AppProviders`](./app-providers.tsx)'ı kullanır.

## İçerik

| Dosya | Amaç |
|---|---|
| `theme-provider.tsx` | `next-themes` sarmalayıcısı — dark/light/system tema yönetimi |
| `app-providers.tsx` | Tüm provider'ların tek composition root'u |

## Kural

Yeni bir global client state/context ihtiyacı doğduğunda (örn. auth session provider,
TanStack Query client provider), yeni provider bu klasöre eklenir ve `app-providers.tsx`
içindeki kompozisyona dahil edilir. `app/layout.tsx` bu değişikliklerden etkilenmez.
