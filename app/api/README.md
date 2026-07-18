# api/

Bu dizin **yalnızca dış sistem entegrasyonları** için kullanılır: webhook alıcıları (örn.
Stripe, Resend delivery event'leri), 3rd-party OAuth callback'leri, veya Auth.js'in kendi
route handler'ı (`api/auth/[...nextauth]/route.ts`).

## Neden iç CRUD burada değil?

Uygulama içi veri mutasyonları (proje/blog post oluşturma, güncelleme, silme) **Server
Actions** ile yapılır (bkz. [docs/project-rules.md](../../docs/project-rules.md) §6.2).
Bir route handler'ın burada yaşaması için gerekçe, isteğin **Next.js dışından, HTTP
protokolü üzerinden** gelmesi gerektiğidir (örn. bir webhook sağlayıcısı sizin kodunuzu
çağıramaz, yalnızca bir URL'e POST atabilir).

> Bu sprint kapsamında hiçbir route handler eklenmemiştir; bu README yalnızca klasörün
> amacını ve kullanım sınırını belgelemek için oluşturulmuştur.
