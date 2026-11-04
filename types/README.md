# types/

Herhangi bir feature'a özel **olmayan**, proje geneli tip tanımları: ortak API response
zarfı, global ambient bildirimler.

## Kural

Bir tip yalnızca bir feature içinde kullanılıyorsa `features/{feature}/types/` altında kalır;
buraya yalnızca gerçekten iki veya daha fazla feature tarafından paylaşılan tipler taşınır.
