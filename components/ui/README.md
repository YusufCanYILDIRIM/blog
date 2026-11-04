# components/ui/

shadcn **base-nova** stili (`@base-ui/react` primitive'leri) ile üretilen bileşenler:
avatar, button, card, dialog, dropdown-menu, input. Yapılandırma: [`components.json`](../../components.json).

```bash
npx shadcn@4.13.1 add <bileşen>
```

## Kurallar

- Bu klasördeki dosyalar **elle düzenlenmez** ve Prettier kapsamı dışındadır. Davranış
  değişikliği gerekiyorsa bileşeni saran yeni bir bileşen `shared/components/` altında yazılır.
- Tema değişiklikleri `app/globals.css` içindeki CSS değişkenlerinde yapılır.
- Radix tabanlı `new-york` stili kullanılmaz; yeni bileşenler base-nova ile eklenir.
