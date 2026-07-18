# hooks/ (kök)

Tamamen jenerik, sıfır iş/domain bağlamı taşıyan React hook'ları: `useDebounce`,
`useMediaQuery`, `useLocalStorage`. Bu hook'lar herhangi bir React projesine kopyalanıp
çalışabilecek şekilde yazılır.

## Farkı — `shared/hooks/` ile

Bkz. [shared/hooks/README.md](../shared/hooks/README.md). Özetle: buradaki hook'lar
uygulamayı hiç tanımaz; `shared/hooks/` bu jenerik hook'ları uygulamaya özgü bir davranışla
birleştirir.

> Şu an burada gerçek bir hook yoktur; ilk ihtiyaç doğduğunda eklenecektir (spekülatif
> olarak önceden eklenmez — bkz. proje kuralları §1.4 KISS).
