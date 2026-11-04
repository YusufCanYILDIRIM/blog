# components/ui/

shadcn/ui CLI'nin ürettiği ham primitive component'ler bu klasöre yazılır:

```bash
npx shadcn@latest add button
npx shadcn@latest add card dialog form
```

## Kurallar

- Bu klasördeki dosyalar **elle düzenlenmez.** Bir primitive'in davranışını değiştirmek
  gerekiyorsa, onu sarmalayan (compose eden) yeni bir component `shared/components/` altında
  oluşturulur — ham primitive olduğu gibi kalır. Bu, ileride `npx shadcn add` ile
  güncelleme/yeniden üretim yapıldığında özel değişikliklerin ezilmesini önler.
- Stil/tema değişiklikleri buradaki component'lerin içinde değil, `app/globals.css`
  içindeki CSS custom property'lerinde yapılır (bkz. proje kuralları §17.3).

> Bu sprint kapsamında henüz hiçbir shadcn component'i eklenmemiştir (`npx shadcn init`
> konfigürasyonu [`components.json`](../../components.json) içinde hazır, ilk `add` komutu
> ilgili UI ihtiyacı doğduğunda çalıştırılacaktır).
