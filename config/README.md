# config/

Uygulamanın statik, ortam bazlı olmayan (veya yalnızca `process.env`'den okuyan) yapılandırma
objelerini barındırır: site metadata'sı, navigasyon menüleri, sabit uygulama ayarları.

## Kapsam

- **İçerir:** `site.ts` gibi salt-veri (plain object) konfigürasyon dosyaları.
- **İçermez:** İş mantığı, Prisma/DB erişimi, secret değerler (bkz. [`lib/env.ts`](../lib/env.ts)
  — gerçek ortam değişkeni doğrulaması orada yapılır, burada yalnızca *okunur*).

## Farkı — `constants/` ile

`config/` **yapılandırılabilir, ortam/deploy'a göre değişebilen** değerleri (site adı, URL); `constants/`
ise **hiçbir koşulda değişmeyen, kod içi sabitleri** (route path'leri, enum benzeri union'lar) tutar.
