# constants/

Kod içinde hiçbir koşulda değişmeyen, uygulama geneli sabitler: route path'leri, whitelist
edilmiş sıralama/filtre alanları, sayfalama varsayılanları.

## Farkı — `config/` ile

Bkz. [config/README.md](../config/README.md). Özetle: `config/` ortama göre değişebilen
değerleri, `constants/` asla değişmeyen kod sabitlerini tutar.

## Farkı — feature-içi sabitler ile

Yalnızca bir feature'a özel bir sabit (örn. `MAX_ACTIVE_PROJECTS`), o feature'ın kendi
`services/` veya `schemas/` dosyasında tanımlı kalır; buraya taşınmaz.
