# shared/hooks/

Birden fazla feature tarafından paylaşılan, ama yine de bu uygulamaya özgü bir konvansiyon
taşıyan client hook'ları (örn. `useDebouncedSearchParam`, `usePaginationState`).

## Üst düzey `hooks/` ile farkı

Kök dizindeki [`hooks/`](../../hooks/README.md), React dışı hiçbir bağımlılığı olmayan,
tamamen jenerik hook'lar içindir (`useDebounce`, `useMediaQuery`) — bu proje için değil,
herhangi bir React projesi için yazılmış gibi düşünülmelidir. `shared/hooks/`, bu jenerik
hook'ları birleştirerek bu **uygulamaya özgü** bir davranış üreten hook'lar içindir.

> Şu an burada gerçek bir hook yoktur; ilk cross-feature ihtiyaç doğduğunda eklenecektir.
