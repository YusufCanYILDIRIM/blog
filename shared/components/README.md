# shared/components/

Birden fazla feature tarafından kullanılan, feature'a özel iş mantığı **içermeyen** genel
amaçlı UI parçaları: `EmptyState`, `PageHeader`, `ConfirmDialog`, liste/tablo sarmalayıcıları.

## shadcn/ui primitive'leri (`components/ui/`) ile farkı

- `components/ui/` → shadcn CLI'nin ürettiği, elle düzenlenmeyen ham primitive'ler (`Button`, `Card`, `Dialog`).
- `shared/components/` → bu primitive'leri kompoze ederek oluşturulan, projeye özgü, tekrar kullanılabilir kalıplar.

## Ne zaman buraya taşınır?

Bir component, ikinci bir feature'da da kullanılması **gerçekten** gerektiğinde buraya
taşınır (bkz. proje kuralları §1.3 — Rule of Three, spekülatif taşıma yapılmaz).
